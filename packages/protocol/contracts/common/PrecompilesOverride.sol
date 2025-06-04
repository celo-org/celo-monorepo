pragma solidity ^0.5.13;

import "./interfaces/ICeloVersionedContract.sol";
import "../../contracts-0.8/common/IsL2Check.sol";
import "./UsingRegistry.sol";

import "./UsingPrecompiles.sol";

/**
 * @title PrecompilesOverride Contract
 * @notice This contract allows for a smoother transition from L1 to L2
 * by abstracting away the usingPrecompile contract, and taking care of the L1 to L2 switching logic.
 **/
contract PrecompilesOverride is UsingPrecompiles, UsingRegistry {
  /**
   * @notice Returns the epoch number at a block.
   * @param blockNumber Block number where epoch number is calculated.
   * @return Epoch number.
   */
  function getEpochNumberOfBlock(uint256 blockNumber) public view returns (uint256) {
    return getEpochManager().getEpochNumberOfBlock(blockNumber);
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
    return getEpochManager().getElectedSignerByIndex(index);
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
    return getEpochManager().numberOfElectedInCurrentSet();
  }
}
