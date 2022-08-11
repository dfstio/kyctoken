// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';

contract KYC is Ownable {
    enum Operation {
        TransferFrom,
        TransferTo
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
    event TransferFailed(address indexed from, address indexed to, uint256 amount);
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

    function kycCheck(
        address from,
        address to,
        uint256 amount
    ) internal returns (bool) {
        (bool resultFrom, ) = kycTest(from, Operation.TransferFrom, amount);
        if (resultFrom) {
            (bool resultTo, ) = kycTest(to, Operation.TransferTo, amount);
            if (resultTo) {
                transactions[from][Operation.TransferFrom].push(Transaction(amount, block.timestamp));
                transactions[to][Operation.TransferTo].push(Transaction(amount, block.timestamp));
                return true;
            }
        }
        emit TransferFailed(from, to, amount);
        return false;
    }

    function kycTest(
        address account,
        Operation operation,
        uint256 amount
    ) public view returns (bool result, string memory reason) {
        if (block.timestamp > verification[account][operation].expiry || verification[account][operation].limits.length == 0)
            return (false, 'KYC: there is no limit');
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
