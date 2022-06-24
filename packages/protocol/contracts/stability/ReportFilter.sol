pragma solidity 0.5.13;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import { IReportFilter } from "./interfaces/IReportFilter.sol";
import { IFilterCondition } from "./interfaces/IFilterCondition.sol";

/**
 * @title   Report Filter Contract
 * @notice  This contract is responsible for maintaining references to active
 *          FilterCondition contracts and checking if conditions are met by a specified report.
 */
contract ReportFilter is IReportFilter, Ownable {
  /**
   * @notice Array of filter conditions
   */
  address[] public filterConditions;

  /**
   * @dev Constructor
   */
  constructor(address[] memory _filterConditions) public {
    _transferOwnership(msg.sender);
    setFilterConditions(_filterConditions);
  }

  /**
   * @dev Overwrites the current array of filter conditions with the specified array.
   * @param _filterConditions The new array of filter condition addresses.
   */
  function setFilterConditions(address[] memory _filterConditions) public onlyOwner {
    filterConditions = _filterConditions;
    emit UpdatedFilterConditions(_filterConditions);
  }

  /**
   * @notice Check whether or not a specified price report meets any of the filter conditions.
   * @param token The address of the token for which the report is being made.
   * @param value The new report value for the token specified.
   * @return conditionMet bool indicating whether or not the report should be filtered.
   */
  function shouldFilter(address token, uint256 value) external view returns (bool conditionMet) {
    address[] memory _filterConditions = filterConditions;
    for (uint256 i = 0; i < _filterConditions.length; ++i) {
      conditionMet = IFilterCondition(_filterConditions[i]).isConditionMet(token, value);
      if (conditionMet) {
        break;
      }
    }
  }
}
