# Getting an Account and Funds

## Try the Celo Wallet with a Funded Account

To start experimenting with the Alfajores Testnet, you will first need to get a funded account.

{% hint style="warning" %}
Alfajores Testnet accounts hold no real world economic value. The testnet's data may be reset on a regular basis. This will erase your accounts, their balance and your transaction history.
{% endhint %}

Getting an account is really being given or generating a public-private keypair. This gives you control of balances accessible with the address corresponding to that key. For CELO, this is a native balance stored at the account whose address matches your key. For Celo Dollars, an ERC-20 token, the StableCoin smart contract maintains in its storage a mapping of the balance of each address.

### Get the Alfajores Developer Wallet

You can download the Celo wallet for Android from the [Google Play Store](https://play.google.com/apps/testing/org.celo.mobile.alfajores) or for iOS on [TestFlight](https://testflight.apple.com/join/s212x3Rp).  Once you install the app, an account will be created for you and you will be able to verify your phone number. Since verifying your phone number costs gas, you have to fund your account using the [Alfajores faucet](https://celo.org/developers/faucet) to pay for the verification process. 

### Restore from backup

If you already have an account and the corresponding seed phrase, you can follow the instructions in the app to regain access to your account. 

## Creating an empty account with the Celo Client

You can also use the [Celo Blockchain client](https://github.com/celo-org/celo-blockchain) to create and manage account keypairs.

#### **Prerequisites**

- **You have Docker installed.** If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with sudo depending on your installation environment.

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
