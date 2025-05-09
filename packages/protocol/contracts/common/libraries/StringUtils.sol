// SPDX-License-Identifier: MIT
pragma solidity >=0.5.13 <0.9.0;

library StringUtils {
  // This function can be also found in OpenZeppelin's library, but in a newer version than the one we use.
  function compareStrings(string memory a, string memory b) public pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }
}
