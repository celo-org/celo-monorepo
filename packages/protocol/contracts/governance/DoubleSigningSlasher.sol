pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

import "./SlasherUtil.sol";

contract DoubleSigningSlasher is ICeloVersionedContract, SlasherUtil {
  using SafeMath for uint256;

  // For each signer address, check if a block header has already been slashed
  mapping(address => mapping(bytes32 => bool)) isSlashed;

  event SlashingIncentivesSet(uint256 penalty, uint256 reward);
  event DoubleSigningSlashPerformed(address indexed validator, uint256 indexed blockNumber);

  /**
  * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return Storage version of the contract.
   * @return Major version of the contract.
   * @return Minor version of the contract.
   * @return Patch version of the contract.
  */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 1, 0);
  }

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public SlasherUtil(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param _penalty Penalty for the slashed signer.
   * @param _reward Reward that the observer gets.
   */
  function initialize(address registryAddress, uint256 _penalty, uint256 _reward)
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }
}
