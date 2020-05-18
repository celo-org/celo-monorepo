# General

Here you find some general information about integrations regardless of your service or use case:

## Accessing the chain

There are a myriad of ways through which you can access chain data:

### Running your own node

To be completely independent and have a reliable view into the latest chain data, you will likely want to run your own node(s).

You can just clone [`celo-blockchain`](https://github.com/celo-org/celo-blockchain) and then run `make geth` to receive the binary.

By default, `geth` will use `/root/.celo` as the data dir, if you would like to change that specify the `--datadir` argument. For common testnets, we are hosting the genesis blocks under `https://www.googleapis.com/storage/v1/b/genesis_blocks/o/${NETWORK_NAME}\?alt\=media`. To initiate your datadir, run `geth init genesis.json` to add the genesis block.

cLabs generally hosts bootnodes to help nodes discover each other on the network. You can fetch those under `https://www.googleapis.com/storage/v1/b/env_bootnodes/o/${NETWORK_NAME}\?alt\=media`.

The current network ID for the Alfajores testnet is `44786`, for the Baklava testnet it is `200110`.

This is all you should need to connect to a network:

```bash
geth --networkid $NETWORK_ID --bootnodes $BOOTNODES
```

For more command line options, please see [https://github.com/ethereum/go-ethereum/wiki/Command-Line-Options](https://github.com/ethereum/go-ethereum/wiki/Command-Line-Options)


### Forno

Forno is a hosted node service for interacting with the Celo network. This allow the user to get connected to the Celo Blockchain without having to run its own node.

Can be used as an `Http Provider` with `ContractKit`

As Forno is a public node you will have to sign transactions locally because with your own private key, because Forno doesn't store them. But don't worry, the `ContractKit` will handle this for you.

Forno networks:

```
Alfajores = 'https://alfajores-forno.celo-testnet.org'

Baklava = 'https://baklava-forno.celo-testnet.org'
```

### Blockscout

We also expose data on the cLabs run blockscout instance. Blockscout itself exposes an API.

```
Alfajores = 'https://alfajores-blockscout.celo-testnet.org'

Baklava = 'https://baklava-blockscout.celo-testnet.org'
```


## Signing Transactions

Compared to Ethereum transaction, Celo transactions have 3 additional, optional fields:

- `feeCurrency` - Specifies the address of the currency in which fees should be paid. If `null`, the native token `cGLD` is assumed.
- `gatewayFeeRecipient` - As part of [Full Node Incentives](../../celo-codebase/protocol/transactions/full-node-incentives.md), light clients will need to specify the address of their gateway for it to forward the transactions onto the network.
- `gatewayFee` - The value of the gateway fee.

[Read more about Celo Transactions](../../celo-codebase/protocol/transactions)

To sign transactions, you have the following options:

- Use the JSON-RPC [`sendTransaction`](https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sendtransaction) method to your node which would have the account in question unlocked. (Either manually or via a library such as `web3`)
- Use [ContractKit's](../contractkit/README.md) local signing feature.
