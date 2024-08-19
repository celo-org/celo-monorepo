// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.8.20;

// Note: This is not an exact copy of UsingPrecompiles in the contract's folder, but in solidity 0.8

import "../../contracts/common/interfaces/ICeloVersionedContract.sol";
import "../common/IsL2Check.sol";

contract UsingPrecompiles is IsL2Check {
  address constant TRANSFER = address(0xff - 2);
  address constant FRACTION_MUL = address(0xff - 3);
  address constant PROOF_OF_POSSESSION = address(0xff - 4);
  address constant GET_VALIDATOR = address(0xff - 5);
  address constant NUMBER_VALIDATORS = address(0xff - 6);
  address constant EPOCH_SIZE = address(0xff - 7);
  address constant BLOCK_NUMBER_FROM_HEADER = address(0xff - 8);
  address constant HASH_HEADER = address(0xff - 9);
  address constant GET_PARENT_SEAL_BITMAP = address(0xff - 10);
  address constant GET_VERIFIED_SEAL_BITMAP = address(0xff - 11);
  uint256 constant DAY = 86400;

  /**
   * @notice Returns the current epoch size in blocks.
   * @return The current epoch size in blocks.
   */
  function getEpochSize() public view returns (uint256) {
    // FIXME
    return 0;
    // if (isL2()) {
    //   return DAY.div(5);
    // } else {
    //   bytes memory out;
    //   bool success;
    //   (success, out) = EPOCH_SIZE.staticcall(abi.encodePacked(true));
    //   require(success, "error calling getEpochSize precompile");
    //   return getUint256FromBytes(out, 0);
    // }
  }

  /**
   * @notice Returns the epoch number at a block.
   * @param blockNumber Block number where epoch number is calculated.
   * @return Epoch number.
   */
  function getEpochNumberOfBlock(uint256 blockNumber) public view returns (uint256) {
    return 0;
    // FIXME
    // return epochNumberOfBlock(blockNumber, getEpochSize());
  }

  /**
   * @notice Returns the epoch number at a block.
   * @return Current epoch number.
   */
  function getEpochNumber() public view returns (uint256) {
    return getEpochNumberOfBlock(block.number);
  }
}
