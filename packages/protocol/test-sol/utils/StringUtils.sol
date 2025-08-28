// SPDX-License-Identifier: MIT
pragma solidity >=0.5.13 <0.9.0;

library StringUtils {
  // This function can be also found in OpenZeppelin's library, but in a newer version than the one we use.
  function equals(string memory a, string memory b) internal pure returns (bool) {
    // compare keccak256 of encoded string
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }

  // This function is simplification of function present in StringUtils library, but in a newer version.
  function startsWith(string memory a, string memory b) internal pure returns (bool equal) {
    // false if first string is shorter (cannot contain string b)
    if (bytes(a).length < bytes(b).length) return false;

    // determine in assembly if strings are equal
    assembly {
      // load length of string b stored in memory location of b
      let bLength := mload(b)
      // load pointer to string in memory location 32 bytes (0x20) after a
      let aPointer := add(a, 0x20)
      // load pointer to string in memory location 32 bytes (0x20) after b
      let bPointer := add(b, 0x20)
      // compare and return keccak of part of string a (using string b length) to keccak of string b
      equal := eq(keccak256(aPointer, bLength), keccak256(bPointer, bLength))
    }
  }
}
