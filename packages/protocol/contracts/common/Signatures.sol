pragma solidity ^0.5.3;


library Signatures {
/**
* @notice Given a signed address, returns the signer of the address.
* @param message The address that was signed.
* @param v The recovery id of the incoming ECDSA signature.
* @param r Output value r of the ECDSA signature.
* @param s Output value s of the ECDSA signature.
*/
  function getSignerOfAddress(
    address message,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    pure
    returns (address)
  {
    bytes32 hash = keccak256(abi.encodePacked(message));
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, hash));
    return ecrecover(prefixedHash, v, r, s);
  }
}