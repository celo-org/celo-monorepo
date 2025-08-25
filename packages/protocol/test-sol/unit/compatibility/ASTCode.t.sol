pragma solidity >=0.5.13 <0.9.0;

import { Strings } from "@openzeppelin/contracts8/utils/Strings.sol";
import { CompatibilityTestBase } from "./utils/CompatibilityTestBase.sol";
import { console2 as console } from "forge-std-8/console2.sol";

contract ASTCodeTest is CompatibilityTestBase {
  // Change that only specifies a contract and the type of change
  struct SimpleChange {
    // Append `_` because can't use reserved Solidity word
    string contract_;
    string type_;
  }

  struct MethodChange {
    string contract_;
    string signature;
    string type_;
  }

  struct MethodValueChange {
    string contract_;
    string newValue;
    string oldValue;
    string signature;
    string type_;
  }

  function reportASTIncompatibilities(
    string memory case1,
    string memory case2
  ) public returns (string memory) {
    compileTestCase(case1);
    compileTestCase(case2);

    string[] memory cmd = new string[](4);
    cmd[0] = "bash";
    cmd[1] = "test-sol/unit/compatibility/utils/wrappers/reportASTIncompatibilities.sh";
    cmd[2] = case1;
    cmd[3] = case2;
    bytes memory out = vm.ffi(cmd);
    (uint256 exit, string memory stdout, string memory stderr, string memory json) = abi.decode(
      out,
      (uint256, string, string, string)
    );
    return json;
  }

  function assertBytecodeChange(
    string memory report,
    uint256 reportIndex,
    string memory contract_
  ) internal {
    bytes memory changeBytes = vm.parseJson(
      report,
      string.concat(".changes[", Strings.toString(reportIndex), "]")
    );
    SimpleChange memory change = abi.decode(changeBytes, (SimpleChange));

    assertEq(change.contract_, contract_);
    assertEq(change.type_, "DeployedBytecode");
  }

  function assertNewContractChange(
    string memory report,
    uint256 reportIndex,
    string memory contract_
  ) internal {
    bytes memory changeBytes = vm.parseJson(
      report,
      string.concat(".changes[", Strings.toString(reportIndex), "]")
    );
    SimpleChange memory change = abi.decode(changeBytes, (SimpleChange));

    assertEq(change.contract_, contract_);
    assertEq(change.type_, "NewContract");
  }

  function assertMethodAddedChange(
    string memory report,
    uint256 reportIndex,
    string memory contract_,
    string memory signature
  ) internal {
    bytes memory changeBytes = vm.parseJson(
      report,
      string.concat(".changes[", Strings.toString(reportIndex), "]")
    );
    MethodChange memory change = abi.decode(changeBytes, (MethodChange));

    assertEq(change.contract_, contract_);
    assertEq(change.type_, "MethodAdded");
    assertEq(change.signature, signature);
  }

  function assertMethodRemovedChange(
    string memory report,
    uint256 reportIndex,
    string memory contract_,
    string memory signature
  ) internal {
    bytes memory changeBytes = vm.parseJson(
      report,
      string.concat(".changes[", Strings.toString(reportIndex), "]")
    );
    MethodChange memory change = abi.decode(changeBytes, (MethodChange));

    assertEq(change.contract_, contract_);
    assertEq(change.type_, "MethodRemoved");
    assertEq(change.signature, signature);
  }

  function assertMethodMutabilityChange(
    string memory report,
    uint256 reportIndex,
    string memory contract_,
    string memory signature,
    string memory oldValue,
    string memory newValue
  ) internal {
    bytes memory changeBytes = vm.parseJson(
      report,
      string.concat(".changes[", Strings.toString(reportIndex), "]")
    );
    MethodValueChange memory change = abi.decode(changeBytes, (MethodValueChange));

    assertEq(change.contract_, contract_);
    assertEq(change.type_, "MethodMutability");
    assertEq(change.signature, signature);
    assertEq(change.oldValue, oldValue);
    assertEq(change.newValue, newValue);
  }

  function assertMethodReturnChange(
    string memory report,
    uint256 reportIndex,
    string memory contract_,
    string memory signature,
    string memory oldValue,
    string memory newValue
  ) internal {
    bytes memory changeBytes = vm.parseJson(
      report,
      string.concat(".changes[", Strings.toString(reportIndex), "]")
    );
    MethodValueChange memory change = abi.decode(changeBytes, (MethodValueChange));

    assertEq(change.contract_, contract_);
    assertEq(change.type_, "MethodReturn");
    assertEq(change.signature, signature);
    assertEq(change.oldValue, oldValue);
    assertEq(change.newValue, newValue);
  }

  function assertMethodVisibilityChange(
    string memory report,
    uint256 reportIndex,
    string memory contract_,
    string memory signature,
    string memory oldValue,
    string memory newValue
  ) internal {
    bytes memory changeBytes = vm.parseJson(
      report,
      string.concat(".changes[", Strings.toString(reportIndex), "]")
    );
    MethodValueChange memory change = abi.decode(changeBytes, (MethodValueChange));

    assertEq(change.contract_, contract_);
    assertEq(change.type_, "MethodVisibility");
    assertEq(change.signature, signature);
    assertEq(change.oldValue, oldValue);
    assertEq(change.newValue, newValue);
  }

  function assertJsonArrayLength(string memory json, string memory path, uint256 length) internal {
    // vm.parseJson returns empty bytes when reading an out-of-bound array index. We can use this to
    // check an arbitrary JSON array's length without actually parsing it (which could get difficult
    // with arrays that contain variable types of elements).
    // Specifically we check `path[length - 1]`, which should be non-null, and `path[length]`, which
    // should be null if the array's length is exactly `length`.
    if (length > 0) {
      string memory lastPath = string.concat(path, "[", Strings.toString(length - 1), "]");
      bytes memory lastBytes = vm.parseJson(json, lastPath);
      assertGt(lastBytes.length, 0);
    }

    string memory pastLastPath = string.concat(path, "[", Strings.toString(length), "]");
    bytes memory pastLastBytes = vm.parseJson(json, pastLastPath);

    assertEq(pastLastBytes.length, 0);
  }

  function test_whenContractsAreTheSame() public {
    string memory report = reportASTIncompatibilities("original", "original_copy");
    string[] memory changes = vm.parseJsonStringArray(report, ".changes");
    assertEq(changes.length, 0);
    assertJsonArrayLength(report, ".changes", 0);
  }

  function test_whenOnlyMetadataChanges() public {
    string memory report = reportASTIncompatibilities("original", "metadata_changed");
    string[] memory changes = vm.parseJsonStringArray(report, ".changes");
    assertJsonArrayLength(report, ".changes", 0);
  }

  function test_whenAConstantIsInserted() public {
    string memory report = reportASTIncompatibilities("original", "inserted_constant");
    assertJsonArrayLength(report, ".changes", 1);
    assertBytecodeChange(report, 0, "TestContract");
  }

  function test_whenAContractAndMethodsAreAdded() public {
    string memory report = reportASTIncompatibilities("original", "added_methods_and_contracts");
    assertJsonArrayLength(report, ".changes", 4);
    assertNewContractChange(report, 0, "TestContractNew");
    assertMethodAddedChange(report, 1, "TestContract", "newMethod1(uint256)");
    assertMethodAddedChange(report, 2, "TestContract", "newMethod2(uint256)");
    assertBytecodeChange(report, 3, "TestContract");
  }

  function test_whenMethodsAreRemoved() public {
    string memory report = reportASTIncompatibilities("added_methods_and_contracts", "original");
    assertJsonArrayLength(report, ".changes", 3);
    assertMethodRemovedChange(report, 0, "TestContract", "newMethod1(uint256)");
    assertMethodRemovedChange(report, 1, "TestContract", "newMethod2(uint256)");
    assertBytecodeChange(report, 2, "TestContract");
  }

  function test_whenManyChangesAreMade() public {
    string memory report = reportASTIncompatibilities("big_original", "big_original_modified");

    assertJsonArrayLength(report, ".changes", 13);

    assertNewContractChange(report, 0, "NewContract");
    assertMethodRemovedChange(report, 1, "MethodsRemovedContract", "someMethod1(uint256)");
    assertMethodRemovedChange(report, 2, "MethodsRemovedContract", "someMethod2(uint256)");
    assertBytecodeChange(report, 3, "MethodsRemovedContract");
    assertMethodVisibilityChange(
      report,
      4,
      "MethodsModifiedContract",
      "someMethod1(uint256)",
      "external",
      "public"
    );
    assertMethodMutabilityChange(
      report,
      5,
      "MethodsModifiedContract",
      "someMethod2(uint256)",
      "pure",
      "view"
    );
    assertMethodReturnChange(
      report,
      6,
      "MethodsModifiedContract",
      "someMethod3(uint256,string)",
      "uint256, memory string",
      "uint256, memory string, uint256"
    );
    assertMethodMutabilityChange(
      report,
      7,
      "MethodsModifiedContract",
      "someMethod4(uint256)",
      "payable",
      "nonpayable"
    );
    assertBytecodeChange(report, 8, "MethodsModifiedContract");
    assertMethodAddedChange(report, 9, "MethodsAddedContract", "newMethod1()");
    assertMethodAddedChange(report, 10, "MethodsAddedContract", "newMethod2(uint256)");
    assertBytecodeChange(report, 11, "MethodsAddedContract");
    assertBytecodeChange(report, 12, "ImplementationChangeContract");
  }
}
