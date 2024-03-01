// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "../../contracts/common/FeeCurrencyWhitelist.sol";

contract FeeCurrencyWhitelistTest is Test {
  FeeCurrencyWhitelist feeCurrencyWhitelist;
  address nonOwner;
  address owner;

  function setUp() public {
    owner = address(this);
    nonOwner = actor("nonOwner");

    feeCurrencyWhitelist = new FeeCurrencyWhitelist(true);
    feeCurrencyWhitelist.initialize();
  }
}

contract FeeCurrencyWhitelistInitialize is FeeCurrencyWhitelistTest {
  function test_InitializeOwner() public {
    assertTrue(feeCurrencyWhitelist.isOwner());
    assertEq(feeCurrencyWhitelist.owner(), address(this));
  }

  function test_ShouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    feeCurrencyWhitelist.initialize();
  }
}

contract FeeCurrencyWhitelist_adaptedTokens is FeeCurrencyWhitelistTest {
  address whitelistedAddress1 = address(1);
  address whitelistedAddress2 = address(2);
  address whitelistedAddress3 = address(3);

  address token1 = address(4);
  address token2 = address(5);

  function setUp() public {
    super.setUp();

    feeCurrencyWhitelist.addToken(whitelistedAddress1); // real token
    feeCurrencyWhitelist.addToken(whitelistedAddress2); // adaptor of token 1
    feeCurrencyWhitelist.addToken(whitelistedAddress3); // adaptor of token 2

    feeCurrencyWhitelist.setUnderlyingToken(whitelistedAddress1);
    feeCurrencyWhitelist.setUnderlyingToken(token1);
    feeCurrencyWhitelist.setUnderlyingToken(token2);

    feeCurrencyWhitelist.setAdapter(token1, whitelistedAddress2);
  }
}

contract FeeCurrencyWhitelist_setAdapter is FeeCurrencyWhitelist_adaptedTokens {
  event AdapterSet(address underlyingToken, address adapter);
  function test_geTokenForVanillaGasCurrency() public {
    // should be the same, it doesn't require adapter
    assertEq(feeCurrencyWhitelist.getAdapter(whitelistedAddress1), whitelistedAddress1);
  }

  function test_geTokenForAdaptedGasCurrency() public {
    // should be the same, it doesn't require adapter
    assertEq(feeCurrencyWhitelist.getAdapter(token1), whitelistedAddress2);
  }

  function test_Reverts_WhenNonOwnerAddsAToken() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    feeCurrencyWhitelist.setAdapter(token2, whitelistedAddress3);
  }

  function test_ShouldEmitAdapterSet() public {
    vm.expectEmit(true, true, true, true);
    emit AdapterSet(token2, whitelistedAddress3);
    feeCurrencyWhitelist.setAdapter(token2, whitelistedAddress3);
  }
}

contract FeeCurrencyWhitelist_removeAdapter is FeeCurrencyWhitelist_adaptedTokens {
  event AdapterSet(address underlyingToken, address adapter);

  function test_ShouldRemoveNonExistentAdapter() public {
    feeCurrencyWhitelist.removeAdapter(token1);
    assertEq(feeCurrencyWhitelist.getAdapter(token1), token1);
  }

  function test_ShouldRemoveAdapter() public {
    feeCurrencyWhitelist.setAdapter(token1, whitelistedAddress2);
    assertEq(feeCurrencyWhitelist.getAdapter(token1), whitelistedAddress2);
    feeCurrencyWhitelist.removeAdapter(token1);
    assertEq(feeCurrencyWhitelist.getAdapter(token1), token1);
  }

  function test_ShouldEmitAdapterSet_WhenAdapterRemoved() public {
    vm.expectEmit(true, true, true, true);
    emit AdapterSet(token1, address(0));
    feeCurrencyWhitelist.removeAdapter(token1);
  }

}

contract FeeCurrencyWhitelist_setUnderlyingTokens is FeeCurrencyWhitelist_adaptedTokens {
  event UnderlyingTokenSet(address underlyingToken);

  function test_ShouldReturnUnderlyingToken() external {
    address[3] memory addresses = [whitelistedAddress1, token1, token2];
    address[] memory results = feeCurrencyWhitelist.getUnderlyingTokens();

    // TODO forge has a helper for comparing arrays?
    assertEq(results.length, addresses.length);
    for (uint256 i = 0; i < results.length; i++) {
      assertEq(results[i], addresses[i]);
    }
  }

  function test_ShouldEmitUnderlyingTokenSet() public {
    vm.expectEmit(true, true, true, true);
    emit UnderlyingTokenSet(token1);
    feeCurrencyWhitelist.setUnderlyingToken(token1);
  }

  function test_Reverts_WhenNonOwnerSetsUnderlyingTokens() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    feeCurrencyWhitelist.setUnderlyingToken(token1);
  }
}

contract FeeCurrencyWhitelist_removeUnderlyingTokens is FeeCurrencyWhitelist_adaptedTokens {
  event UnderlyingTokenRemoved(address underlyingToken);

  function test_ShouldRemoveToken() public {
    feeCurrencyWhitelist.removeUnderlyingTokens(token1, 1);
    address[] memory result = feeCurrencyWhitelist.getUnderlyingTokens();
    assertEq(result.length, 2);
    assertEq(result[0], whitelistedAddress1);
    assertEq(result[1], token2);
  }

  function test_ShouldEmitUnderlyingTokenRemoved() public {
    vm.expectEmit(true, true, true, true);
    emit UnderlyingTokenRemoved(token1);
    feeCurrencyWhitelist.removeUnderlyingTokens(token1, 1);
  }

  function test_ShouldRevert_WhenIndexIsWrong() public {
    vm.expectRevert("Index does not match");
    feeCurrencyWhitelist.removeUnderlyingTokens(token1, 2);
  }

  function test_ShouldRevert_WhenNonOwnerRemovesToken() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    feeCurrencyWhitelist.removeUnderlyingTokens(token1, 2);
  }
}

contract FeeCurrencyWhitelist_getWhitelistUnderlingPairs is FeeCurrencyWhitelist_adaptedTokens {
  function test_getsRightTuples() external {
    feeCurrencyWhitelist.setAdapter(token2, whitelistedAddress3);
    address[3] memory expectedTokens = [whitelistedAddress1, token1, token2];

    address[3] memory expectedAdapters = [
      whitelistedAddress1,
      whitelistedAddress2,
      whitelistedAddress3
    ];

    (address[] memory tokens, address[] memory adapters) = feeCurrencyWhitelist
      .getWhitelistUnderlingPairs();

    assertEq(tokens.length, expectedTokens.length);
    assertEq(adapters.length, expectedTokens.length);
    for (uint256 i = 0; i < tokens.length; i++) {
      assertEq(tokens[i], expectedTokens[i]);
      assertEq(adapters[i], expectedAdapters[i]);
    }
  }
}

contract FeeCurrencyWhitelistAddToken is FeeCurrencyWhitelistTest {
  function test_ShouldAllowTheOwnerToAddAToken() public {
    feeCurrencyWhitelist.addToken(address(1));
    address[] memory whitelist = feeCurrencyWhitelist.getWhitelist();
    assertEq(whitelist.length, 1);
    assertEq(whitelist[0], address(1));
  }

  function test_ShouldRevert_WhenNonOwnerAddsAToken() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    feeCurrencyWhitelist.addToken(address(1));
  }
}

contract FeeCurrencyWhitelistRemoveToken is FeeCurrencyWhitelistTest {
  function setUp() public {
    super.setUp();
    feeCurrencyWhitelist.addToken(address(1));
    feeCurrencyWhitelist.addToken(address(2));
    feeCurrencyWhitelist.addToken(address(3));
  }

  function test_ShouldRemoveToken() public {
    feeCurrencyWhitelist.removeToken(address(2), 1);
    address[] memory whitelist = feeCurrencyWhitelist.getWhitelist();
    assertEq(whitelist.length, 2);
    assertEq(whitelist[0], address(1));
    assertEq(whitelist[1], address(3));
  }

  // TODO this test should check emits
  function test_ShouldRevert_WhenIndexIsWrong() public {
    vm.expectRevert("Index does not match");
    feeCurrencyWhitelist.removeToken(address(2), 2);
  }

  function test_ShouldRevert_WhenNonOwnerRemovesToken() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    feeCurrencyWhitelist.removeToken(address(2), 1);
  }
}
