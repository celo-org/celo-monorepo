# Forno

Forno is a hosted node service for interacting with the Celo network. This allow the user to get connected to the Celo Blockchain without having to run its own node.

Can be used as an `Http Provider` with `ContractKit`

As Forno is a public node you will have to sign transactions locally because with your own private key, because Forno doesn't store them. But don't worry, the `ContractKit` will handle this for you.

## Forno networks

```
Alfajores = 'https://alfajores-forno.celo-testnet.org'

Baklava = 'https://baklava-forno.celo-testnet.org'

RC1 = 'https://rc1-forno.celo-testnet.org/'
```
