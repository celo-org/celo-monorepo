# Fee Currencies (CIP-64)

Tooling for sending CIP-64 transactions — transactions that pay gas in an ERC20 fee currency
instead of native CELO — and for seeding the `SequencerFeeVault` with fee-currency balances.

The immediate use is Phase A of the CGT v1 → v2 migration rehearsal: `CeloSequencerFeeVault`
must hold a non-zero balance in every fee currency before the migration can exercise
`withdrawToken()`, which reverts on a zero balance.

## Why these scripts exist

`cast` has no CIP-64 support — there is no `--fee-currency` flag and foundry does not know
transaction type `0x7b`. [`cip64.sh`](cip64.sh) therefore assembles, signs and publishes the
transaction by hand, using `cast` only for RLP encoding, hashing, signing and publishing.

Per [CIP-64](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md), the
payload is:

```
0x7b || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit,
             to, value, data, accessList, feeCurrency, yParity, r, s])
```

signed over:

```
keccak256(0x7b || rlp([chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit,
                       to, value, data, accessList, feeCurrency]))
```

## Important Notes

- **Private keys**: provide without the `0x` prefix, as elsewhere in this repo
- **Fee currency must be held by the sender**: gas is debited in that currency, so a sender
  with a zero balance cannot transact in it
- **Zero address is invalid**: a CIP-64 transaction whose `feeCurrency` is the zero address is
  invalid, and so is any block containing one. To pay in native CELO, use a normal type-2
  transaction via `cast send`
- **Unregistered currencies are dropped**: the currency must be in the `FeeCurrencyDirectory`,
  or the transaction is refused by the txpool
- **Low-decimal tokens need their adapter**: USDC/USDT and similar are registered via a
  `FeeCurrencyAdapter`. Pass the adapter address as `FEE_CURRENCY`, not the token address
- **Gas prices are per currency**: `eth_gasPrice` and `eth_maxPriorityFeePerGas` take an
  optional `feeCurrency` argument and return prices denominated in that currency. They are not
  comparable to native values, so the scripts always query per currency
- **The vault receives the priority fee**: the base fee goes elsewhere, so a non-zero priority
  fee is what credits `SequencerFeeVault`

## Network configuration

No `NETWORK` switch is needed. `SequencerFeeVault` is an OP predeploy at the same address on
every chain, and the fee currencies are discovered from the `FeeCurrencyDirectory` at runtime.
Both are overridable for chains that differ.

| variable | default | meaning |
| --- | --- | --- |
| `FEE_VAULT` | `0x4200000000000000000000000000000000000011` | `CeloSequencerFeeVault` predeploy |
| `DIRECTORY` | `0x15F344b9E6c3Cb6F0376A36A64928b13F62C6276` | `FeeCurrencyDirectory` (verified on Havoc) |
| `FEE_CURRENCIES` | *(unset)* | comma-separated list; bypasses directory lookup entirely |

## Sending a single CIP-64 transaction

```sh
PK=123... \
L2_RPC_URL=https://... \
FEE_CURRENCY=0x7B7261Baf7f1d82e51E4D0eb0577A2512c306e3A \
VALUE=1000000000000000000 \
./cip64.sh
```

**Required:**
- `PK`: private key of the sender
- `L2_RPC_URL`: L2 RPC URL
- `FEE_CURRENCY`: ERC20 (or adapter) address used to pay gas

**Optional:**
- `TO`: recipient (default: the sender, i.e. a self-transfer)
- `VALUE`: native CELO to transfer in wei (default: `0`)
- `DATA`: calldata (default: `0x`)
- `GAS_LIMIT`: explicit gas limit (default: `eth_estimateGas` × `GAS_MULTIPLIER`)
- `GAS_MULTIPLIER`: percent applied to the gas estimate (default: `120`)
- `MAX_FEE_PER_GAS`: explicit cap (default: `(eth_gasPrice + tip)` × `FEE_MULTIPLIER`)
- `MAX_PRIORITY_FEE_PER_GAS`: explicit tip (default: `eth_maxPriorityFeePerGas`)
- `FEE_MULTIPLIER`: percent applied to the fee cap (default: `200`)
- `QUIET`: when `true`, print only the transaction hash (default: `false`)

**Output:** the transaction hash.

Because it takes `TO`, `VALUE` and `DATA`, this script works for any CIP-64 transaction, not
just fee seeding — contract calls included.

## Seeding the fee vault (Phase A)

```sh
PK=123... L2_RPC_URL=https://... TX_COUNT=10 ./seed-cgt-v2.sh
```

**Required:** `PK`, `L2_RPC_URL`

**Optional:**
- `TX_COUNT`: transactions per fee currency (default: `10`)
- `VALUE`: native CELO transferred per transaction in wei (default: `1000000000000000000`)
- `CONFIRM_EVERY`: wait for a receipt every N transactions; `0` disables (default: `0`)
- plus `FEE_VAULT`, `DIRECTORY`, `FEE_CURRENCIES` from the table above

**What it does:**
1. Checks the sender holds a non-zero balance of every fee currency, failing before sending
   anything if not
2. Records vault balances before, so the delta is attributable to this run
3. Sends `TX_COUNT` CIP-64 transactions per currency, published async so the batch pipelines
   rather than costing a block each
4. Waits for the final transaction to confirm
5. Asserts every fee currency now has a non-zero vault balance, exiting non-zero otherwise

## Checking the fee vault

Read-only, safe to run any time:

```sh
L2_RPC_URL=https://... ./check-cgt-v2.sh
```

Prints a symbol / address / raw / formatted table and exits non-zero if any currency still has
a zero balance, so it doubles as a Phase A gate in a pipeline.

## Example: Havoc

```sh
export L2_RPC_URL=https://forno-havoc.cel2.celo-networks-dev.org
export PK=$HAVOC_PK

./check-cgt-v2.sh          # before
TX_COUNT=10 ./seed-cgt-v2.sh
./check-cgt-v2.sh          # after
```

## Troubleshooting

- **`FEE_CURRENCY must not be the zero address`**: use `cast send` for native CELO
- **`sender holds 0 - cannot pay gas in this currency`**: acquire the token first; gas is
  debited in the fee currency
- **`No fee currencies found`**: `DIRECTORY` is wrong for this chain, or set `FEE_CURRENCIES`
  explicitly
- **Transaction never appears**: the currency is probably not registered in the directory, so
  the txpool dropped it. Confirm with `cast call $DIRECTORY "getCurrencies()(address[])"`
- **`max fee per gas less than block base fee`**: raise `FEE_MULTIPLIER`; base fees are
  denominated in the fee currency and move independently of native CELO
- **Formatted balances look like zero**: fee amounts are dust relative to 18 decimals. The
  `RAW` column is authoritative

## Related Documentation

- [CIP-64](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md) — transaction type spec
- [Fee abstraction specification](https://docs.celo.org/operate/specification/fee-abstraction) — directory, adapters, oracle behaviour
- [withdrawal](../withdrawal/README.md) — L2 → L1 withdrawals (rehearsal Phases B and D)
- [deposit](../deposit/README.md) — L1 → L2 deposits (rehearsal Phase C)
