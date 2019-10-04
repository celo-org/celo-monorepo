pragma solidity ^0.5.3;

// TODO: Replace this with a precompile.
contract UsingEpochs {

  event RegistrySet(address indexed registryAddress);

  // solhint-disable state-visibility
  uint256 constant EPOCH = 17280;

  function getEpochNumber() public view returns (uint256) {
    return block.number / EPOCH;
  }
}
