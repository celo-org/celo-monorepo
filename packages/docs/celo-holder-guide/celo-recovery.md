# Recovering Ethereum from a Celo Address

In this guide, steps are outlined to help you recover your [Ethereum](https://en.wikipedia.org/wiki/Ethereum#Addresses) if you accidentally transferred them to a [CELO (previously Celo Gold)](../overview.md#background-and-key-concepts) if you accidentally transferred them to an [Ethereum address](https://en.wikipedia.org/wiki/Ethereum#Addresses).

## Prerequisites

This guide assumes that you have access to the following:

- The [24-word recovery phrase](https://kb.myetherwallet.com/en/security-and-privacy/what-is-a-mnemonic-phrase/) of your Celo address
- MyEtherWallet
- Ledger Wallet (only if you are using a hardware wallet instead of a mnemonic)

{% hint style="danger" %}
There are [risks](https://www.cryptomathic.com/news-events/blog/cryptographic-key-management-the-risks-and-mitigations) associated with using a recovery phrase or a private key. Please do not share them with anyone else.
{% endhint %}

## Steps

Please follow the instructions below closely, because missteps can lead to errors or permanent loss of your tokens. To understand these steps, please read [What is Ethereum](https://ethereum.org/en/what-is-ethereum/) and [Celo Overview](https://docs.celo.org/overview).


### Prepare your recovery phases

Write your recovery phrase to a file using the following commands:

1. `nano recovery.txt`
2. Paste `<word1> <word2> … <word24>`
3. Replace the `<word>`s in brackets with the words from your recovery phrase (usually 24 words, but can be 12, 15, 18, 21 or 24 words, as specified in the [BIP 39 standard](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki))
4. Press ctrl-o to save
5. Press ctrl-x to exit

### Recover your Celo address on Ethereum with Mnemonic

Recover your Celo address on the Ethereum network:
 
1. Download MyEtherWallet for Desktop (It is recommended to use the Desktop version over a webapp version)
2. Click on "Access My Wallet"
3. Click on "Access By Mnemonic Phrase"
4. Enter the 24-word recovery phrase for Celo
5. You should now have access to the same address on Ethereum, where you can recover the Ethereum you accidentally sent to your Celo address.


### Recover your Celo address on Ethereum with Ledger
Recover your Celo address on the Ethereum network with Ledger:
 
1. Download MyEtherWallet for Desktop (It is recommended to use the Desktop version over a webapp version)
2. Click on "Access My Wallet"
3. Click on "Access By Hardware Wallet"
4. In the dropdown option for Networ, select "Custom Paths"
5. Enter the following derivation path: `m/44’/52752’/0’/0` 
6. You should now have access to the same address on Ethereum, where you can recover the Ethereum you accidentally sent to your Celo address.

For more information on custom derivation paths, check out the [MEW docs](https://kb.myetherwallet.com/en/hardware-wallets/using-hardware-with-custom-path/).
