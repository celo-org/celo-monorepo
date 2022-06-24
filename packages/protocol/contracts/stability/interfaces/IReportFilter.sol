pragma solidity 0.5.13;

/**
 * @title Report Filter Interface
 * @notice Defines the interface for a report filter contract.
 */
interface IReportFilter {
  /**
   * @notice Emitted when the filter condition array is updated
   * @param newFilterConditions The addresses of the updated filter conditions.
   */
  event UpdatedFilterConditions(address[] newFilterConditions);

  /**
   * @notice Emitted when a filter condition is met
   * @param token The address of the token for which the report is being made.
   * @param value The new report value for the token specified.
   * @param filterCondition The address of the filter condition that was met.
   */
  event ConditionMet(address indexed token, uint256 value, address indexed filterCondition);

  /**
   * @notice Check whether or not a specified price report meets any of the filter conditions.
   * @param token The address of the token for which the report is being made.
   * @param value The new report value for the token specified.
   * @return conditionMet bool indicating whether or not the report should be filtered.
   */
  function shouldFilter(address token, uint256 value) external view returns (bool conditionMet);
}
