pragma solidity ^0.5.13;

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
    bytes memory signature = new bytes(65);
    // Concatenate (r, s, v) into signature.
    assembly {
      mstore(add(signature, 32), r)
      mstore(add(signature, 64), s)
      mstore8(add(signature, 96), v)
    }
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(messageHash);
    return ECDSA.recover(prefixedHash, signature);
  }

  /**
  * @notice Given a domain separator and a structHash, construct the typed data hash
  * @param eip712DomainSeparator Context specific domain separator
  * @param structHash hash of the typed data struct
  * @return The EIP712 typed data hash
  */
  function toEthSignedTypedDataHash(bytes32 eip712DomainSeparator, bytes32 structHash)
    public
    pure
    returns (bytes32)
  {
    return keccak256(abi.encodePacked("\x19\x01", eip712DomainSeparator, structHash));
  }

  /**
  * @notice Given a domain separator and a structHash and a signature return the signer
  * @param eip712DomainSeparator Context specific domain separator
  * @param structHash hash of the typed data struct
  * @param v The recovery id of the incoming ECDSA signature.
  * @param r Output value r of the ECDSA signature.
  * @param s Output value s of the ECDSA signature.
  */
  function getSignerOfTypedDataHash(
    bytes32 eip712DomainSeparator,
    bytes32 structHash,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public pure returns (address) {
    bytes memory signature = new bytes(65);
    // Concatenate (r, s, v) into signature.
    assembly {
      mstore(add(signature, 32), r)
      mstore(add(signature, 64), s)
      mstore8(add(signature, 96), v)
    }
    bytes32 prefixedHash = toEthSignedTypedDataHash(eip712DomainSeparator, structHash);
    return ECDSA.recover(prefixedHash, signature);
  }
}
