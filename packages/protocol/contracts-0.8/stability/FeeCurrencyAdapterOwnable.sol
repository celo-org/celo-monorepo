// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

import "./FeeCurrencyAdapter.sol";

contract FeeCurrencyAdapterOwnable is FeeCurrencyAdapter, Ownable {
  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) FeeCurrencyAdapter(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _wrappedToken The address of the wrapped token.
   * @param _name The name of the wrapped token.
   * @param _symbol The symbol of the wrapped token.
   * @param _expectedDecimals The expected number of decimals of the wrapped token.
   */
  function initialize(
    address _wrappedToken,
    string memory _name,
    string memory _symbol,
    uint8 _expectedDecimals
  ) public override {
    _transferOwnership(msg.sender);
    super.initialize(_wrappedToken, _name, _symbol, _expectedDecimals);
  }

  /**
   * @notice Sets wrapped token address.
   * @param _wrappedToken The address of the wrapped token.
   */
  function setWrappedToken(address _wrappedToken) public onlyOwner {
    _setWrappedToken(_wrappedToken);
  }
}
