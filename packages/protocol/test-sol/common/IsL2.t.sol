// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Contract to test
import "@celo-contracts-8/common/IsL2.sol";

contract IsL2CheckBase is Test {
  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  IsL2Check isL2Check;

  function setUp() public virtual {
    isL2Check = new IsL2Check();
  }
}

contract IsL2Check_IsL2Test is IsL2CheckBase {
  function testIsL2() public {
    assertFalse(isL2Check.IsL2());
  }

  function testIsL1() public {
    assertTrue(isL2Check.IsL1());
  }

  function helper_WhenProxyAdminAddressIsSet() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
  }

  function testIsL2_WhenProxyAdminSet() public {
    helper_WhenProxyAdminAddressIsSet();
    assertTrue(isL2Check.IsL2());
  }

  function testIsL1_WhenProxyAdminSet() public {
    helper_WhenProxyAdminAddressIsSet();
    assertFalse(isL2Check.IsL1());
  }
}
