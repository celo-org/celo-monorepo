// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

import "../../contracts/common/Initializable.sol";
import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../../contracts/governance/interfaces/IEpochRewards.sol";

contract EpochManagerInitializer is Initializable, UsingPrecompiles, UsingRegistry {
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

  function numberValidatorsInCurrentSet() public view returns (uint256) {
    // FIXME
    return 0;
  }

  function validatorSignerAddressFromCurrentSet(uint256 i) public view returns (address) {
    // FIXME
    return address(0);
  }

  /**
   * @notice initializes the epochManager contract during L2 transition.
   */
  function initEpochManager() external onlyOwner {
    uint256 currentEpoch = getEpochNumber();

    uint256 numberElectedValidators = numberValidatorsInCurrentSet();

    address[] memory electedValidatorAddresses = new address[](numberElectedValidators);

    for (uint256 i = 0; i < numberElectedValidators; i++) {
      address validatorAddress = validatorSignerAddressFromCurrentSet(i);
      electedValidatorAddresses[i] = validatorAddress;
    }
    getEpochManager().initializeSystem(
      currentEpoch,
      _getFirstBlockOfEpoch(currentEpoch),
      electedValidatorAddresses
    );
  }

  function getFirstBlockOfEpoch(uint256 currentEpoch) internal view returns (uint256) {
    uint256 blockToCheck = block.number - 1;
    uint256 blockEpochNumber = getEpochNumberOfBlock(blockToCheck);

    while (blockEpochNumber == currentEpoch) {
      blockToCheck--;
      blockEpochNumber = getEpochNumberOfBlock(blockToCheck);
    }
    return blockToCheck;
  }

  function getFirstBlockOfEpoch(uint256 currentEpoch) external view returns (uint256) {
    return _getFirstBlockOfEpoch(currentEpoch);
  }
}
