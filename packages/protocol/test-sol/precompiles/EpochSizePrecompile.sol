// TODO move this to test folder
pragma solidity >=0.8.7 <0.8.20;

contract EpochSizePrecompile {
  address constant ADDRESS = address(0xff - 7);

  uint256 public constant EPOCH_SIZE = 100;

  receive() external payable {}

  fallback(bytes calldata) external payable returns (bytes memory) {
    return abi.encodePacked(EPOCH_SIZE);
  }

  function getAddress() public pure returns (address) {
    return ADDRESS;
  }
}
