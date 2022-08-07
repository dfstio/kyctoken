// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';

contract KYC is Ownable {
    enum Operation {
        OperationTransferFrom,
        OperationTransferTo
    }

    struct KYClimit {
        uint256 amount;
        uint256 period;
    }

    struct KYCverification {
        uint256 expiry;
        KYClimit[] limits; // array should be sorted on period, lower values first
    }

    struct Transaction {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => mapping(Operation => KYCverification)) private verification;
    mapping(address => mapping(Operation => Transaction[])) private transactions;
    event VerificationAdded(address indexed account, Operation indexed operation);
    event VerificationRemoved(address indexed account, Operation indexed operation);
    event CheckPassed(address indexed account, Operation indexed operation, uint256 amount);
    event CheckFailed(address indexed account, Operation indexed operation, uint256 amount);

    function addVerification(
        address account,
        Operation operation,
        KYCverification calldata _verification
    ) external onlyOwner {
        verification[account][operation] = _verification;
        emit VerificationAdded(account, operation);
    }

    function revokeVerification(address account, Operation operation) external onlyOwner {
        emit VerificationRemoved(account, operation);
        verification[account][operation].expiry = 0;
    }

    function _recordTransaction(
        address account,
        Operation operation,
        uint256 amount
    ) private returns (bool) {
        transactions[account][operation].push(Transaction({amount: amount, timestamp: block.timestamp}));
        emit CheckPassed(account, operation, amount);
        return true;
    }

    function _refuseTransaction(
        address account,
        Operation operation,
        uint256 amount
    ) private returns (bool) {
        emit CheckFailed(account, operation, amount);
        return false;
    }

    function check(
        address account,
        Operation operation,
        uint256 amount
    ) external returns (bool) {
        if (block.timestamp > verification[account][operation].expiry || verification[account][operation].limits.length == 0) return false;
        uint256 index = 0; //index of KYClimit[] limits
        uint256 total = 0;
        uint256 size = transactions[account][operation].length;
        if (size == 0) {
            if (amount <= verification[account][operation].limits[0].amount) {
                return _recordTransaction(account, operation, amount);
            } else return _refuseTransaction(account, operation, amount);
        } else {
            for (uint256 i = size - 1; i >= 0; i--) {
                total += transactions[account][operation][i].amount;
                while (
                    transactions[account][operation][i].timestamp <
                    (block.timestamp - verification[account][operation].limits[index].period)
                ) {
                    index++;
                    if (index >= verification[account][operation].limits.length) return _recordTransaction(account, operation, amount);
                }
                if (total > verification[account][operation].limits[index].amount) return _refuseTransaction(account, operation, amount);
            }
        }

        return _recordTransaction(account, operation, amount);
    }

    function precheck(
        address account,
        Operation operation,
        uint256 amount
    ) external view returns (bool) {
        if (block.timestamp > verification[account][operation].expiry || verification[account][operation].limits.length == 0) return false;
        uint256 index = 0; //index of KYClimit[] limits
        uint256 total = 0;
        uint256 size = transactions[account][operation].length;
        if (size == 0) {
            if (amount <= verification[account][operation].limits[0].amount) return true;
            else return false;
        } else {
            for (uint256 i = size - 1; i >= 0; i--) {
                total += transactions[account][operation][i].amount;
                while (
                    transactions[account][operation][i].timestamp <
                    (block.timestamp - verification[account][operation].limits[index].period)
                ) {
                    index++;
                    if (index >= verification[account][operation].limits.length) return true;
                }
                if (total > verification[account][operation].limits[index].amount) return false;
            }
        }

        return true;
    }
}
