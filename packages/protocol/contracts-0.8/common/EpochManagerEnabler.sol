// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../../contracts/common/interfaces/IEpochManagerEnabler.sol";
import "../../contracts/governance/interfaces/IEpochRewards.sol";

contract EpochManagerEnabler is Initializable, UsingPrecompiles, UsingRegistry {
  uint256 public lastKnownEpochNumber;
  uint256 public lastKnownFirstBlockOfEpoch;
  address[] public lastKnownElectedAccounts;

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
  }

  /**
   * @notice initializes the epochManager contract during L2 transition.
   */
  function initEpochManager() external onlyL2 {
    require(lastKnownEpochNumber != 0, "lastKnownEpochNumber not set.");
    require(lastKnownFirstBlockOfEpoch != 0, "lastKnownFirstBlockOfEpoch not set.");
    require(lastKnownElectedAccounts.length > 0, "lastKnownElectedAccounts not set.");
    getEpochManager().initializeSystem(
      lastKnownEpochNumber,
      lastKnownFirstBlockOfEpoch,
      lastKnownElectedAccounts
    );
  }

  /**
   * @notice Stores the last known epochNumber and the related elected validator accounts.
   */
  function captureEpochAndValidators() external onlyL1 {
    lastKnownEpochNumber = getEpochNumber();

    uint256 numberElectedValidators = numberValidatorsInCurrentSet();
    lastKnownElectedAccounts = new address[](numberElectedValidators);
    lastKnownFirstBlockOfEpoch = _getFirstBlockOfEpoch(lastKnownEpochNumber);

    for (uint256 i = 0; i < numberElectedValidators; i++) {
      // TODO: document how much gas this takes for 110 signers
      address validatorAccountAddress = getAccounts().validatorSignerToAccount(
        validatorSignerAddressFromCurrentSet(i)
      );
      lastKnownElectedAccounts[i] = validatorAccountAddress;
    }
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

  function getFirstBlockOfEpoch(uint256 currentEpoch) external view returns (uint256) {
    return _getFirstBlockOfEpoch(currentEpoch);
  }

  function _getFirstBlockOfEpoch(uint256 currentEpoch) internal view returns (uint256) {
    uint256 blockToCheck = block.number - 1;
    uint256 blockEpochNumber = getEpochNumberOfBlock(blockToCheck);

    while (blockEpochNumber == currentEpoch) {
      blockToCheck--;
      blockEpochNumber = getEpochNumberOfBlock(blockToCheck);
    }
    return blockToCheck;
  }
}
