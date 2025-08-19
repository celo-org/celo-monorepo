pragma solidity >=0.5.13 <0.9.0;

import { CompatibilityTestBase } from "./utils/CompatibilityTestBase.sol";
import { console2 as console } from "forge-std-8/console2.sol";

contract ASTCodeTest is CompatibilityTestBase {
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

  function test_whenContractsAreTheSame() public {
    string memory report = reportASTIncompatibilities("original", "original_copy");
    string[] memory changes = vm.parseJsonStringArray(report, ".changes");
    assertEq(changes.length, 0);
  }
}
