# Safe Transaction Queue Scripts

This directory contains scripts for interacting with Gnosis Safe multisig wallets.

## Scripts

### `queue-safe.sh`

Queues a transaction to a Gnosis Safe multisig wallet using the Safe Gateway API. This script is specifically designed for proposing OPCM transactions.

**Requirements:**
- Requires access to unrestricted Safe Gateway API (`delegatecall` operation should not be disabled via API)

**Features:**
- Submits transactions to the Safe Gateway API
- Supports different OpStack versions (v2.0.0, v3.0.0)
- Uses pre-signed transactions with valid signatures
- Targets Holesky testnet Safe Gateway

**Required Environment Variables:**
- `SENDER` - Address of the transaction sender
- `SAFE_ADDRESS` - Address of the target Safe multisig wallet
- `OPCM_ADDRESS` - Address of the Optimism Chain Manager contract
- `CALLDATA` - Transaction calldata (hex encoded)
- `NONCE` - Safe transaction nonce
- `TX_HASH` - Safe transaction hash
- `SIG` - Transaction signature

**API Endpoint:**
```
https://gateway.holesky-safe.protofire.io/v1/chains/17000/transactions/{SAFE_ADDRESS}/propose
```

**Example Configurations:**

#### Baklava V2.0.0
```bash
SENDER=0x22EaF69162ae49605441229EdbEF7D9FC5f4f094
SAFE_ADDRESS=0xd542f3328ff2516443FE4db1c89E427F67169D94
OPCM_ADDRESS=0xd29841fbcff24eb5157f2abe7ed0b9819340159a
CALLDATA=0xff2dd5a1000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000003ee24bf404e4a5d27a437d910f56e1ed999b1de8000000000000000000000000bf101bd81fb69ab00ab261465454df1a171726bf03b357b30095022ecbb44ef00d1de19df39cf69ee92a60683a6be2c6f8fe6a3e
NONCE=20
TX_HASH=0x2e42a7e0a7bafbc136b302f4f5b5946bb57a98a9e5085ddc225712107381c3e2
SIG=0xb85ab66c1e782f3b801814babe680f39d19dae9ce81378f0a9acb91c41c97dd40f071f2c4f48ceb3a28f633446f9db9c15298adc2d7353d324c20f03613139f51c
```

#### Baklava V3.0.0
```bash
SENDER=0x22EaF69162ae49605441229EdbEF7D9FC5f4f094
SAFE_ADDRESS=0xd542f3328ff2516443FE4db1c89E427F67169D94
OPCM_ADDRESS=0xdd07cb5e4b2e89a618f8d3a08c8ff753acfe1c68
CALLDATA=0xff2dd5a1000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000003ee24bf404e4a5d27a437d910f56e1ed999b1de8000000000000000000000000bf101bd81fb69ab00ab261465454df1a171726bf034b32d11f017711ce7122ac71d87b1c6cc73e10a0dbd957d8b27f6360acaf8f
NONCE=21
TX_HASH=0xd7bba17d3002691e9dc1da82525b97a18b994f3a189437084358bd3241900731
SIG=0xb1772fd05b26d8febd5cb42f80b611daf7b0a87d56a241afe8d8651a2123202e2da073667efaecff7373fb8cd367306d2cb50d324ce98736ea41579b4cbf90171c
```

**Example Execution:**
```bash
# Set environment variables for Baklava V3
export SENDER="0x22EaF69162ae49605441229EdbEF7D9FC5f4f094"
export SAFE_ADDRESS="0xd542f3328ff2516443FE4db1c89E427F67169D94"
export OPCM_ADDRESS="0xdd07cb5e4b2e89a618f8d3a08c8ff753acfe1c68"
export CALLDATA="0xff2dd5a1000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000003ee24bf404e4a5d27a437d910f56e1ed999b1de8000000000000000000000000bf101bd81fb69ab00ab261465454df1a171726bf034b32d11f017711ce7122ac71d87b1c6cc73e10a0dbd957d8b27f6360acaf8f"
export NONCE="21"
export TX_HASH="0xd7bba17d3002691e9dc1da82525b97a18b994f3a189437084358bd3241900731"
export SIG="0xb1772fd05b26d8febd5cb42f80b611daf7b0a87d56a241afe8d8651a2123202e2da073667efaecff7373fb8cd367306d2cb50d324ce98736ea41579b4cbf90171c"

# Execute the script
./queue-safe.sh
```

## Network Support

| Network | Chain ID | Safe Gateway | Environment |
|---------|----------|--------------|-------------|
| Holesky | 17000 | https://gateway.holesky-safe.protofire.io | Testnet |

## Notes

- All transactions are submitted to the Holesky testnet Safe Gateway
- Transaction signatures must be valid, **ordered by the address of signer** and correspond to the Safe multisig owners
- Nonces must be sequential and match the current Safe state
- The script is designed for one-time use per transaction (nonces increment after each proposal)
