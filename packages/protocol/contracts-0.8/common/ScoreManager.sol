// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

import "../../contracts/common/interfaces/IScoreManagerGovernance.sol";
import "../../contracts/common/interfaces/IScoreManager.sol";

/**
 * @title ScoreManager contract
 * @notice This contract updates the score of validators and validator groups on L2.
 * This replaces the previous method of calculating scores based on validator uptime
 * with a governable score.
 */
contract ScoreManager is
  Initializable,
  Ownable,
  IScoreManager,
  IScoreManagerGovernance,
  ICeloVersionedContract
{
  struct Score {
    uint256 score;
    bool exists;
  }

  uint256 private constant FIXED1_UINT = 1e24;
  uint256 public constant ZERO_SCORE = FIXED1_UINT + 1;

  mapping(address => uint256) public groupScores;
  mapping(address => uint256) public validatorScores;
  address private scoreManagerSetter;

  event GroupScoreSet(address indexed group, uint256 score);
  event ValidatorScoreSet(address indexed validator, uint256 score);
  event ScoreManagerSetterSet(address indexed scoreManagerSetter);

  /**
   * @notice Reverts if msg.sender is not authorized to update score.
   */
  modifier onlyAuthorizedToUpdateScore() {
    require(
      msg.sender == owner() || scoreManagerSetter == msg.sender,
      "Sender not authorized to update score"
    );
    _;
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
  }

  /**
   * @notice Sets the group score for a specified group.
   * @param group The address of the group whose score will be updated.
   * @param score The new score of the group to be updated.
   * @dev Set value to `ZERO_SCORE` to set score to zero.
   */
  function setGroupScore(address group, uint256 score) external onlyAuthorizedToUpdateScore {
    require(score > 0, "Score must be greater than ZERO.");
    require(score <= ZERO_SCORE, "Score must be less than or equal to 1e24 or ZERO_SCORE.");
    groupScores[group] = score;

    emit GroupScoreSet(group, score);
  }

  /**
   * @notice Sets the score for a specified validator.
   * @param validator The address of the validator whose score will be updated.
   * @param score The new score of the validator to be updated.
   * @dev Set value to `ZERO_SCORE` to set score to zero.
   */
  function setValidatorScore(
    address validator,
    uint256 score
  ) external onlyAuthorizedToUpdateScore {
    require(score > 0, "Score must be greater than ZERO.");
    require(score <= ZERO_SCORE, "Score must be less than or equal to 1e24 or ZERO_SCORE.");
    validatorScores[validator] = score;

    emit ValidatorScoreSet(validator, score);
  }

  /**
   * @notice Sets the whitelisted address allowed to set validator and group scores.
   * @param _scoreManagerSetter Address of whitelisted score setter.
   */
  function setScoreManagerSetter(address _scoreManagerSetter) external onlyOwner {
    scoreManagerSetter = _scoreManagerSetter;
    emit ScoreManagerSetterSet(_scoreManagerSetter);
  }

  /**
   * @notice Returns the score of the specified group.
   * @param group The address of the group of interest.
   */
  function getGroupScore(address group) external view returns (uint256) {
    return getScore(groupScores[group]);
  }

  /**
   * @notice Returns the score of the specified validator.
   * @param validator The address of the validator of interest.
   */
  function getValidatorScore(address validator) external view returns (uint256) {
    return getScore(validatorScores[validator]);
  }

  /**
   * @notice Returns the address of the whitelisted score setter.
   */
  function getScoreManagerSetter() external view returns (address) {
    return scoreManagerSetter;
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

  /**
   * @notice Returns the actual score based on the input value.
   * @param score The value from `validatorScores` or `groupScores` mappings.
   * @dev To set the score to 100% by default when the contract is first initialized
   * or when new groups or validators are added, the default score of 0 returns 1e24.
   * Conversly, a score of (1e24)+1 returns 0.
   */
  function getScore(uint256 score) internal pure returns (uint256) {
    if (score == 0) {
      return FIXED1_UINT;
    } else if (score == ZERO_SCORE) {
      return 0;
    }
    return score;
  }
}
