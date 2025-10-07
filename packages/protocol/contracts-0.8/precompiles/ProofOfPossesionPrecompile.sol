pragma solidity >=0.8.7 <0.8.20;

import "forge-std/console.sol";

contract ProofOfPossesionPrecompile {
  address constant _address = address(0xff - 7);

  fallback(bytes calldata) external payable returns (bytes memory) {
    console.log(
      "WARNING, Proof Of Possesion Precompile called but not implemented in VM. Check not performed."
    );
    return abi.encodePacked(false);
  }
}
