// SPDX-License-Identifier: apache-2.0
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "src/contracts/Wrappers/FeeCurrencyWrapper.sol";

/// Runs against a Celo mainnet fork pinned at block FORK_BLOCK. Shows the deployed XAUt0
/// adapter reverting on the minimal mainnet transaction, then swaps in the patched bytecode at
/// the implementation address (storage untouched, as a proxy upgrade would) and shows the same
/// debit succeed. `vm.etch` replaces the code in place; it does not exercise the ProxyAdmin path.
///
///   RUN_FORK=true forge test --match-contract MainnetFork -vv
contract MainnetForkTest is Test {
  address constant PROXY = 0x857BF24e29da0773687E804a743c2E421a394C16;
  address constant IMPL = 0x06d886Ff518b5E642E7E6aaD3cE797B7DABD8e9a;
  address constant TOKEN = 0xaf37E8B6C9ED7f6318979f56Fc287d76c30847ff;
  address constant GAS_FEE_ADDRESS = 0x000000000000000000000000000000000Ce106A5;
  // Any address with at least two native units at FORK_BLOCK works; this contract held
  // 29.651182 XAUt0 there.
  address constant HOLDER = 0xbb469A28f64C72aECC7d05Ca6e45B2FB1a63B4F9;
  uint256 constant FORK_BLOCK = 80156596;
  bytes32 constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
  address constant VM = address(0);

  uint256 constant GAS = 106_000;
  uint256 constant EFFECTIVE_DEBIT = GAS * (4_610_531 + 4_800_000); // 997,516,286,000
  uint256 constant TIP = GAS * 4_800_000;
  uint256 constant BASE_FEE = GAS * 4_610_531;

  IFeeCurrencyAdapter adapter = IFeeCurrencyAdapter(PROXY);
  IFeeCurrency token = IFeeCurrency(TOKEN);
  address tipRecipient = makeAddr("tipRecipient");
  address baseFeeRecipient = makeAddr("baseFeeRecipient");

  function setUp() public {
    vm.skip(!vm.envOr("RUN_FORK", false));
    vm.createSelectFork(vm.envOr("CELO_RPC", string("https://forno.celo.org")), FORK_BLOCK);
    assertEq(
      address(uint160(uint256(vm.load(PROXY, IMPLEMENTATION_SLOT)))),
      IMPL,
      "proxy implementation changed since this test was written"
    );
    assertEq(adapter.digitDifference(), 1e12);
    assertGt(token.balanceOf(HOLDER), 2, "holder needs at least 2 units");
  }

  function test_deployed_adapter_reverts_on_minimal_mainnet_transaction() public {
    vm.prank(VM);
    vm.expectRevert("Can not debit 0");
    adapter.debitGasFees(HOLDER, EFFECTIVE_DEBIT);
  }

  function test_patched_adapter_charges_one_unit_and_credits_it() public {
    _upgradeToPatched();

    uint256 holderBefore = token.balanceOf(HOLDER);
    vm.prank(VM);
    adapter.debitGasFees(HOLDER, EFFECTIVE_DEBIT);
    assertEq(adapter.debited(), 1);
    assertEq(holderBefore - token.balanceOf(HOLDER), 1);

    uint256 escrowBefore = token.balanceOf(GAS_FEE_ADDRESS);
    vm.prank(VM);
    adapter.creditGasFees(HOLDER, tipRecipient, address(0), baseFeeRecipient, 0, TIP, 0, BASE_FEE);
    assertEq(token.balanceOf(tipRecipient), 0);
    assertEq(token.balanceOf(baseFeeRecipient), 1);
    assertEq(escrowBefore - token.balanceOf(GAS_FEE_ADDRESS), 1);
    assertEq(adapter.debited(), 0);
  }

  function test_patched_adapter_keeps_proxy_storage() public {
    _upgradeToPatched();
    assertEq(adapter.getAdaptedToken(), TOKEN);
    assertEq(adapter.digitDifference(), 1e12);
    assertEq(adapter.decimals(), 18);
    assertEq(adapter.symbol(), "XAUt0");
  }

  function _upgradeToPatched() internal {
    vm.etch(IMPL, address(new FeeCurrencyWrapper()).code);
  }
}
