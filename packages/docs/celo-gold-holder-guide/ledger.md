# Using a Ledger Wallet

This section shows how to set up a [Ledger](https://www.ledger.com/) Nano S or X hardware wallet.

A hardware wallet or Hardware Security Module (HSM) holds a single random seed (expressed as a mnemonic) which can be used to generate any number of public-private keypairs, that is, any number of accounts ("wallets"), each with an associated address.

{% hint style="info" %}
The steps below require technical knowledge. You should be comfortable with the Command Line Interface (CLI) and understand the basics of how cryptographic network accounts work.
{% endhint %}

## Install the Celo Application

Start by installing the Celo application and setting a PIN on your Ledger device by following steps 1 and 2 [on this page](https://www.ledger.com/start/).

{% hint style="danger" %}
Make sure to securely back up both the PIN and the recovery phrase (also known as a backup key or mnemonic). If you lose them, or they are stolen, you lose access to your Celo assets with no recovery possible. The recovery phrase will be shown only once.
{% endhint %}

Open the Ledger Live App on your computer and follow the instructions on the screen.

Once in the app, click the settings gear icon (top right).

![](https://storage.googleapis.com/celo-website/docs/ledger-settings.png)

Click on the **Experimental features** menu.

Turn on **Developer mode.**

![](https://storage.googleapis.com/celo-website/docs/ledger-settings-dev-mode.png)

Exit the Settings menu by clicking on **Manager** on the left hand side bar.

Search for “Celo” in the app store.

Click **Install** for the Celo app, this will install the Celo App Version 1.0.1 on your device.

![](https://storage.googleapis.com/celo-website/docs/ledger-celo-app-install.png)

{% hint style="info" %}
If you’ve previously installed the Celo app on your device, you’ll see an **Upgrade** option instead of **Install.**
{% endhint %}

The installation is completed once you see the green tick and **Installed** label.

![](https://storage.googleapis.com/celo-website/docs/ledger-celo-app-installed.png)

You should now see on your device’s screen `Celo app`. You may need to toggle left or right using the buttons on the device to find the app.

Quit the Ledger Live app on your compute but keep the Ledger wallet connected to your computer.

## Setting up the Celo app

On your Ledger Nano device enter the PIN if prompted and press both buttons at the same time to open into the `Celo app`.

You will see `Pending Ledger review` on the device’s screen.

{% hint style="info" %}
`Pending Ledger review` means that the Celo app is approved to be in the developer store, but is undergoing additional reviews by the Ledger team before it is approved in the public store.
{% endhint %}

{% hint style="warning" %}
There have been reports of a possible [issue](https://github.com/celo-org/celo-ledger-spender-app/issues/13) that appears to affect developer store apps on the Ledger Nano X including Celo where a user clicking through the `Pending Ledger review` notice too rapidly can cause the device to freeze. If this occurs, wait until the device's battery is depleted, then charge and power up again.
{% endhint %}

Press both buttons on the device at the same time to continue.

Since most of the Celo CLI commands use smart contracts you will need to enable the Contract data option. In the Celo app navigate to `Settings` by toggling the buttons. Enter the menu by pressing both buttons at the same time.

When you see `Contract data NOT Allowed` press both buttons at the same time to enable.

You should now see `Contract data Allowed` on screen.

Exit by toggling all the way to the right to the `Back` option and select by pressing both buttons at the same time.

The Celo app is now ready for use and you should see `Application is ready` on the screen.

## Install the Celo CLI

Now that you have installed the Celo app on to your ledger, you can begin to use it with the Celo CLI.

Open the terminal application on your computer and install the Celo CLI (see [documentation](https://docs.celo.org/command-line-interface/introduction) for more information).

```bash
 npm install -g @celo/celocli
```

You will now need to point the Celo CLI to a node that is synchronized with one of Celo’s networks. We’ll be using the [Alfajores Network](https://docs.celo.org/getting-started/alfajores-testnet).

Configure the Celo CLI so that it uses a cLabs node on the Alfajores network.

```bash
celocli config:set --node https://alfajores-forno.celo-testnet.org/
```

{% hint style="danger" %} Connecting celocli to an untrusted node may allow that node to influence the transactions sent by celocli to the Ledger for signing. When in doubt, always point celocli to a node that you trust or are running yourself. {% endhint %}

Check that the node is synchronized.

```bash
celocli node:synced
```

The output should display `true`. If it displays `false` you may need to wait a bit and try again.

## Confirm Addresses

The Ledger's current seed phrase determines the device's accounts. In the terminal on your computer, you can view the first account's address with the following command:

```bash
celocli account:list --useLedger --ledgerAddresses 1
```

{% hint style="tip" %}
If you wish to generate more than one address from your seed phrase, you can display the first `N` (e.g. 10) addresses use the `--ledgerAddresses` flag.

```bash
celocli account:list --useLedger --ledgerAddresses N
```

To display addresses at specific indexes `M`and `N`(e. 2 and 654) use the `--ledgerCustomAddresses "[M, N]"`flag

```bash
celocli account:list --useLedger --ledgerCustomAddresses "[M, N]"
```

{% endhint %}

{% hint style="tip" %}
**Advanced:** Celo uses a [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) derivation path of `m/44'/52752'/0'/0/index`, where `index >= 0`.  
{% endhint %}

## Performing a Test transaction

Before using your address on the Celo Mainnet, you may want to test it on the Celo Alfajores Testnet with the following instructions.

Configure the Celo CLI so that it points to the Alfajores network.

```bash
celocli config:set --node https://alfajores-forno.celo-testnet.org/
```

Visit the Alfajores Faucet and send yourself some testnet Celo Gold at the following URL:

https://celo.org/developers/faucet

Check that you received the funds with the following command:

```bash
celocli account:balance <your-address>
```

Next, you'll need to enable "Contract Data" in the ledger app. Open the Celo App on your ledger device and go to Settings, then enable "Contract Data" to "Allowed". This setting is required because the celocli uses the ERC20 "pre-wrapped" version of Celo Gold and so sending transactions requires sending data to a smart contract.

Perform a test transaction by running the following command:

```bash
celocli transfer:gold --from=<your-address> --to=0x0000000000000000000000000000000000000001 --value=10000 --useLedger
```

You'll need to then approve the transaction on the Ledger device. Toggle right on the device until you see `Approve` on screen. Press both buttons at the same time to confirm.

Finally, you can see if your transaction was mined on the network by copying the transaction hash (txHash) outputted by the command, and searching for it on the [Alfajores Block Explorer](https://alfajores-blockscout.celo-testnet.org/).

## Using `celocli`

You can use `celocli` to securely sign transactions or proof-of-possessions with your Ledger.

To use `celocli` with your Ledger, ensure the device is connected to your computer, unlocked, and the `Celo` app is open and displaying `Application is ready`.

Then, simply append the `--useLedger` flag to any `celocli` commands with which you'd like to use a Ledger. You may also append the `--ledgerConfirmAddress` flag, which will require that you manually verify on the Ledger the address from which the transaction is being sent.

## Troubleshooting

If you have issues connecting to the Ledger, try the following:

- Check that the Ledger device is connected, powered on, and that you've unlocked it using the PIN.
- Check that no other applications are using the device. Close Ledger Live. Stop any local Celo Blockchain node, or ensure it is run with the `--nousb` option.
- Try unplugging and replugging the device. Some devices appear to trigger a warning on Macs saying: “USB Devices Disabled. Unplug the device using too much power to re-enable USB devices” which is usually resolved by reconnecting.
- Ensure that you are using the original cable supplied with your Ledger.
- Ensure that your Ledger has the [latest firmware](https://support.ledger.com/hc/en-us/articles/360002731113-Update-device-firmware). For Ledger Nano S, a firmware version of 1.6 or later is required.

There have been reports of a possible [issue](https://github.com/celo-org/celo-ledger-spender-app/issues/13) that appears to affect developer store apps on the Ledger Nano X including Celo where a user clicking through the `Pending Ledger review` notice too rapidly can cause the device to freeze. If this occurs, wait until the device's battery is depleted, then charge and power up again.
