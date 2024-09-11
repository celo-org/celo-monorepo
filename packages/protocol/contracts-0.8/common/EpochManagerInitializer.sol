// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../../contracts/governance/interfaces/IEpochRewards.sol";

contract EpochManagerInitializer is Initializable, UsingPrecompiles, UsingRegistry {
  uint256 public lastKnownEpochNumber;
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
    require(lastKnownElectedAccounts.length > 0, "lastKnownElectedAccounts not set.");
    getEpochManager().initializeSystem(
      lastKnownEpochNumber,
      _getFirstBlockOfEpoch(lastKnownEpochNumber),
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

    for (uint256 i = 0; i < numberElectedValidators; i++) {
      // TODO: document how much gas this takes for 110 signers
      address validatorAccountAddress = getAccounts().validatorSignerToAccount(
        validatorSignerAddressFromCurrentSet(i)
      );
      lastKnownElectedAccounts[i] = validatorAccountAddress;
    }
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
