// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

contract ScoreManager is Initializable, Ownable {
  mapping(address => uint256) public groupScores;
  mapping(address => uint256) public validatorsScores;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  function setGroupScore(address group, uint256 score) external onlyOwner {
    groupScores[group] = score;
  }

  function setValidatorScore(address validator, uint256 score) external onlyOwner {
    validatorsScores[validator] = score;
  }

  function getGroupScore(address group) external view returns (uint256) {
    return groupScores[group];
  }

  function getValidatorScore(address validator) external view returns (uint256) {
    return validatorsScores[validator];
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }
}
