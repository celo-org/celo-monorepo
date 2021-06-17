# Using MetaMask with Celo

{% hint style="warning" %}
MetaMask is primarily used for interacting with the Ethereum blockchain, and does not natively support Celo compatibility. As such, we recommend only sophisticated users and developers use it, at your own risk. Please check out options for Celo native wallets [here](https://docs.celo.org/getting-started/wallets).
{% endhint %}

{% hint style="danger" %}
Do not send ETH to your Celo address. Do not send CELO assets to your Ethereum address.
{% endhint %}

[MetaMask](https://metamask.io/) is a crypto wallet that can be used in-browser and on mobile to interact with the Ethereum blockchain. Many dApps in the space integrate with MetaMask, and we're excited to bring its functionality to the Celo ecosystem.

With the Celo network's [Donut Hardfork](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0027.md), which was activated on Mainnet on May 19th, 2021, the protocol now supports [Ethereum-compatible transactions](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0035.md). This means that users are now able to use MetaMask to interact with the Celo blockchain and dApp developers can more easily port over Ethereum dApps onto Celo. The following guide aims to detail step-by-step how to do that.

## **Things to Keep in Mind**

As mentioned above, MetaMask does not natively support Celo compatibility. Because of this, some features won't work perfectly; the following are some things to be aware of:

### **Importing via Private Key**

* Celo and Ethereum use different derivation paths for generating seed phrases. Because MetaMask does not let you specify a derivation path to use:
  * You can't import an existing Celo account into the MetaMask wallet using its seed phrase, as you'd get the Ethereum version of it. Instead, you have to import it using the associated private key.
  * Similarly, if you want to import the Celo account you made on MetaMask to a different Celo wallet \(e.g. [Valora](https://valoraapp.com/)\) you'd have to import it using the private key itself, NOT the seed phrase that MetaMask gives you.
  * See these guides if you accidentally sent [ETH to CELO addresses](https://docs.celo.org/celo-owner-guide/celo-recovery) or [CELO to ETH addresses.](https://docs.celo.org/celo-owner-guide/eth-recovery)\*\*\*\*

### Gas Fee Currency

* While gas on Celo can usually be paid in [many different currencies](https://docs.celo.org/celo-codebase/protocol/transactions/erc20-transaction-fees), when using Metamask, gas fees will automatically be paid in CELO. This is because MetaMask will be using the [Ethereum-compatible Celo transaction format](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0035.md), which doesn't include the `feecurrency` field.

### Logo

* The MetaMask UI might show the ETH logo in places where it's meant to show the CELO logo or no logo at all.
