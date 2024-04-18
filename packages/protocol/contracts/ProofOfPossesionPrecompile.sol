pragma solidity >=0.8.7 <0.8.20;

contract ProofOfPossesionPrecompile {
  address constant _address = address(0xff - 7);

  fallback (bytes calldata) external payable returns (bytes memory) {
    return abi.encodePacked(false);
  }

}