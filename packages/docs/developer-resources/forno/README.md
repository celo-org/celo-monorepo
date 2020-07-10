# Forno

Forno is a hosted node service for interacting with the Celo network. This allows users to connect to the Celo Blockchain without having to run their own node.

Forno can be used as an `Http Provider` with `ContractKit`.

As Forno is a public node you will have to sign transactions locally because with your own private key, because Forno doesn't store them. But don't worry, the `ContractKit` will handle this for you.

## Forno networks

Consult [this page](../../getting-started/choosing-a-network.md) to determine which network is right for you.

```
Alfajores = 'https://alfajores-forno.celo-testnet.org'

Baklava = 'https://baklava-forno.celo-testnet.org'

Mainnet = 'https://rc1-forno.celo-testnet.org'
```
