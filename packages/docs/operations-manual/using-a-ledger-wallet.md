# Using a Ledger Wallet

This section shows how to set up a [Ledger](https://www.ledger.com/) Nano S or X hardware wallet and get Celo addresses.

{% hint style="danger" %}
The steps below require technical knowledge. You should be comfortable with the Command Line Interface (CLI) and understand the basics of how cryptographic network accounts work.
{% endhint %}

## Install the Celo Application

Start by installing the Celo application and setting a PIN on your Ledger device by following steps 1 and 2 [on this page](https://www.ledger.com/start/).

{% hint style="danger" %}
Make sure to back up both the PIN and the recovery phrase, if you lose them you lose access to your Celo assets with no recovery possible.
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

 ## Install the Celo CLI

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

## Get Celo Addresses

On your Ledger Nano device enter the PIN if prompted and press both buttons at the same time to open into the `Celo app`.

You will see `Pending Ledger review` on the device’s screen.

{% hint style="info" %}
`Pending Ledger review` means that the Celo app is approved to be in the developer store but undergoing additional reviews by the Leger team to be approved in the public store.
 {% endhint %}

Press both buttons on the device at the same time to continue.

Since most of the Celo CLI commands use smart contracts you will need to enable the Contract data option. In the Celo app navigate to `Settings` by toggling the buttons. Enter the menu by pressing both buttons at the same time.

When you see `Contract data NOT Allowed` press both buttons at the same time to enable.

You should now see `Contact data Allowed` on screen.

Exit by toggling all the way to the right to the `Back` option and select by pressing both buttons at the same time.

The Celo app is now ready for use and you should see `Application is ready` on the screen.

Accounts are automatically generated on your device. In the terminal on your computer, display the first two public addresses.

```bash
celocli node:accounts --useLedger
```

{% hint style="tip" %}
To display the first `N` (e.g. 10) addresses use the `--ledgerAddresses` flag.
```bash
celocli node:accounts --useLedger --ledgerAddresses N
```

To display addresses at specific indexes `M`and `N`(e. 2 and 654) use the `--ledgerCustomAddresses "[M, N]"`flag
```bash
celocli node:accounts --useLedger --ledgerCustomAddresses "[M, N]"
```
 {% endhint %}

## Using celocli

You can now use `celocli` to securely sign transactions or key proof-of-possessions with your Ledger.

To use `celocli` with your Ledger, ensure the device is connected to your computer, unlocked, and the `Celo` app is open and displaying `Application is ready`.

Then, simply append the `--useLedger` flag to any `celocli` commands with which you'd like to use a Ledger.

The following commands are an example of how you might authorize a vote signing key stored on a Ledger, for your account key, which is also stored on a Ledger, or for your ReleaseGold account, for which the beneficiary key is stored on a Ledger.


```bash
# Plug in the Ledger containing the vote signing key to authorize and run the following command to securely generate the proof-of-possession.
celocli accounts:proof-of-possession --account $ACCOUNT_ADDRESS --signer $VOTE_SIGNER_ADDRESS --useLedger

# If you wish to authorize a vote signing key for your account, plug in the Ledger containing the account key and run the following command to authorize the vote signing key.
celocli account:authorize --from $ACCOUNT_ADDRESS --role vote --signer $VOTE_SIGNER_ADDRESS --signature $PROOF_OF_POSSESSION --useLedger

# If instead you wish to authorize a vote signing key for your ReleaseGold account, plug in the Ledger containing the beneficiary key for the ReleaseGold contract and run the following command.
celocli release-gold:authorize --contract $RELEASE_GOLD_CONTRACT_ADDRESS --role vote --signer $VOTE_SIGNER_ADDRESS --signature $PROOF_OF_POSSESSION --useLedger
```
