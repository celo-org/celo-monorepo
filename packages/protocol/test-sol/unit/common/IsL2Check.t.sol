// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Contract to test
import "@celo-contracts-8/common/IsL2Check.sol";

contract IsL2Test is IsL2Check {
  function onlyL1Function() public view onlyL1 returns (bool) {
    return true;
  }
}

contract IsL2CheckBase is Test {
  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  IsL2Test isL2Check;

  function setUp() public virtual {
    isL2Check = new IsL2Test();
  }

  function helper_WhenProxyAdminAddressIsSet() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
  }
}

contract IsL2Check_IsL2Test is IsL2CheckBase {
  function test_IsL2() public {
    assertFalse(isL2Check.isL2());
  }

  function test_IsL2_WhenProxyAdminSet() public {
    helper_WhenProxyAdminAddressIsSet();
    assertTrue(isL2Check.isL2());
  }

  function test_IsL1_WhenProxyAdminSet() public {
    helper_WhenProxyAdminAddressIsSet();
    assertFalse(!isL2Check.isL2());
  }
}

contract IsL2Check_OnlyL1 is IsL2CheckBase {
  function test_WhenIsL2_WhenProxyAdminSet() public {
    helper_WhenProxyAdminAddressIsSet();
    vm.expectRevert("This method is no longer supported in L2.");
    isL2Check.onlyL1Function();
  }
  function test_WhenIsL1() public view {
    isL2Check.onlyL1Function();
  }
}
