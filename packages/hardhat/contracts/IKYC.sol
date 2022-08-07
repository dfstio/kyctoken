// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IKYC {
    function check(
        address account,
        uint8 operation,
        uint256 amount
    ) external returns (bool);
}
