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
    uint256 private _price;

    event VerificationAdded(address indexed account, Operation indexed operation);
    event VerificationRemoved(address indexed account, Operation indexed operation);
    event CheckPassed(address indexed account, Operation indexed operation, uint256 amount);
    event CheckFailed(address indexed account, Operation indexed operation, uint256 amount);
    event PriceChanged(uint256 newPrice, uint256 oldPrice);

    constructor(uint256 price) {
        _price = price;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = _price;
        _price = newPrice;
        emit PriceChanged(newPrice, oldPrice);
    }

    function getPrice() external view returns (uint256 price) {
        return _price;
    }

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

    function check(
        address account,
        Operation operation,
        uint256 amount
    ) external returns (bool) {
        (bool result, ) = precheck(account, operation, amount);
        if (result) emit CheckPassed(account, operation, amount);
        else emit CheckFailed(account, operation, amount);
        return result;
    }

    function precheck(
        address account,
        Operation operation,
        uint256 amount
    ) public view returns (bool result, string memory reason) {
        if (block.timestamp > verification[account][operation].expiry || verification[account][operation].limits.length == 0)
            return (false, 'KYC: no limit');
        uint256 index = 0; //index of KYClimit[] limits
        uint256 total = 0;
        uint256 size = transactions[account][operation].length;
        if (size == 0) {
            if (amount * _price <= verification[account][operation].limits[0].amount) return (true, '');
            else return (false, 'KYC: low limit');
        } else {
            for (uint256 i = size - 1; i >= 0; i--) {
                total += transactions[account][operation][i].amount;
                while (
                    transactions[account][operation][i].timestamp <
                    (block.timestamp - verification[account][operation].limits[index].period)
                ) {
                    index++;
                    if (index >= verification[account][operation].limits.length) return (true, '');
                }
                if (total * _price > verification[account][operation].limits[index].amount) return (false, 'KYC: low total limit');
            }
        }

        return (true, '');
    }
}
