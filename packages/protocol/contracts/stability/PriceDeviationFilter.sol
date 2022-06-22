pragma solidity 0.5.13;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import { IFilterCondition } from "./interfaces/IFilterCondition.sol";
import { ISortedOracles } from "./interfaces/ISortedOracles.sol";

import { SortedLinkedListWithMedian } from "../common/linkedlists/SortedLinkedListWithMedian.sol";
import { UsingRegistry } from "../common/UsingRegistry.sol";
import { Exchange } from "./Exchange.sol";

import { FixidityLib } from "../common/FixidityLib.sol";

/**
 * @title Price Deviation Filter Contract
 * @notice Filters oracle price reports that deviate more than specified percentage.
 */
contract PriceDeviationFilter is IFilterCondition, UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;

  /**
   * @dev Emitted when the maxPercentageDeviation is updated.
   * @param maxPercentageDeviation The new maxPercentageDeviation.
   */
  event maxDeviationUpdated(uint256 maxPercentageDeviation);

  /**
   * @notice  Max percentage deviation of prices to be used when checking new report
   *          against existing reports.
   */
  uint256 public maxPercentageDeviation;

  /**
   * @dev Constructor
   */
  constructor(uint256 _maxPercentageDeviation) public {
    _transferOwnership(msg.sender);
    maxPercentageDeviation = _maxPercentageDeviation;
  }

  /**
   * @dev Updates the max percentage deviation value.
   * @param _maxPercentageDeviation The new max percentage deviation to be used.
   */
  function updateMaxPercentageDeviation(uint256 _maxPercentageDeviation) external onlyOwner {
    maxPercentageDeviation = _maxPercentageDeviation;
    emit maxDeviationUpdated(_maxPercentageDeviation);
  }

  /**
   * @notice Checks whether or not a specified price report meets the filter condition
   * @param token The address of the token for which the report is being made.
   * @param value The new report value for the token specified.
   * @return conditionMet bool indicating whether or not the condition is met.
   */
  function isConditionMet(address token, uint256 value) external view returns (bool conditionMet) {
    ISortedOracles sortedOracles = ISortedOracles(
      registry.getAddressForOrDie(SORTED_ORACLES_REGISTRY_ID)
    );

    (address[] memory oracleAddresses, uint256[] memory values, ) = sortedOracles.getRates(token);

    uint256 sum;
    bool shouldAppendNewValue = true;
    for (uint256 i = 0; i < values.length; ++i) {
      if (oracleAddresses[i] == msg.sender) {
        // If this is the index of the oracle that made the new report, use the new value.
        sum += value;
        shouldAppendNewValue = false;
      } else {
        sum += values[i];
      }
    }

    if (shouldAppendNewValue) {
      values[values.length + 1] = value;
      sum += value;
    }

    FixidityLib.Fraction memory mean = FixidityLib.newFixed(sum).divide(
      FixidityLib.newFixed(values.length)
    );

    FixidityLib.Fraction[] memory arrNormalizedAbsMeanDev = new FixidityLib.Fraction[](
      values.length
    );

    for (uint256 i = 0; i < values.length; ++i) {
      arrNormalizedAbsMeanDev[i] = (FixidityLib.newFixed(values[i]).divide(mean)).subtract(
        FixidityLib.fixed1() //TODO: absolute diff
      );
    }

    //TODO: get max

    return false;
  }
}
