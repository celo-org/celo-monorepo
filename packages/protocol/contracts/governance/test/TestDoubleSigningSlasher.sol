pragma solidity ^0.5.3;

import "../DoubleSigningSlasher.sol";
import "./SlashingTestUtils.sol";

contract TestDoubleSigningSlasher is DoubleSigningSlasher, SlashingTestUtils {
  function debugGroup(address signer, uint256 blockNumber, uint256 groupMembershipHistoryIndex)
    public
    view
    returns (address)
  {
    address validator = getAccounts().signerToAccount(signer);
    address group = getValidators().groupMembershipAtBlock(
      validator,
      blockNumber / getEpochSize(),
      groupMembershipHistoryIndex
    );
    return group;
  }

  function debug(uint256 index, uint256 blockNumber, bytes memory blockA, bytes memory blockB)
    public
    view
    returns (address, bytes32, bytes32, uint256, uint256)
  {
    uint256 epoch = blockNumber / getEpochSize();
    bytes32 mapA = getVerifiedSealBitmap(blockA);
    bytes32 mapB = getVerifiedSealBitmap(blockB);
    //    require(uint256(mapA) & (1 << index) != 0, "Didn't sign first block");
    //    require(uint256(mapB) & (1 << index) != 0, "Didn't sign second block");
    return (getEpochSigner(epoch, index), mapA, mapB, uint256(1) << index, index);
  }
}
