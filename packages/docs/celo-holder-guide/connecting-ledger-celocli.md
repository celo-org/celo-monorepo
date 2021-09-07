# Connecting Ledger to Celo CLI

### Install the Celo CLI

Open the terminal application on your computer and install the [Celo CLI](https://docs.celo.org/command-line-interface/introduction):

```bash
npm install -g @celo/celocli
```

If you have previously installed the CLI, ensure that you are using version 0.0.47 or later:

```bash
celocli --version
```

And if not, upgrade by running the same command as above.

You will now need to point the Celo CLI to a node that is synchronized with one of Celo’s networks.

#### [Configure for Celo Mainnet](https://docs.celo.org/getting-started/mainnet)

Configure the Celo CLI so that it uses a cLabs node on the Alfajores network.

```bash
celocli config:set --node https://forno.celo.org/
```

{% hint style="danger" %} Connecting celocli to an untrusted node may allow that node to influence the transactions sent by the Celo CLI to the Ledger for signing. When in doubt, always use a node that you trust or are running yourself. {% endhint %}   

#### [Configure for Celo Alfajores Testnet](https://docs.celo.org/getting-started/alfajores-testnet).

Configure the Celo CLI so that it uses a cLabs node on the Alfajores network.

```bash
celocli config:set --node https://alfajores-forno.celo-testnet.org/
```

{% hint style="danger" %} Connecting celocli to an untrusted node may allow that node to influence the transactions sent by the Celo CLI to the Ledger for signing. When in doubt, always use a node that you trust or are running yourself. {% endhint %}

#### Check that the node is synchronized to Celo CLI:

```bash
celocli node:synced
```

The output should display `true`. If it displays `false` you may need to wait a bit and try again.

### Confirm Addresses on Celo CLI

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

### Performing a Testnet transaction on Celo CLI

Before using your address on the Celo Mainnet, you may want to test it on the Celo Alfajores Testnet with the following instructions.

Visit the Alfajores Faucet and send yourself some testnet CELO at the following URL:

https://celo.org/developers/faucet

Check that you received the funds with the following command:

```bash
celocli account:balance <your-address> --node https://alfajores-forno.celo-testnet.org/
```

Next, you'll need to enable "Contract Data" in the ledger app. Open the Celo App on your ledger device and go to Settings, then enable "Contract Data" to "Allowed". This setting is required because the celocli uses the ERC20 "pre-wrapped" version of CELO and so sending transactions requires sending data to a smart contract.

Perform a test transaction by running the following command:

```bash
celocli transfer:gold --from=<your-address> --to=0x0000000000000000000000000000000000000001 --value=10000 --useLedger --node https://alfajores-forno.celo-testnet.org/
```

You'll need to then approve the transaction on the Ledger device. Toggle right on the device until you see `Approve` on screen. Press both buttons at the same time to confirm.

Finally, you can see if your transaction was mined on the network by copying the transaction hash (txHash) outputted by the command, and searching for it on the [Alfajores Block Explorer](https://alfajores-blockscout.celo-testnet.org/).

### Using `celocli`

You can use `celocli` to securely sign transactions or proof-of-possessions with your Ledger.

To use `celocli` with your Ledger, ensure the device is connected to your computer, unlocked, and the `Celo` app is open and displaying `Application is ready`.

Then, simply append the `--useLedger` flag to any `celocli` commands with which you'd like to use a Ledger. You may also append the `--ledgerConfirmAddress` flag, which will require that you manually verify on the Ledger the address from which the transaction is being sent.

## View Account Balance

In order to view your account Balance on your Ledger with `celocli`, you need to run the following command:

```sh
# If you haven't set the node config to mainnet, do it first
celocli config:set --node=https://forno.celo.org
celocli account:balance <your-address>
```

This will display the specific account balance for your address on Celo Mainnet.

## Receive Crypto Assets

In order to receive Celo on your address, whether it's CELO or cUSD or any stablecoin in the future, you must share your specific address with the sender.

Once a sender has confirmed they sent you the assets to your Ledger address, ask for the transaction ID which you can lookup on the [Explorer](https://explorer.celo.org/).

## Send Crypto Assets

In order to send CELO or cUSD from your Ledger, you just need a recipient address to send to. Once you have that and the amount you would like to send (in our example, 10 CELO), we will go over how to send CELO using `celocli`.

```sh
celocli transfer:gold --from=<your-address> --to=<recipient-address> --value=10 --useLedger
```
You'll need to then approve the transaction on the Ledger device. Toggle right on the device until you see `Approve` on screen. Press both buttons at the same time to confirm.

You'll then get a transaction hash when it's confirmed that the transaction was mined by the network, and you can check the status of the transaction on the explorer [here](https://explorer.celo.org).

## Troubleshooting

If you have issues connecting to the Ledger, try the following:

- Check that the Ledger device is connected, powered on, and that you've unlocked it using the PIN.
- Check that no other applications are using the device. Close Ledger Live. Stop any local Celo Blockchain node, or ensure it is run with the `--nousb` option.
- Try unplugging and replugging the device. Some devices appear to trigger a warning on Macs saying: “USB Devices Disabled. Unplug the device using too much power to re-enable USB devices” which is usually resolved by reconnecting.
- Ensure that you are using the original cable supplied with your Ledger.
- Ensure that your Ledger has the [latest firmware](https://support.ledger.com/hc/en-us/articles/360002731113-Update-device-firmware). For Ledger Nano S, a firmware version of 1.6 or later is required.
- Ensure that you are running the latest version of the Celo CLI.

There have been reports of a possible [issue](https://github.com/celo-org/celo-ledger-spender-app/issues/13) that appears to affect developer store apps on the Ledger Nano X including the Celo Ledger App. This is believed to be fixed in version 1.0.3. In earlier versions, a user clicking through the `Pending Ledger review` notice too rapidly can cause the device to freeze. If this occurs, wait until the device's battery is depleted, then charge and power up again. Then use Ledger Live Manager to update the installed version of the Celo Ledger App.
