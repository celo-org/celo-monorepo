// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../../contracts/governance/interfaces/IEpochRewards.sol";
import "../../contracts/common/interfaces/IEpochManagerEnabler.sol";
import "./interfaces/IEpochManagerEnablerInitializer.sol";

contract EpochManagerEnabler is
  Initializable,
  UsingPrecompiles,
  UsingRegistry,
  IEpochManagerEnabler,
  IEpochManagerEnablerInitializer
{
  uint256 public lastKnownEpochNumber;
  uint256 public lastKnownFirstBlockOfEpoch;
  address[] public lastKnownElectedAccounts;

  event LastKnownEpochNumberSet(uint256 lastKnownEpochNumber);
  event LastKnownFirstBlockOfEpochSet(uint256 lastKnownFirstBlockOfEpoch);
  event LastKnownElectedAccountsSet();

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
    emit LastKnownEpochNumberSet(lastKnownEpochNumber);

    uint256 numberElectedValidators = numberValidatorsInCurrentSet();
    lastKnownElectedAccounts = new address[](numberElectedValidators);
    _setFirstBlockOfEpoch();

    for (uint256 i = 0; i < numberElectedValidators; i++) {
      // TODO: document how much gas this takes for 110 signers
      address validatorAccountAddress = getAccounts().validatorSignerToAccount(
        validatorSignerAddressFromCurrentSet(i)
      );
      lastKnownElectedAccounts[i] = validatorAccountAddress;
    }
    emit LastKnownElectedAccountsSet();
  }

  /**
   * @return a list of know elected validator accounts.
   */
  function getlastKnownElectedAccounts() external view returns (address[] memory) {
    return lastKnownElectedAccounts;
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

  function _setFirstBlockOfEpoch() internal onlyL1 {
    uint256 blocksSinceEpochBlock = block.number % getEpochSize();
    uint256 epochBlock = block.number - blocksSinceEpochBlock;
    lastKnownFirstBlockOfEpoch = epochBlock;
    emit LastKnownFirstBlockOfEpochSet(lastKnownFirstBlockOfEpoch);
  }
}
