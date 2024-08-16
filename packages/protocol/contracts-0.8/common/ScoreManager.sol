// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "@openzeppelin/contracts8/access/Ownable.sol";

contract ScoreManager is Initializable, Ownable {

  mapping (address => uint256[]) public uptimes;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   * @param newEpochDuration The duration of an epoch in seconds.
   */
  function initialize(address registryAddress, uint256 newEpochDuration) external initializer {
    _transferOwnership(msg.sender);
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
   * @notice Sets the uptimes for the given addresses.
   * @param _uptimes The uptimes to set.
   */
  function setUptimes(address group, uint256[] calldata _uptimes) external onlyOwner {
    for (uint256 i = 0; i < _uptimes.length; i++) {
      uptimes[group][i] = _uptimes[i];
    }
  }

  function getUptimes(address group) external view returns (uint256[] memory) {
    uint256[] memory result = new uint256[](uptimes[group].length);
    for (uint256 i = 0; i < uptimes[group].length; i++) {
      result[i] = uptimes[group][i];
    }
    return result;
  }
}
