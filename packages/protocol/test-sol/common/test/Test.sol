// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.8.20;

import { Test as ForgeTest } from "forge-std8/Test.sol";
import "./Precompiles.sol";
import "./PrecompileHandler.sol";

contract Test is ForgeTest, Precompiles {
  PrecompileHandler public ph;
  address currentPrank;

  event log_named_array(string key, bytes32[] val);
  event log_array(string key, address[] val);
  event log_array(string key, bytes32[] val);

  constructor() public ForgeTest() {
    ph = new PrecompileHandler();
  }

  /* Utility functions */

  function changePrank(address who) internal virtual override {
    // Record current prank so helper functions can revert
    // if they need to prank
    currentPrank = who;
    super.changePrank(who);
  }

  function actor(string memory name) public returns (address) {
    uint256 pk = uint256(keccak256(bytes(name)));
    address addr = vm.addr(pk);
    vm.label(addr, name);
    return addr;
  }

  function actorWithPK(string memory name) public returns (address, uint256) {
    uint256 pk = uint256(keccak256(bytes(name)));
    address addr = vm.addr(pk);
    vm.label(addr, name);
    return (addr, pk);
  }

  /* Extra assertions, extends forge-std/Test.sol */

  function assertEq(address[] memory a, address[] memory b) internal virtual override {
    if (keccak256(abi.encode(a)) != keccak256(abi.encode(b))) {
      emit log("Error: a == b not satisfied [address[]]");
      emit log_named_array("  Expected", b);
      emit log_named_array("    Actual", a);
      fail();
    }
  }

  function assertEq(
    address[] memory a,
    address[] memory b,
    string memory err
  ) internal virtual override {
    if (keccak256(abi.encode(a)) != keccak256(abi.encode(b))) {
      emit log_named_string("Error", err);
      assertEq(a, b);
    }
  }

  function assertEq(bytes32[] memory a, bytes32[] memory b) internal {
    if (keccak256(abi.encode(a)) != keccak256(abi.encode(b))) {
      emit log("Error: a == b not satisfied [bytes32[]]");
      emit log_named_array("  Expected", b);
      emit log_named_array("    Actual", a);
      fail();
    }
  }

  function deployCodeTo(string memory what, address where) internal virtual override {
    deployCodeTo(what, "", 0, where);
  }

  function deployCodeTo(
    string memory what,
    bytes memory args,
    address where
  ) internal virtual override {
    deployCodeTo(what, args, 0, where);
  }

  function deployCodeTo(
    string memory what,
    bytes memory args,
    uint256 value,
    address where
  ) internal virtual override {
    bytes memory creationCode = vm.getCode(what);
    vm.etch(where, abi.encodePacked(creationCode, args));
    // (bool success, bytes memory runtimeBytecode) = where.call.value(value)("");
    (bool success, bytes memory runtimeBytecode) = where.call{ value: value }("");
    require(
      success,
      "StdCheats deployCodeTo(string,bytes,uint256,address): Failed to create runtime bytecode."
    );
    vm.etch(where, runtimeBytecode);
  }
}
