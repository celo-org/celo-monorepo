// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/token/ERC20/ERC20.sol";
import "@celo-contracts-8/stability/interfaces/IFeeCurrency.sol";
import "@celo-contracts/common/CalledByVm.sol";

contract ExampleFeeCurrency is ERC20, IFeeCurrency {
  constructor(uint256 initialSupply) ERC20("ExampleFeeCurrency", "EFC") {
    _mint(msg.sender, initialSupply);
  }

  function debitGasFees(address from, uint256 value) external onlyVm {
    // TODO(Arthur): Check what the function visibility and modifiers should be.
    // StableToken.sol is `external onlyVm onlyWhenNotFrozen updateInflationFactor`
    _burn(from, value);
  }

  function creditGasFees(address[] calldata recipients, uint256[] calldata amounts) public {
    // TODO(Arthur): Check what the function visibility and modifiers should be.
    require(recipients.length == amounts.length, "Recipients and amounts must be the same length.");

    uint256 totalSum = 0;

    for (uint256 i = 0; i < recipients.length; i++) {
      _mint(recipients[i], amounts[i]);
      totalSum += amounts[i];
    }

    require(debited == totalSum, "Cannot credit more than debited.");
    debited = 0;
  }
}