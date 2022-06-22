pragma solidity 0.5.13;

/**
 * @title Filter Condition Interface
 * @notice Encapsulates logic needed to determine whether or not a given report should be filtered.
 */
interface IFilterCondition {
  /**
   * @notice Checks whether or not a specified price report meets the filter condition.
   * @param token The address of the token for which the report is being made.
   * @param value The new report value for the token specified.
   * @return conditionMet Bool indicating whether or not the condition is met.
   */
  function isConditionMet(address token, uint256 value) external view returns (bool conditionMet);
}
