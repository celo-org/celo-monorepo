pragma solidity ^0.5.13;

import "../LibraryProxy.sol";

contract TestLibraryProxy is LibraryProxy {
  bytes32 private constant LIBRARY_IDENTIFIER_HASH = keccak256(abi.encodePacked("TestLibrary"));

  function() external {
    _delegateToLibrary(LIBRARY_IDENTIFIER_HASH);
  }
}
