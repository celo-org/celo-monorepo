# L2 to L1 Withdrawals

This directory contains tooling for performing L2 to L1 withdrawals of CELO from Celo's L2 testnets. The workflow follows the Optimism-style withdrawal process with a 7-day challenge period (exact challenge period dictated by `PROOF_MATURITY_DELAY_SECONDS` in Optimism Portal).

## Supported Networks

The tooling supports three network configurations:

- **Alfajores**: L1 (Holesky) ↔ L2 (Celo Alfajores)
- **Baklava**: L1 (Holesky) ↔ L2 (Celo Baklava)  
- **Sepolia**: L1 (Sepolia) ↔ L2 (Celo Sepolia) - *Default*

Set the `NETWORK` environment variable to specify which network to use (defaults to `sepolia` if not specified).

## Important Notes

- **Private Keys**: Always provide private keys without `0x` prefix to all scripts
- **Values**: All VALUE parameters should be specified in wei
- **Timing**: You may need to wait up to 1 hour before it's possible to generate a proof after initiation

## Workflow Overview

1. **Initiate** withdrawal on L2
2. **Build** withdrawal proof (wait up to 1 hour)
3. **Prove** withdrawal on L1
4. **Wait** 7 days for challenge period
5. **Finalize** and claim on L1

## Step 1: Initiate Withdrawal on L2

Initiates the withdrawal process on L2 using the L2_L1_MESSAGE_PASSER contract.

```sh
RECIPIENT=0x... VALUE=1000000000000000000 PK=123... ./initiate.sh
```

**Required Environment Variables:**
- `RECIPIENT`: L1 address that will receive the funds
- `VALUE`: Amount to withdraw in wei
- `PK`: Private key (without 0x prefix) of the sender

**Optional Environment Variables:**
- `NETWORK`: Network to use (`alfajores`, `baklava`, or `sepolia` - defaults to `sepolia`)
- `GAS_LIMIT`: Gas limit for the transaction (default: 0 - which means no gas limit)
- `DATA`: Additional data to include (default: "0x00")
- `L2_RPC_URL`: Custom L2 RPC URL

**Output:** Transaction hash - **save this for the next step!**

## Step 2: Build Withdrawal Proof

Builds the withdrawal proof from L2 transaction data. May require waiting up to 1 hour for the message to become provable.

```sh
cd build_proof && yarn install && PK=123... TX_HASH=0x... yarn build_proof
```

**Required Environment Variables:**
- `PK`: Private key (without 0x prefix) of the sender
- `TX_HASH`: Transaction hash from the initiation step

**Optional Environment Variables:**
- `NETWORK`: Network to use (`alfajores`, `baklava`, or `sepolia` - defaults to `sepolia`)

For detailed information about proof building, see [build_proof README](./build_proof/).

## Step 3: Prove Withdrawal on L1

Submits the withdrawal proof to the Optimism Portal contract on L1.

```sh
WITHDRAWAL_NONCE=123... SENDER=0x... RECIPIENT=0x... VALUE=1000000000000000000 \
  GAME_INDEX=123... OUTPUT_ROOT_PROOF__VERSION=0x... \
  OUTPUT_ROOT_PROOF__STATE_ROOT=0x... OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT=0x... \
  OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH=0x... WITHDRAWAL_PROOF="[0x...,0x...,0x...]" \
  PK=123... ALCHEMY_KEY=your_key ./prove.sh
```

**Required Environment Variables:**
- `WITHDRAWAL_NONCE`: Nonce from the withdrawal initiation
- `SENDER`: Address that initiated the withdrawal
- `RECIPIENT`: Address that will receive the funds
- `VALUE`: Amount being withdrawn in wei
- `GAME_INDEX`: Game index (output from Step 2)
- `OUTPUT_ROOT_PROOF__VERSION`: Version from proof building
- `OUTPUT_ROOT_PROOF__STATE_ROOT`: State root from proof building
- `OUTPUT_ROOT_PROOF__MESSAGE_PASSER_STORAGE_ROOT`: Storage root from proof building
- `OUTPUT_ROOT_PROOF__LATEST_BLOCKHASH`: Block hash from proof building
- `WITHDRAWAL_PROOF`: Array of proof bytes from proof building
- `PK`: Private key (without 0x prefix) for submitting the proof

**Optional Environment Variables:**
- `NETWORK`: Network to use (`alfajores`, `baklava`, or `sepolia` - defaults to `sepolia`)
- `GAS_LIMIT`: Gas limit for the transaction (default: 0 - which means no gas limit)
- `DATA`: Additional data to include (default: "0x00")
- `RPC_URL`: Custom L1 RPC URL (if not using Alchemy)
- `ALCHEMY_KEY`: Alchemy API key (required if RPC_URL not provided)

## Step 4: Check Withdrawal Status

Check the status of a proven withdrawal.

```sh
WITHDRAWAL_HASH=0x... PROOF_SUBMITTER=0x... ALCHEMY_KEY=your_key ./get.sh
```

**Required Environment Variables:**
- `WITHDRAWAL_HASH`: Hash of the withdrawal transaction
- `PROOF_SUBMITTER`: Address that submitted the proof

**Optional Environment Variables:**
- `NETWORK`: Network to use (`alfajores`, `baklava`, or `sepolia` - defaults to `sepolia`)
- `RPC_URL`: Custom L1 RPC URL (if not using Alchemy)
- `ALCHEMY_KEY`: Alchemy API key (required if RPC_URL not provided)

## Step 5: Wait 7 Days

The withdrawal must wait 7 days (challenge period) before it can be finalized.

## Step 6: Check Readiness for Finalization

Check if the withdrawal is ready to be finalized and claimed.

```sh
WITHDRAWAL_HASH=0x... PROOF_SUBMITTER=0x... ALCHEMY_KEY=your_key ./check.sh
```

**Required Environment Variables:**
- `WITHDRAWAL_HASH`: Hash of the withdrawal transaction
- `PROOF_SUBMITTER`: Address that submitted the proof

**Optional Environment Variables:**
- `NETWORK`: Network to use (`alfajores`, `baklava`, or `sepolia` - defaults to `sepolia`)
- `RPC_URL`: Custom L1 RPC URL (if not using Alchemy)
- `ALCHEMY_KEY`: Alchemy API key (required if RPC_URL not provided)

**Output:** 
- Reverts with error message if withdrawal has issues
- Returns `0x` (blank output) if withdrawal is ready to claim

## Step 7: Finalize and Claim Withdrawal

Completes the withdrawal process and claims the funds on L1.

```sh
WITHDRAWAL_NONCE=123... SENDER=0x... RECIPIENT=0x... VALUE=1000000000000000000 \
  PK=123... ALCHEMY_KEY=your_key ./finalize.sh
```

**Required Environment Variables:**
- `WITHDRAWAL_NONCE`: Nonce from the withdrawal initiation
- `SENDER`: Address that initiated the withdrawal
- `RECIPIENT`: Address that will receive the funds
- `VALUE`: Amount being withdrawn in wei
- `PK`: Private key (without 0x prefix) for finalizing

**Optional Environment Variables:**
- `NETWORK`: Network to use (`alfajores`, `baklava`, or `sepolia` - defaults to `sepolia`)
- `GAS_LIMIT`: Gas limit for the transaction (default: 0 - which means no gas limit)
- `DATA`: Additional data to include (default: "0x00")
- `RPC_URL`: Custom L1 RPC URL (if not using Alchemy)
- `ALCHEMY_KEY`: Alchemy API key (required if RPC_URL not provided)

## Contract Addresses

### Network-Specific Contract Addresses

**Alfajores (L1: Holesky, L2: Celo Alfajores):**
- **L2_L1_MESSAGE_PASSER**: `0x4200000000000000000000000000000000000016` (Celo Alfajores)
- **L1_OPTIMISM_PORTAL**: `0x82527353927d8D069b3B452904c942dA149BA381` (Holesky)

**Baklava (L1: Holesky, L2: Celo Baklava):**
- **L2_L1_MESSAGE_PASSER**: `0x4200000000000000000000000000000000000016` (Celo Baklava)
- **L1_OPTIMISM_PORTAL**: `0x87e9cB54f185a32266689138fbA56F0C994CF50c` (Holesky)

**Sepolia (L1: Sepolia, L2: Celo Sepolia) - Default:**
- **L2_L1_MESSAGE_PASSER**: `0x4200000000000000000000000000000000000016` (Celo Sepolia)
- **L1_OPTIMISM_PORTAL**: `0x44ae3d41a335a7d05eb533029917aad35662dcc2` (Sepolia)

## Troubleshooting

- **Proof not available**: Wait up to 1 hour after initiation
- **RPC errors**: Ensure your Alchemy key is valid or provide custom RPC URL
- **Gas issues**: Adjust GAS_LIMIT environment variable
- **Private key format**: Ensure PK is provided without 0x prefix
- **Value format**: Ensure VALUE is in wei (not ETH)
- **Network errors**: Ensure NETWORK is set to one of: `alfajores`, `baklava`, or `sepolia`
- **Unsupported network**: Check that you're using a supported network configuration

## Example Withdrawal Proof

```sh
WITHDRAWAL_PROOF="[0xf8918080808080a0231eba9c2bc1784b944714d5260873e3f92b58434c1879123d58f995b342865180a0b3b0303113429f394c506a530c83a8fdbd3125d95b2310b05191cd2dbc978aa8808080a0236e8f61ecde6abfebc6c529441f782f62469d8a2cc47b7aace2c136bd3b1ff080a06babe3fe3879f4972e397c7e516ceb2699945beb318afa0ddee8e7381796f5ff808080,0xf8518080808080a0ea006b1384a4bf0219939e5483e6e82c22d13290d5055e2042541adfb1b47ec380808080a05aa8408d8bac30771c33c39b02167ad094fff70f16e4aa667623d999d04725c9808080808080,0xe2a02005084db35fe36c140bc6d2bc4d520dafa807b5e774c7276c91658a496f59cc01]"
```

## Related Documentation

For the reverse operation (depositing from L1 to L2), see the [deposit README](../deposit/README.md).
