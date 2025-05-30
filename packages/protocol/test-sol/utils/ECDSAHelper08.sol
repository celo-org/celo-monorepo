pragma solidity >=0.5.13 <0.8.20;
import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";
import "@test-sol/utils/SECP256K1.sol";

contract ECDSAHelper08 is TestWithUtils08 {
  ISECP256K1 sECP256K1;

  function addressToPublicKey(
    bytes32 message,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
  ) public returns (bytes memory) {
    address SECP256K1Address = actor("SECP256K1Address");
    deployCodeTo("SECP256K1.sol:SECP256K1", SECP256K1Address);
    sECP256K1 = ISECP256K1(SECP256K1Address);

    string memory header = "\x19Ethereum Signed Message:\n32";
    bytes32 _message = keccak256(abi.encodePacked(header, message));
    (uint256 x, uint256 y) = sECP256K1.recover(
      uint256(_message),
      _v - 27,
      uint256(_r),
      uint256(_s)
    );
    return abi.encodePacked(x, y);
  }

  function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
    // 32 is the length in bytes of hash,
    // enforced by the type signature above
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
  }
}
