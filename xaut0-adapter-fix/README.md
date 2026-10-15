# XAUt0 fee-currency adapter on Celo: debit rounding fix

Test vectors and a mainnet-fork check for the one-line change to `FeeCurrencyWrapper.debitGasFees`
discussed between Tether and cLabs.

## Background

The adapter converts gas fees from 18 decimals to the token's 6 decimals with floor division and
reverts with `Can not debit 0` when the result is zero, i.e. for any fee below `1e12` (one native
XAUt0 unit). One native unit of XAUt0 is worth more than the gas of a minimal transaction, so
minimal XAUt0 transactions paying base fee plus a small tip are debited below `1e12`, the debit
reverts, and the transaction can never be included. Those transactions sit in the sequencer's queue
until cleared.

The fix rounds the debit up, so any non-zero fee debits at least one native unit. The credit path
stays as it is: it floors each component and sends the rounding remainder to the base-fee
recipient, which guarantees that the credited sum never exceeds `debited`. This is the same
behaviour as cLabs' audited reference adapter
([FeeCurrencyAdapter.sol](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/stability/FeeCurrencyAdapter.sol)).

Please do not change `downscale` itself to round up. `creditGasFees` uses it too, and rounding
the three credit components up can make their sum exceed `debited`, which makes `creditGasFees`
revert and invalidates the block.

## The change

`FeeCurrencyWrapper.patch` applies cleanly to the verified source of the mainnet implementation
`0x06d886Ff518b5E642E7E6aaD3cE797B7DABD8e9a` (`contracts/Wrappers/FeeCurrencyWrapper.sol`):

```diff
   function debitGasFees(address from, uint256 value) external override onlyVm {
-    uint256 toDebit = downscale(value);
+    uint256 toDebit = downscaleCeil(value);
     require(toDebit > 0, "Can not debit 0");
...
+  function downscaleCeil(uint256 value) internal view returns (uint256) {
+    return (value + digitDifference - 1) / digitDifference;
+  }
```

No state variables are added or reordered, so the storage layout behind the proxy is unchanged
and a plain `ProxyAdmin.upgrade` is enough. The same wrapper code backs the USD₮ and USA₮
adapters; they are not affected in practice, but the same implementation can be reused for them.

## Test vectors

`digitDifference = 1e12`. Values are what the client passes to `debitGasFees` (18 decimals);
results are native token units (6 decimals).

| Case | `value` | Current (floor) | Patched (ceil) |
|---|---:|---:|---:|
| zero | 0 | revert `Can not debit 0` | revert `Can not debit 0` |
| one wei | 1 | revert | 1 |
| just below one unit | 999,999,999,999 | revert | 1 |
| exactly one unit | 1,000,000,000,000 | 1 | 1 |
| just above one unit | 1,000,000,000,001 | 1 | 2 |
| exact multiple | 1,000,000,000,000,000 | 1000 | 1000 |
| mainnet, effective fee | 997,516,286,000 | revert | 1 |
| mainnet, admission (max fee) | 1,060,000,000,000 | 1 | 2 |

The two mainnet rows reproduce the minimal XAUt0 transaction on Celo mainnet at block 79570345:
gas limit 106,000 (21,000 + 85,000 intrinsic gas for XAUt0), base fee 4,610,531 XAUt0 units per
gas, tip 4,800,000, max fee 10,000,000. The node admits the transaction based on the max-fee
debit (row 8) but the block builder debits the effective fee (row 7), which currently reverts.

Credit vectors after those debits (refund, tip, base fee in 18 decimals; results in native units):

| After debit | refund | tip | base fee | refund gets | tip gets | base fee gets |
|---|---:|---:|---:|---:|---:|---:|
| 997,516,286,000 (debited 1) | 0 | 508,800,000,000 | 488,716,286,000 | 0 | 0 | 1 |
| 1,060,000,000,000 (debited 2) | 62,483,714,000 | 508,800,000,000 | 488,716,286,000 | 0 | 0 | 2 |
| 999,999,999,999 (debited 1) | 999,999,999,999 | 0 | 0 | 0 | 0 | 1 |

A user therefore pays at most one native unit (0.000001 XAUt0) more than the exact fee. Two fuzz
tests check that for any debit and any split of it the credit never reverts and distributes
exactly what was debited, and that the patched debit never exceeds the current one by more than
one unit.

## Running

From a clone of this branch:

```
git submodule update --init xaut0-adapter-fix/lib/forge-std
cd xaut0-adapter-fix
```

Unit tests (patched wrapper behind a proxy, mock 6-decimal token, plus the current code as a
regression reference):

```
forge test
```

Mainnet fork (reads Celo mainnet through `https://forno.celo.org`, override with `CELO_RPC`):

```
RUN_FORK=true forge test --match-contract MainnetFork -vv
```

The fork test calls the deployed adapter `0x857BF24e29da0773687E804a743c2E421a394C16` as the VM
and shows the effective-fee debit reverting, then replaces the bytecode at the implementation
address with the patched build (storage untouched, as a proxy upgrade would) and shows the same
debit charging one unit, the credit sending that unit to the base-fee recipient, and
`wrappedToken`, `digitDifference`, `decimals` and `symbol` unchanged.

## Layout

- `src/contracts/Wrappers/FeeCurrencyWrapper.sol`: verified mainnet source with the patch applied.
- `FeeCurrencyWrapper.patch`: the diff against the verified source.
- `test/original/FeeCurrencyWrapperOriginal.sol`: the verified source, unmodified, used as the regression reference.
- `test/FeeCurrencyWrapper.t.sol`: vectors and fuzz invariants.
- `test/MainnetFork.t.sol`: mainnet fork check.
- `lib/@openzeppelin`: the OpenZeppelin files from the verified build.

`foundry.toml` mirrors the verified build settings (istanbul, optimizer 100000 runs) with
solc 0.8.19 instead of 0.8.4, because forge-std needs 0.8.13 or newer. The copied
`IFeeCurrencyAdapter.sol` pragma was relaxed from `0.8.4` to `^0.8.4` for the same reason.
