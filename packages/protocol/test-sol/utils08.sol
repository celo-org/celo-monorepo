pragma solidity >=0.5.13 <0.9.0;

contract Utils08 {
  // This function can be also found in OpenZeppelin's library, but in a newer version than the one
  function compareStrings(string memory a, string memory b) public pure returns (bool) {
    return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
  }
}
