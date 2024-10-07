pragma solidity >=0.8.7 <0.9;

address constant EPOCH_SIZEPRE_COMPILE_ADDRESS = address(0xff - 7);
contract EpochSizePrecompile {
  address constant ADDRESS = EPOCH_SIZEPRE_COMPILE_ADDRESS;

  uint256 public constant EPOCH_SIZE = 100;
  uint256 public epochSizeSet;

  receive() external payable {}

  fallback(bytes calldata) external payable returns (bytes memory) {
    // this is required  because when the migrations deploy the precompiles
    // they don't get constructed
    if (epochSizeSet != 0) {
      return abi.encodePacked(epochSizeSet);
    }
    return abi.encodePacked(EPOCH_SIZE);
  }

  function setEpochSize(uint256 epochSize) public {
    epochSizeSet = epochSize;
  }

  function getAddress() public pure returns (address) {
    return ADDRESS;
  }
}
