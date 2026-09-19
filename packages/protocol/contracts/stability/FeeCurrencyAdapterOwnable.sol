// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.9.0;

import "@openzeppelin/contracts8/access/Ownable.sol";
import "@openzeppelin/contracts8/token/ERC20/IERC20.sol";

import "./FeeCurrencyAdapter.sol";

contract FeeCurrencyAdapterOwnable is FeeCurrencyAdapter, Ownable {
  uint256[49] __gap2;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) FeeCurrencyAdapter(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _adaptedToken The address of the adapted token.
   * @param _name The name of the adapted token.
   * @param _symbol The symbol of the adapted token.
   * @param _expectedDecimals The expected number of decimals of the adapted token.
   */
  /**
   * @dev Deliberately carries no `initializer` modifier. The guard lives on the
   * FeeCurrencyAdapter.initialize this delegates to, and Initializable's modifier sets the
   * flag before running the body, so declaring it here as well would make that parent call
   * revert on the very first initialization. A repeat call reverts inside the parent, which
   * rolls back the ownership transfer above it.
   */
  function initialize(
    address _adaptedToken,
    string memory _name,
    string memory _symbol,
    uint8 _expectedDecimals
  ) public override {
    _transferOwnership(msg.sender);
    FeeCurrencyAdapter.initialize(_adaptedToken, _name, _symbol, _expectedDecimals);
  }

  /**
   * @notice Sets adapted token address.
   * @param _adaptedToken The address of the adapted token.
   */
  function setAdaptedToken(address _adaptedToken) public onlyOwner {
    _setAdaptedToken(_adaptedToken);
  }
}
