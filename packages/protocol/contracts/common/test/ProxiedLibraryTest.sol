pragma solidity ^0.5.13;

import "../UsingProxiedLibraries.sol";
import "./TestLibrary1.sol";
import "./TestLibraryStruct.sol";

contract ProxiedLibraryTest is UsingProxiedLibraries {
  // For the test, we need to pull the library's struct definition out to a
  // separate library because the logic library's name changes. In the expected
  // production use case, a library's name would stay the same across upgrades
  // so this will not be necessary.
  using TestLibrary1 for TestLibraryStruct.S;
  using TestLibrary1 for uint256;

  TestLibraryStruct.S x;

  function initialize(address registryAddress) public {
    setLibraryRegistry(registryAddress);
  }

  function setLibraryRegistryExternal(address registryAddress) external {
    setLibraryRegistry(registryAddress);
  }

  function set(uint256 _x) public {
    x.x = _x;
  }

  function get() public view returns (uint256) {
    return x.x;
  }

  function librarySet(uint256 _x) public {
    x.set(_x);
  }

  function increase(uint256 n) public view returns (uint256) {
    return n.increase();
  }

  function combine(uint256 n, uint256 m) public view returns (uint256) {
    return n.combine(m);
  }
}
