// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.9;

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

contract ScoreManager is Initializable, Ownable {
  struct Score {
    uint256 score;
    bool exists;
  }

  event GroupScoreSet(address indexed group, uint256 score);
  event ValidatorScoreSet(address indexed validator, uint256 score);

  uint256 private constant FIXED1_UINT = 1e24;

  mapping(address => Score) public groupScores;
  mapping(address => Score) public validatorScores;

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
    require(score <= FIXED1_UINT, "Score must be less than or equal to 1e24.");
    Score storage groupScore = groupScores[group];
    if (!groupScore.exists) {
      groupScore.exists = true;
    }
    groupScore.score = score;

    emit GroupScoreSet(group, score);
  }

  function setValidatorScore(address validator, uint256 score) external onlyOwner {
    require(score <= FIXED1_UINT, "Score must be less than or equal to 1e24.");
    Score storage validatorScore = validatorScores[validator];
    if (!validatorScore.exists) {
      validatorScore.exists = true;
    }
    validatorScore.score = score;

    emit ValidatorScoreSet(validator, score);
  }

  function getGroupScore(address group) external view returns (uint256) {
    Score storage groupScore = groupScores[group];
    if (!groupScore.exists) {
      return FIXED1_UINT;
    }
    return groupScore.score;
  }

  function getValidatorScore(address validator) external view returns (uint256) {
    Score storage validatorScore = validatorScores[validator];
    if (!validatorScore.exists) {
      return FIXED1_UINT;
    }
    return validatorScore.score;
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
