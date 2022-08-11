// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './kyc.sol';

contract KERC20 is ERC20Permit, KYC {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        uint256 initialPrice
    ) ERC20(name_, symbol_) ERC20Permit(name_) KYC(initialPrice) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        if (!kycCheck(from, to, amount)) return false;
        return super.transferFrom(from, to, amount);
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        if (!kycCheck(_msgSender(), to, amount)) return false;
        return super.transfer(to, amount);
    }
}
