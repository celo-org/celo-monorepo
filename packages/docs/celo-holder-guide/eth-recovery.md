# Recovering CELO from an Ethereum Wallet

In this tutorial, steps are outlined to help you recover your [CELO (previously Celo Gold)](../overview.md#background-and-key-concepts) if you accidentally transferred them to an [Ethereum address](https://en.wikipedia.org/wiki/Ethereum#Addresses).

## Prerequisites

This guide assumes that you have access to the following:

- A computer with a [Command Line Interface](https://en.wikipedia.org/wiki/Command-line_interface). You can access it following these instructions:
    - [Windows](https://www.howtogeek.com/270810/how-to-quickly-launch-a-bash-shell-from-windows-10s-file-explorer/)
    - [Mac](https://macpaw.com/how-to/use-terminal-on-mac)
    - [Linux](https://askubuntu.com/questions/196212/how-do-you-open-a-command-line)
- The [24-word recovery phrase](https://kb.myetherwallet.com/en/security-and-privacy/what-is-a-mnemonic-phrase/) of your Ethereum address

{% hint style="danger" %}
There are [risks](https://www.cryptomathic.com/news-events/blog/cryptographic-key-management-the-risks-and-mitigations) associated with using a recovery phrase or a private key. Please do not share them with anyone else.
{% endhint %}

## Steps

Please follow the instructions below closely, because missteps can lead to errors or permanent loss of your tokens. To understand these steps, please read [What is Ethereum](https://ethereum.org/en/what-is-ethereum/) and [Celo Overview](https://docs.celo.org/overview).


### Prepare recovery phases

Write your recovery phrase to a file using the following commands
- `nano recovery.txt`
- Paste `<word1> <word2> … <word24>`
- Replace the `<word>`s in brackets with the 24 words from your recovery phrase.
- Press ctrl-o to save
- Press ctrl-x to exit

### Recover your Ethereum address on Celo

Recover your Ethereum address on the Celo network through the following command

```
celocli account:new --indexAddress 0 --mnemonicPath recovery.txt --derivationPath "m/44'/60'/0'/0" --node https://rc1-forno.celo-testnet.org
```
