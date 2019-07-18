# Using the CLI

This section describes how to make a transaction using the Celo CLI. Doing so is easy and quick once you have fauceted yourself some funds and have a full node running.

### **Prerequisites**

- **You have Docker installed.** If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with sudo depending on your installation environment.
- **You have celocli installed.**

  See to [Command Line Interface \(CLI\)](../command-line-interface/introduction.md) for instructions on how to get set up.

- **You have a full node running.** See the [Running a Full Node](running-a-full-node.md) instructions for more details on running a full node.
- **You have fauceted yourself.** See the [Faucet](faucet.md) instructions for help funding your account with testnet tokens.

### **Sending a payment**

Unlock your accounts so that you can send transactions:

`$ celocli account:unlock --account $YOUR_ADDRESS --password <YOUR_PASSWORD>`

Send a payment to another account:

`$ celocli account:transferdollar --from $YOUR_ADDRESS --amountInWei $AMOUNT --to $DESTINATION_ADDRESS`
