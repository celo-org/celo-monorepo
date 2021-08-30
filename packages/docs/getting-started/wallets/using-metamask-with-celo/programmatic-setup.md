---
description: >-
  See this guide if you're a dApp developer and want your users to use MetaMask
  to interact with the Celo network.
---

# Programmatic Setup

## **Summary**

For dApp Developers interested in using MetaMask with Celo, we encourage doing the following 3 things, which are described in detail in the below sections.

1. Add the Network
2. Add Celo tokens \(e.g. cUSD, cEUR\)
3. Handle cases where MetaMask is connected to a different network

## **Adding a Celo Network to MetaMask**

To add a Celo Network to your dApp, you can use MetaMask's RPC API's `wallet_addEthereumChain` method. \([See documentation](https://docs.metamask.io/guide/rpc-api.html#wallet-addethereumchain)\).

Here is a JavaScript snippet you can use:

```jsx
  await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [<INSERT_NETWORK_PARAMS_HERE>],
    });
```

Where it says `INSERT_NETWORK_PARAMS_HERE`, please replace with any of the following constants, depending on which network you'd like to connect to.

{% tabs %}
{% tab title="Celo Mainnet" %}
```javascript
const CELO_PARAMS = {
      chainId: '0xa4ec',
      chainName: 'Celo',
      nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 }, rpcUrls: ['https://forno.celo.org'],
      blockExplorerUrls: ['https://explorer.celo.org/'],
      iconUrls: ['future'],
 };
```
{% endtab %}

{% tab title="Alfajores Testnet" %}
```javascript
const ALFAJORES_PARAMS = {
      chainId: '0xaef3',
      chainName: 'Alfajores Testnet',
      nativeCurrency: { name: "Alfajores Celo", symbol: 'A-CELO', decimals: 18 },
      rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
      blockExplorerUrls: ['https://alfajores-blockscout.celo-testnet.org/'],
      iconUrls: ['future'],
    };
```
{% endtab %}

{% tab title="Baklava Testnet" %}
```javascript
  const BAKLAVA_PARAMS = {
      chainId: '0xf370',
      chainName: 'Baklava Testnet',
      nativeCurrency: { name: "Baklava Celo", symbol: 'B-CELO', decimals: 18 },
      rpcUrls: ['https://baklava-forno.celo-testnet.org'],
      blockExplorerUrls: ['https://baklava-blockscout.celo-testnet.org/'],
      iconUrls: ['future'],
    };
```
{% endtab %}
{% endtabs %}

## **Adding Tokens \(e.g. cUSD, cEUR\)**

To watch an asset on a Celo netowork \(e.g. cUSD, cEUR\) in your dApp, you can use MetaMask's RPC API's `wallet_watchAsset` method. \([See documentation](https://docs.metamask.io/guide/rpc-api.html#wallet-watchasset)\).

Here is a JavaScript snippet you can use:

```jsx
  await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
          type: 'ERC20',
          options: {
              address: '<INSERT_ADDRESS_HERE>',
              'symbol': '<INSERT_SYMBOL_HERE>',
              decimals: 18,
          },
      iconUrls: ['future'],
      },
  });
```

Where it says `INSERT_ADDRESS_HERE`, please replace with any of the following constants, depending on which network and which asset you'd like to connect to.

The following are examples for cUSD and cEUR.

{% tabs %}
{% tab title="Celo Mainnet" %}
* Token Contract Address for cUSD: `0x765de816845861e75a25fca122bb6898b8b1282a`
* Token Contract Address for cEUR: `0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73`
{% endtab %}

{% tab title="Alfajores Testnet" %}
* Token Contract Address for cUSD: `0x874069fa1eb16d44d622f2e0ca25eea172369bc1`
* Token Contract Address for cEUR: `0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f`
{% endtab %}

{% tab title="Baklava Testnet" %}
* Token Contract Address for cUSD: `0x62492A644A588FD904270BeD06ad52B9abfEA1aE`
* Token Contract Address for cEUR: `0xf9ecE301247aD2CE21894941830A2470f4E774ca`
{% endtab %}
{% endtabs %}

{% hint style="info" %}
To double-check that the above values are up-to-date, please verify using the `celocli network:contracts` command \_\_\([see documentation](https://docs.celo.org/command-line-interface/commands/network#celocli-network-contracts)\).
{% endhint %}

* Where it says `INSERT_SYMBOL_HERE`, please replace with the correct symbol for the asset you'd like to watch. For Celo Dollars, it's `cUSD` and for Celo Euros, it's `cEUR`.

## **Handling cases where MetaMask is connected to a different network**

We strongly suggest that you disable your dApp's functionality when MetaMask is connected to a non-Celo network.

MetaMask has an API for determining what network/chain you're connected to. [See here](https://docs.metamask.io/guide/ethereum-provider.html#methods) for more documentation around that.

