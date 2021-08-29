# Using a Ledger Wallet

This section shows how to set up a [Ledger](https://www.ledger.com/) Nano S or X hardware wallet.

A hardware wallet or Hardware Security Module \(HSM\) holds a single random seed \(expressed as a mnemonic\) which can be used to generate any number of public-private keypairs, that is, any number of accounts \("wallets"\), each with an associated address.

{% hint style="info" %}
The steps below require technical knowledge. You should be comfortable with the Command Line Interface \(CLI\) and understand the basics of how cryptographic network accounts work.
{% endhint %}

## Requirements

Make sure to have the following before you begin:

* Initialized your [Ledger Nano X or S](https://support.ledger.com/hc/en-us/articles/360018784134)
* The [latest firmware](https://support.ledger.com/hc/en-us/articles/360013349800) is installed
* [Ledger Live](https://support.ledger.com/hc/en-us/articles/360006395233-Take-your-first-steps) is ready to be used.
* You have [celocli](https://www.npmjs.com/package/@celo/celocli) installed.

## Installation Instructions

### Install the Celo Application

Start by installing the Celo application and setting a PIN on your Ledger device by following steps 1 and 2 [on this page](https://www.ledger.com/start/).

{% hint style="danger" %}
Make sure to securely back up both the PIN and the recovery phrase \(also known as a backup key or mnemonic\). If you lose them, or they are stolen, you lose access to your Celo assets with no recovery possible. The recovery phrase will be shown only once.
{% endhint %}

Open the Ledger Live App on your computer and follow the instructions on the screen.

Search for “Celo” in the app store.

Click **Install** for the Celo app, this will install the Celo App Version 1.0.3 on your device.

![](https://storage.googleapis.com/celo-website/docs/ledger-celo-app-install.png)

{% hint style="info" %}
If you’ve previously installed the Celo app on your device, you’ll see an **Upgrade** option instead of **Install.**
{% endhint %}

The installation is completed once you see the green tick and **Installed** label.

![](https://storage.googleapis.com/celo-website/docs/ledger-celo-app-installed.png)

You should now see on your device’s screen `Celo app`. You may need to toggle left or right using the buttons on the device to find the app.

Quit the Ledger Live app on your compute but keep the Ledger wallet connected to your computer.

### Setting up the Celo app

On your Ledger Nano device enter the PIN if prompted and press both buttons at the same time to open into the `Celo app`.

Press both buttons on the device at the same time to continue.

The Celo app is now ready for use and you should see `Application is ready` on the screen.

## Setup Instructions

### Install the Celo CLI

Now that you have installed the Celo app on to your ledger, you can begin to use it with the Celo CLI.

Open the terminal application on your computer and install the [Celo CLI](https://docs.celo.org/command-line-interface/introduction):

```bash
npm install -g @celo/celocli
```

If you have previously installed the CLI, ensure that you are using version 0.0.47 or later:

```bash
celocli --version
```

And if not, upgrade by running the same command as above.

You will now need to point the Celo CLI to a node that is synchronized with one of Celo’s networks. We’ll be using the [Alfajores Network](https://docs.celo.org/getting-started/alfajores-testnet).

Configure the Celo CLI so that it uses a cLabs node on the Alfajores network.

```bash
celocli config:set --node https://alfajores-forno.celo-testnet.org/
```

{% hint style="danger" %}
Connecting celocli to an untrusted node may allow that node to influence the transactions sent by the Celo CLI to the Ledger for signing. When in doubt, always use a node that you trust or are running yourself.
{% endhint %}

Check that the node is synchronized:

```bash
celocli node:synced
```

The output should display `true`. If it displays `false` you may need to wait a bit and try again.

### Confirm Addresses on Celo CLI

The Ledger's current seed phrase determines the device's accounts. In the terminal on your computer, you can view the first account's address with the following command:

```bash
celocli account:list --useLedger --ledgerAddresses 1
```

{% hint style="info" %}
If you wish to generate more than one address from your seed phrase, you can display the first `N` \(e.g. 10\) addresses use the `--ledgerAddresses` flag.

```bash
celocli account:list --useLedger --ledgerAddresses N
```

To display addresses at specific indexes `M`and `N`\(e. 2 and 654\) use the `--ledgerCustomAddresses "[M, N]"`flag

```bash
celocli account:list --useLedger --ledgerCustomAddresses "[M, N]"
```
{% endhint %}

{% hint style="info" %}
**Advanced:** Celo uses a [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) derivation path of `m/44'/52752'/0'/0/index`, where `index >= 0`.
{% endhint %}

### Performing a Test transaction on Celo CLI

Before using your address on the Celo Mainnet, you may want to test it on the Celo Alfajores Testnet with the following instructions.

Visit the Alfajores Faucet and send yourself some testnet CELO at the following URL:

[https://celo.org/developers/faucet](https://celo.org/developers/faucet)

Check that you received the funds with the following command:

```bash
celocli account:balance <your-address> --node https://alfajores-forno.celo-testnet.org/
```

Next, you'll need to enable "Contract Data" in the ledger app. Open the Celo App on your ledger device and go to Settings, then enable "Contract Data" to "Allowed". This setting is required because the celocli uses the ERC20 "pre-wrapped" version of CELO and so sending transactions requires sending data to a smart contract.

Perform a test transaction by running the following command:

```bash
celocli transfer:gold --from=<your-address> --to=0x0000000000000000000000000000000000000001 --value=10000 --useLedger --node https://alfajores-forno.celo-testnet.org/
```

You'll need to then approve the transaction on the Ledger device. Toggle right on the device until you see `Approve` on screen. Press both buttons at the same time to confirm.

Finally, you can see if your transaction was mined on the network by copying the transaction hash \(txHash\) outputted by the command, and searching for it on the [Alfajores Block Explorer](https://alfajores-blockscout.celo-testnet.org/).

### Using `celocli`

You can use `celocli` to securely sign transactions or proof-of-possessions with your Ledger.

To use `celocli` with your Ledger, ensure the device is connected to your computer, unlocked, and the `Celo` app is open and displaying `Application is ready`.

Then, simply append the `--useLedger` flag to any `celocli` commands with which you'd like to use a Ledger. You may also append the `--ledgerConfirmAddress` flag, which will require that you manually verify on the Ledger the address from which the transaction is being sent.

## View Account Balance

In order to view your account Balance on your Ledger with `celocli`, you need to run the following command:

```bash
# If you haven't set the node config to mainnet, do it first
celocli config:set --node=https://forno.celo.org
celocli account:balance <your-address>
```

This will display the specific account balance for your address on Celo Mainnet.

## Receive Crypto Assets

In order to receive Celo on your address, whether it's CELO or cUSD or any stablecoin in the future, you must share your specific address with the sender.

Once a sender has confirmed they sent you the assets to your Ledger address, ask for the transaction ID which you can lookup on the [Explorer](https://explorer.celo.org/).

## Send Crypto Assets

In order to send CELO or cUSD from your Ledger, you just need a recipient address to send to. Once you have that and the amount you would like to send \(in our example, 10 CELO\), we will go over how to send CELO using `celocli`.

```bash
celocli transfer:gold --from=<your-address> --to=<recipient-address> --value=10 --useLedger
```

You'll need to then approve the transaction on the Ledger device. Toggle right on the device until you see `Approve` on screen. Press both buttons at the same time to confirm.

You'll then get a transaction hash when it's confirmed that the transaction was mined by the network, and you can check the status of the transaction on the explorer [here](https://explorer.celo.org).

## Troubleshooting

If you have issues connecting to the Ledger, try the following:

* Check that the Ledger device is connected, powered on, and that you've unlocked it using the PIN.
* Check that no other applications are using the device. Close Ledger Live. Stop any local Celo Blockchain node, or ensure it is run with the `--nousb` option.
* Try unplugging and replugging the device. Some devices appear to trigger a warning on Macs saying: “USB Devices Disabled. Unplug the device using too much power to re-enable USB devices” which is usually resolved by reconnecting.
* Ensure that you are using the original cable supplied with your Ledger.
* Ensure that your Ledger has the [latest firmware](https://support.ledger.com/hc/en-us/articles/360002731113-Update-device-firmware). For Ledger Nano S, a firmware version of 1.6 or later is required.
* Ensure that you are running the latest version of the Celo CLI.

There have been reports of a possible [issue](https://github.com/celo-org/celo-ledger-spender-app/issues/13) that appears to affect developer store apps on the Ledger Nano X including the Celo Ledger App. This is believed to be fixed in version 1.0.3. In earlier versions, a user clicking through the `Pending Ledger review` notice too rapidly can cause the device to freeze. If this occurs, wait until the device's battery is depleted, then charge and power up again. Then use Ledger Live Manager to update the installed version of the Celo Ledger App.

## Using Your Ledger with Celo Wallet app

An alternative to using `celocli` is [celowallet.app](https://celowallet.app) which supports Ledger and provides a simple interface for transacting with Celo accounts.

1. Load the [wallet app](https://celowallet.app) in a modern browser, Chrome is recommended.
2. Click on `Use Existing Account` option.
3. Click on the Ledger icon.
4. Connect your Ledger Nano to your computer.
5. Unlock your Ledger Nano with your PIN.
6. Go to the Celo app on your Ledger Nano and open it.
7. On `celowallet.app` website, click on `Import Account`. Make sure you are using the right Address Index. Index 0 means the first address on the list.
8. There will be a popup in the web browser to approve the Ledger device, click on Nano in the popup and click `Connect`.
9. Verify on your Ledger Nano that this is the address you want to use, then click the right button on the Ledger until you see `Approve` then click both buttons to approve.
10. You are now using celowallet.app with your Ledger

