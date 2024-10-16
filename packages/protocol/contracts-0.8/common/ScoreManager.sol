// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

import "../../contracts/common/interfaces/IScoreManagerGovernance.sol";
import "../../contracts/common/interfaces/IScoreManager.sol";

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
  uint256 public constant ZERO_FIXED1_UINT = FIXED1_UINT + 1;

  mapping(address => uint256) public groupScores;
  mapping(address => uint256) public validatorScores;
  address private scoreManagerSetter;

  event GroupScoreSet(address indexed group, uint256 score);
  event ValidatorScoreSet(address indexed validator, uint256 score);
  event ScoreManagerSetterSet(address indexed scoreManagerSetter);

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

  function setGroupScore(address group, uint256 score) external onlyAuthorizedToUpdateScore {
    require(
      score <= ZERO_FIXED1_UINT,
      "Score must be less than or equal to 1e24 or ZERO_FIXED1_UINT."
    );
    groupScores[group] = score;

    emit GroupScoreSet(group, score);
  }

  function setValidatorScore(
    address validator,
    uint256 score
  ) external onlyAuthorizedToUpdateScore {
    require(
      score <= ZERO_FIXED1_UINT,
      "Score must be less than or equal to 1e24 or ZERO_FIXED1_UINT."
    );
    validatorScores[validator] = score;

    emit ValidatorScoreSet(validator, score);
  }

  function setScoreManagerSetter(address _scoreManagerSetter) external onlyOwner {
    scoreManagerSetter = _scoreManagerSetter;
    emit ScoreManagerSetterSet(_scoreManagerSetter);
  }

  function getGroupScore(address group) external view returns (uint256) {
    return getScore(groupScores[group]);
  }

  function getValidatorScore(address validator) external view returns (uint256) {
    return getScore(validatorScores[validator]);
  }

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

  function getScore(uint256 score) internal pure returns (uint256) {
    if (score == 0) {
      return FIXED1_UINT;
    } else if (score == ZERO_FIXED1_UINT) {
      return 0;
    }
    return score;
  }
}
