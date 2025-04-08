pragma solidity ^0.5.13;

import "./interfaces/ICeloVersionedContract.sol";
import "../../contracts-0.8/common/IsL2Check.sol";
import "./UsingRegistryV2.sol";

import "./UsingPrecompiles.sol";

/**
 * @title PrecompilesOverride Contract
 * @notice This contract allows for a smoother transition from L1 to L2
 * by abstracting away the usingPrecompile contract, and taking care of the L1 to L2 switching logic.
 * @dev This is a version of the contract that uses UsingRegistryV2, i.e. it
 * uses a hardcoded constant for the Registry address.
 **/
contract PrecompilesOverrideV2 is UsingPrecompiles, UsingRegistryV2 {
  /**
   * @notice Returns the epoch number at a block.
   * @param blockNumber Block number where epoch number is calculated.
   * @return Epoch number.
   */
  function getEpochNumberOfBlock(uint256 blockNumber) public view returns (uint256) {
    if (isL2()) {
      return getEpochManager().getEpochNumberOfBlock(blockNumber);
    } else {
      return epochNumberOfBlock(blockNumber, getEpochSize());
    }
  }

  /**
   * @notice Returns the epoch number at a block.
   * @return Current epoch number.
   */
  function getEpochNumber() public view returns (uint256) {
    return getEpochNumberOfBlock(block.number);
  }

  /**
   * @notice Gets a validator signer address from the current validator set.
   * @param index Index of requested validator in the validator set.
   * @return Address of validator signer at the requested index.
   */
  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    if (isL2()) {
      return getEpochManager().getElectedSignerByIndex(index);
    } else {
      super.validatorSignerAddressFromCurrentSet(index);
    }
  }

  /**
   * @notice Gets a validator address from the current validator set.
   * @param index Index of requested validator in the validator set.
   * @return Address of validator at the requested index.
   */
  function validatorAddressFromCurrentSet(uint256 index) public view onlyL2 returns (address) {
    return getEpochManager().getElectedAccountByIndex(index);
  }

  /**
   * @notice Gets the size of the current elected validator set.
   * @return Size of the current elected validator set.
   */
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    if (isL2()) {
      return getEpochManager().numberOfElectedInCurrentSet();
    } else {
      return super.numberValidatorsInCurrentSet();
    }
  }
}
