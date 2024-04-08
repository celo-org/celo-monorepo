pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./SlasherUtil.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

contract DowntimeSlasher is ICeloVersionedContract, SlasherUtil {
  using SafeMath for uint256;

  // Maps validator address -> end block of the latest interval for which it has been slashed.
  mapping(address => uint256) public lastSlashedBlock;

  // Maps user address -> startBlock -> endBlock -> signature bitmap for that interval.
  // Note that startBlock and endBlock must always be in the same epoch.
  mapping(address => mapping(uint256 => mapping(uint256 => bytes32))) public bitmaps;

  uint256 public slashableDowntime;

  event SlashableDowntimeSet(uint256 interval);
  event DowntimeSlashPerformed(
    address indexed validator,
    uint256 indexed startBlock,
    uint256 indexed endBlock
  );
  event BitmapSetForInterval(
    address indexed sender,
    uint256 indexed startBlock,
    uint256 indexed endBlock,
    bytes32 bitmap
  );

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (2, 0, 0, 0);
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public SlasherUtil(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _penalty Penalty for the slashed validator.
   * @param _reward Reward that the observer gets.
   * @param _slashableDowntime Slashable downtime in blocks.
   */
  function initialize(
    address registryAddress,
    uint256 _penalty,
    uint256 _reward,
    uint256 _slashableDowntime
  ) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }
}
