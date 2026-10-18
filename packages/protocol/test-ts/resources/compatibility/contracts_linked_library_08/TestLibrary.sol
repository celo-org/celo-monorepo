pragma solidity ^0.8.19;

library TestLibrary {
  struct Thing {
    uint8 field1;
    uint16 field2;
  }

  function twice(uint256 x) public pure returns (uint256) {
    return x * 2;
  }
}
