# Celo Faucet

A firebase function that creates invites and/or faucets addresses

## Faucet Deployment Configuration

The function requires a few configuration variables to work:

- nodeUrl: The url for the node the faucet server will use to send transactions
- stableTokenAddress: The StableToken contract's address
- goldTokenAddress: The GoldToken contract's address
- faucetGoldAmount: The amount of gold to faucet on each request
- faucetDollarAmount: The amount of dollars to faucet on each request

All these variables, are set using firebase function:config mechanism

Besides these variables, it also need a list of accounts to use for fauceting.
The accounts are stored in firebase realtime DB. For each account it needs:

- account address
- account private key

### Setting Faucet Amounts

In directory: `packages/faucet`, run:

Replace net with proper net

```
yarn cli config:set --net alfajores --goldAmount 5000000000000000000 --dollarAmount 10000000000000000000
```

You can verify with `yarn cli config:get --net alfajores`

### Setting StableToken and GoldToken Addresses

To obtain the StableToken, GoldToken, and Escrow addresses on a given environment run:

```bash
celotooljs contract-addresses --e alfajores --contracts StableToken,GoldToken,Escrow
```

Replace `alfajores` by proper environment

To set the address for faucet, in directory: `packages/faucet`, run:

Replace `net`, `stableTokenAddress`, `goldTokenAddress`, and `escrowAddress` with proper values

```bash
yarn cli config:set --net alfajores --stableTokenAddress 0x299E74bdCD90d4E10f7957EF074ceE32d7e9089a --goldTokenAddress 0x4813BFD311E132ade22c70dFf7e5DB045d26D070 --escrowAddress 0x299E74bdCD90d4E10f7957EF074ceE32d7e9089a
```

You can verify with `yarn cli config:get --net alfajores`

### Setting Node Url

#### Obtain the Node IP

To obtain the node ip use `gcloud compute addresses list`

Take in account that:

- The node name scheme is: `${envname}-tx-nodes-0`
- GCloud Project: celo-testnet-production for Alfajores, celo-testnet for the rest

For Alfajores:

```bash
gcloud compute addresses describe alfajores-tx-nodes-0 \
  --project celo-testnet-production \
  --region us-west1 \
  --format "value(address)"
```

For Integration:

```bash
gcloud compute addresses describe integration-tx-nodes-0 \
  --project celo-testnet \
  --region us-west1 \
  --format "value(address)"
```

#### Set the node URL

In directory: `packages/faucet`, run:

Replace `net` and `ip` with the proper ones

```
yarn cli config:set --net alfajores --nodeUrl http://35.185.236.10:8545
```

You can verify with `yarn cli config:get --net alfajores`

### Setting Accounts

To generate the faucet account addresses and private keys we use celotool.

1.  source the mnemonic `.env` file (i.e. `source .env.mnemonic.alfajores`)
2.  Run `celotooljs generate bip32 -m "$MNEMONIC" -a faucet -i 0` to obtain faucet account `0` private key
3.  Run `celotooljs generate account-address --private-key <<pk_here>>` to obtain the address
4.  Run `yarn cli accounts:add --net alfajores <<pk_here>> <<address_here>>` to add the account to the faucet server

Repeat the operation for all the faucet accounts you need (change index `-i` to `1,2,...`)

You can check the result running:

```bash
yarn cli accounts:get --net alfajores
```

### Funding the accounts

Faucet accounts should already be funded on network deploy.

For now, that's not running, so we need to do that manually. The process consists on transfering
funds from validatos-0 account to the faucet account.

To do this, we use `celotool account faucet` command.

Since the command faucet a fixed amount, open `packages/celotool/src/cmds/account/faucet.ts` and modify `-d` (dollars) and `-g` (gold) with the desired amounts:

```ts
const cb = async () => {
  await execCmd(
    // TODO(yerdua): reimplement the protocol transfer script here, using
    //  the SDK + Web3 when the SDK can be built for multiple environments
    `yarn --cwd ../protocol run transfer -n ${argv.celoEnv} -a ${argv.account} -d 10000 -g 10000`
  )
}
```

And then run:

```bash
celotooljs account faucet -e alfajores --account 0xCEa3eF8e187490A9d85A1849D98412E5D27D1Bb3
```

### How to deploy to staging

1.  `yarn firebase login`
2.  `yarn deploy:staging`
3.  Deployment can be seen at [https://console.firebase.google.com/project/celo-faucet-staging/overview](https://console.firebase.google.com/project/celo-faucet-staging/overview)
4.  You can simulate the access at [https://console.firebase.google.com/project/celo-faucet-staging/database/celo-faucet-staging/rules](https://console.firebase.google.com/project/celo-faucet-staging/database/celo-faucet-staging/rules)

`packages/web $ yarn run dev`
Go to [http://localhost:3000/build/wallet](http://localhost:3000/build/wallet) and perform submit, verify that no failure appears in the logs.
