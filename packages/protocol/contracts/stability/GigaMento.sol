pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/FixidityLib.sol";

/**
 * @title Facilitates large mints with dollar-pegged stablecoins other than cUSD.
 */
contract GigaMento is Ownable, Initializable, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;

  address private _multisig;

  /**
   * @notice Sets initialized == true on implementation contracts.
   * @param test Set to true to skip implementation initialization.
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _registry The address of the registry.
   */
  function initialize(address _registry) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(_registry);
    _multisig = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyMultiSig() {
    require(_multisig == _msgSender(), "Ownable::caller is not multisig");
    _;
  }

  function addStable(address addressOfStable, address addressOfCeloStable) public {}

  function exchange(address addressOfStable, address addressOfCeloStable, bool sellCeloStable)
    public
  {}

  function setSpreadSellStable(uint256 spread) public {}

  function setSpreadBuyCeloStable(uint256 spread) public {}

  function setMaxPercentStageRefill(uint256 percent) public {}

  function setMaxBucketRefillPeriod(uint256 periodInSeconds) public {}

  function setMaxPercentageLiquidity(address addressOfStable) public {}

  function submitOracleReport(address addressOfStable, bool pegOk) public {}

  function resetCircuitBreaker() public onlyMultiSig {}

  function killSwitch(bool switchKilled) public onlyMultiSig {}

  function allowOracle(address addressOfStable, address oracleAddress) public {}

  function setResetCircuitBreakerAddress(address resetCircuitBreakerAddress) public {}
}
