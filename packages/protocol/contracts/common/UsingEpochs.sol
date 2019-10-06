pragma solidity ^0.5.3;

// TODO: Replace this with a precompile.
contract UsingEpochs {

  event RegistrySet(address indexed registryAddress);

  // TODO(asa): Expose epoch size via precompile.
  // solhint-disable state-visibility
  uint256 constant EPOCH = 10;

  function getEpochNumber() public view returns (uint256) {
    uint256 ret = block.number / EPOCH;
    if (block.number % EPOCH == 0) {
      ret = ret - 1;
    }
    return ret;
  }
}
