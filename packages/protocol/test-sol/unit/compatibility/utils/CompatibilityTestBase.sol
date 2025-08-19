pragma solidity >=0.5.13 <0.9.0;

import { Test as ForgeTest } from "@lib/celo-foundry-8/lib/forge-std/src/Test.sol";
import { console2 as console } from "forge-std-8/console2.sol";

contract CompatibilityTestBase is ForgeTest {
  function compileTestCase(string memory name) public {
    string[] memory cmd = new string[](3);
    cmd[0] = "bash";
    cmd[1] = "test-sol/unit/compatibility/utils/compile-testcase.sh";
    cmd[2] = name;
    bytes memory out = vm.ffi(cmd);
    (uint256 exit, string memory stdout, string memory stderr, string memory json) = abi.decode(
      out,
      (uint256, string, string, string)
    );
  }
}
