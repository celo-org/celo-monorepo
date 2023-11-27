pragma solidity ^0.8.17;

import "@0xcyphered/SECP256K1.sol";

contract ECDSAHelperTest {
  function addressToPublicKey(bytes32 message, uint8 _v, bytes32 _r, bytes32 _s)
    public
    pure
    returns (bytes memory)
  {
    string memory header = "\x19Ethereum Signed Message:\n32";
    bytes32 _message = keccak256(abi.encodePacked(header, message));
    (uint256 x, uint256 y) = SECP256K1.recover(
      uint256(_message),
      _v - 27,
      uint256(_r),
      uint256(_s)
    );
    return abi.encodePacked(x, y);
  }
}
