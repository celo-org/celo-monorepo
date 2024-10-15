// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import { TestConstants } from "@test-sol/constants.sol";

contract L2MakerAbstract is Test, TestConstants {
  function _whenL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), PROXY_ADMIN_ADDRESS);
  }
}
