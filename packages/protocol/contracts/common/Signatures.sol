pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

library Signatures {
  /**
  * @notice Given a signed address, returns the signer of the address.
  * @param message The address that was signed.
  * @param v The recovery id of the incoming ECDSA signature.
  * @param r Output value r of the ECDSA signature.
  * @param s Output value s of the ECDSA signature.
  */
  function getSignerOfAddress(address message, uint8 v, bytes32 r, bytes32 s)
    public
    pure
    returns (address)
  {
    bytes32 hash = keccak256(abi.encodePacked(message));
    return getSignerOfMessageHash(hash, v, r, s);
  }

  /**
  * @notice Given a message hash, returns the signer of the address.
  * @param messageHash The hash of a message.
  * @param v The recovery id of the incoming ECDSA signature.
  * @param r Output value r of the ECDSA signature.
  * @param s Output value s of the ECDSA signature.
  */
  function getSignerOfMessageHash(bytes32 messageHash, uint8 v, bytes32 r, bytes32 s)
    public
    pure
    returns (address)
  {
    /*
    uint256 v32 = v;
    bytes memory signature = new bytes(96);
    assembly {
      mstore(add(signature, 32), r)
      mstore(add(signature, 64), s)
      mstore(add(signature, 96), v32)
    }
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(messageHash);
    return ECDSA.recover(prefixedHash, signature);
    */
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, messageHash));
    address signer = ecrecover(prefixedHash, v, r, s);
    require(signer != address(0));
    return signer;
  }
}
