// TODO move this to test folder
pragma solidity >=0.8.7 <0.8.20;

address constant EPOCH_SIZEPRE_COMPILE_ADDRESS = address(0xff - 7);

contract EpochSizePrecompile {
  address constant ADDRESS = EPOCH_SIZEPRE_COMPILE_ADDRESS;

  uint256 public EPOCH_SIZE = 100;

  receive() external payable {}

  fallback(bytes calldata) external payable returns (bytes memory) {
    return abi.encodePacked(EPOCH_SIZE);
  }

  function setEpochSize(uint256 epochSize) public {
    EPOCH_SIZE = epochSize;
  }

  function getAddress() public pure returns (address) {
    return ADDRESS;
  }
}
