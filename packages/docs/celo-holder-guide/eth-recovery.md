# Recovering CELO from an Ethereum Address

In this guide, steps are outlined to help you recover your [CELO (previously Celo Gold)](../overview.md#background-and-key-concepts) if you accidentally transferred them to an [Ethereum address](https://en.wikipedia.org/wiki/Ethereum#Addresses).

## Prerequisites

This guide assumes that you have access to the following:

- A computer with a [Command Line Interface](https://en.wikipedia.org/wiki/Command-line_interface). You can access it following these instructions:
    - [Windows](https://www.howtogeek.com/270810/how-to-quickly-launch-a-bash-shell-from-windows-10s-file-explorer/)
    - [Mac](https://macpaw.com/how-to/use-terminal-on-mac)
    - [Linux](https://askubuntu.com/questions/196212/how-do-you-open-a-command-line)
- [Celo Command Line Interface](../command-line-interface/introduction.md) installed on your computer
- The [24-word recovery phrase](https://kb.myetherwallet.com/en/security-and-privacy/what-is-a-mnemonic-phrase/) of your Ethereum address

{% hint style="danger" %}
There are [risks](https://www.cryptomathic.com/news-events/blog/cryptographic-key-management-the-risks-and-mitigations) associated with using a recovery phrase or a private key. Please do not share them with anyone else.
{% endhint %}

## Steps

Please follow the instructions below closely, because missteps can lead to errors or permanent loss of your tokens. To understand these steps, please read [What is Ethereum](https://ethereum.org/en/what-is-ethereum/) and [Celo Overview](https://docs.celo.org/overview).


### Prepare your recovery phases

Write your recovery phrase to a file using the following commands:

1. `nano recovery.txt`
2. Paste `<word1> <word2> … <word24>`
3. Replace the `<word>`s in brackets with the 24 words from your recovery phrase
4. Press ctrl-o to save
5. Press ctrl-x to exit

### Recover your Ethereum address on Celo

Recover your Ethereum address on the Celo network:

```
celocli account:new --indexAddress 0 --mnemonicPath recovery.txt --derivationPath "m/44'/60'/0'/0" --node https://rc1-forno.celo-testnet.org
```

This command will return you with:

- `accountAddress`: the same address as your Ethereum address
- `privateKey`: the private key associated with your address -- please record this private key on paper and not share with anyone else
- `publicKey`: the public key associated with your address

### Check your CELO balanace

Check your Celo account balance using this command:

```
celocli account:balance <accountAddress> --node https://rc1-forno.celo-testnet.org
```

Replace `<accountAddress>` with the `accountAddress` you got from the previous step.

### Transfer CELO

Now, you can transfer your CELO to an address of choice:

```
celocli transfer:celo --from <accountAddress> --to <addressOfChoice> --value <valueInCeloWei> --privateKey <privateKey> --node https://rc1-forno.celo-testnet.org
```

- Replace `<accountAddress>` with the `accountAddress` you got from the previous step.
- Replace `<addressOfChoice>` with the address that you want to send CELO to.
- Replace `<valueInCeloWei>` with the amount you want to send, but this number needs to be slightly lower than your balance, as there’s a transaction fee.

{% hint style="info" %}
Note that the value has a unit of CELO Wei (1 CELO = 10^18 CELO Wei), so if you want to send 1 CELO, the `<valueInCeloWei>` should be 1000000000000000000.
{% endhint %}
