# Getting an Account and Funds

## Try the Celo Wallet with a Funded Account

To start experimenting with the Alfajores Testnet, you will first need to get a funded account.

{% hint style="warning" %}
Alfajores Testnet accounts hold no real world economic value. The testnet's data may be reset on a regular basis. This will erase your accounts, their balance and your transaction history.
{% endhint %}

Getting an account is really being given or generating a public-private keypair. This gives you control of balances accessible with the address corresponding to that key. For CELO, this is a native balance stored at the account whose address matches your key. For Celo Dollars, an ERC-20 token, the StableCoin smart contract maintains in its storage a mapping of the balance of each address.

### Get an Invitation Code

If you have access to an Android device and would like to try the Celo Wallet, the fastest way to get started is to get an invitation code, pre-funded with 10 Celo Dollars.

Visit the [Celo Wallet Page](https://celo.org/build/wallet) and enter your phone number to be messaged an invitation. Following this personalized URL will download the [Celo Wallet App](https://play.google.com/store/apps/details?id=org.celo.mobile.alfajores) from the Play Store, generate an account only you have access to, and transfer escrowed funds into it.

### Restore from backup

If you already have an account and the corresponding seed phrase, you can follow the instructions in the [Celo Wallet App](https://play.google.com/store/apps/details?id=org.celo.mobile.alfajores) to regain access to your account. You can also receive a seed phrase for a new, funded account by visiting the [Celo Wallet Page](https://celo.org/build/wallet).

## Creating an empty account with the Celo Client

You can also use the Celo Blockchain client to create and manage account keypairs.

#### **Prerequisites**

* **You have Docker installed.** If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with sudo depending on your installation environment.

Create and cd into the directory where you want to store the keypair. You can name this whatever you’d like, but here’s a default you can use:

```bash
mkdir celo-data-dir $ cd celo-data-dir
```

Create an account by running this command:

```bash
docker run -v `pwd`:/root/.celo --rm -it us.gcr.io/celo-org/geth:alfajores account new
```

It will prompt you for a passphrase, ask you to confirm it, and then will output your account address:

`Address: <YOUR-ACCOUNT-ADDRESS>`

This creates a keypair and stores it. Save this address to an environment variable, so that you can reference it later:

```bash
export CELO_ACCOUNT_ADDRESS=<YOUR-ACCOUNT-ADDRESS>
```

## **Add funds to an existing account with the Faucet**

The Alfajores Testnet Faucet is an easy way to get more funds deposited to an account, however it was created.

Visit [celo.org/build/faucet](https://celo.org/build/faucet), and enter your account address. If you are using the Celo Wallet, you can find your account address in the Settings page. Complete the Captcha, and click 'Add Funds'.

Each time you complete a faucet request, your account is funded with an additional 10 Celo Dollars and 5 CELO.

You may do this multiple times if you require more funds.

