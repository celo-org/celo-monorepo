# Using MetaMask with Celo

{% hint style="danger" %}
Do not send ETH to your Celo address. Do not send CELO assets to your Ethereum address.
{% endhint %}

**​**[MetaMask](https://metamask.io/) is a crypto wallet that can be used in a web browser and on mobile devices to interact with the Ethereum blockchain. Many dApps in the space integrate with MetaMask, and we're excited to bring its functionality to the Celo ecosystem.

  
Since Celo network's [Donut Hardfork](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0027.md), activated on Mainnet on May 19th, 2021, the protocol now supports [Ethereum-compatible transactions](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0035.md). This means that users may use MetaMask to interact with the Celo blockchain and dApp developers can more easily port Ethereum dApps to the Celo blockchain.

### **How to use MetaMask with Celo**

**For end users:**

* [Configure a MetaMask Desktop or Web Wallet to Work with Celo](https://docs.celo.org/getting-started/wallets/using-metamask-with-celo/manual-setup)
* [Setup a Ledger to Work with MetaMask to Work With Celo](https://docs.celo.org/getting-started/wallets/using-metamask-with-celo/using-a-ledger-with-metamask)

**For developers:**

* [Setup MetaMask to Work with Your dApp](https://docs.celo.org/getting-started/wallets/using-metamask-with-celo/programmatic-setup)

## **Things to Keep in Mind**

MetaMask does not natively support Celo compatibility and some features won’t work perfectly. Here are some things to be aware of when using MetaMask with Celo.

### **No Private Key Import**

Celo and Ethereum use different derivation paths for generating seed phrases. Because MetaMask does not let you specify a derivation path to use:

* You can't import an existing Celo account into the MetaMask wallet using its seed phrase, as you'd get the Ethereum version of it. Instead, you have to import it using the associated private key.
* If you want to import the Celo account you made on MetaMask to a different Celo wallet \(e.g. [Valora](https://valoraapp.com/)\) you'd have to import it using the private key itself, NOT the seed phrase that MetaMask gives you.
* See these guides if you accidentally sent [ETH to CELO addresses](https://docs.celo.org/celo-owner-guide/celo-recovery) or [CELO to ETH addresses.](https://docs.celo.org/celo-owner-guide/eth-recovery)

### **Gas Fees Require CELO**

While gas on Celo can usually be paid in [many different currencies](https://docs.celo.org/celo-codebase/protocol/transactions/erc20-transaction-fees), when using MetaMask, gas fees will automatically be paid in CELO. This is because MetaMask will be using the [Ethereum-compatible Celo transaction format](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0035.md), which doesn't include the ****`feecurrency` field.

### **Incorrect Logo**

The MetaMask UI might show the ETH logo in places where it's meant to show the CELO logo or no logo at all.

{% hint style="warning" %}
MetaMask is primarily used for interacting with the Ethereum blockchain and does not natively support Celo compatibility. Celo recommends only sophisticated users and developers use it. Alternatively, you may choose a Celo native wallet[ here](https://docs.celo.org/getting-started/wallets).
{% endhint %}

