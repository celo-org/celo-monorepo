# Connecting to a local ultralight node on Alfajores testnet

In this guide, we are going to set up an [ultralight node](https://docs.celo.org/overview#ultralight-synchronization) connected to Alfajores running on your local machine. This node will provide account management features, allow you to read data from the Alfajores network as well as broadcast transactions, and give you a simple, reliable way to connect the [SDK](https://docs.celo.org/developer-guide/overview/introduction) or the [celocli](https://docs.celo.org/command-line-interface/introduction) to the test network. Connecting to the mainnet will be very similar. For a mainnet node, the link to docker image for the client software and the network id will be different, but everything else will be the same.

## Set up the node

Start by following the guide outlining the setup for running a Baklava full node, but replace the CELO\_IMAGE and NETWORK\_ID specified in the Baklava tutorial with the following information to connect to the Alfajores network:

```text
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:alfajores
export NETWORK_ID=44786
```

Since we are running an Alfajores [ultralight client](https://docs.celo.org/overview#ultralight-synchronization), we will name it accordingly and set the `--syncmode lightest`. The command to start the node with docker looks like

{% hint style="warning" %}
Before you start the node, add the `--allow-insecure-unlock` flag to enable unlocking your account using the celocli or docker command
{% endhint %}

```javascript
docker run --name alfajores-ultralight -d --restart unless-stopped -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode lightest --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --bootnodes $BOOTNODE_ENODES --allow-insecure-unlock
```

## Connect to the node and send a transaction

Now that your node is up and running, you can connect to it at `http://localhost:8545`. The [celocli](https://docs.celo.org/command-line-interface/introduction) will connect to this endpoint by default. You can also connect the SDK to this endpoint.

If you are sending transactions to the network using the celocli or SDK, you will first need to unlock the account. You can unlock the account with the following command, replacing `<YOUR_ADDRESS>` with your node account address and `<YOUR_PASSWORD>` with the password that you set when you created the account. The last parameter tells the node how many seconds you would like to unlock the account for. In this case, the account will be unlocked for 300 seconds before locking again. You can also [unlock the account using celocli](https://docs.celo.org/command-line-interface/account#unlock).

{% hint style="info" %}
If you forget your password, you will have to create a new account and fund it via the faucet.
{% endhint %}

```text
docker exec alfajores-ultralight geth attach --exec 'personal.unlockAccount("<YOUR_ADDRESS>","<YOUR_PASSWORD>", 300)'
```

This command will return `true` if the account unlocked successfully.

Now you should be able to connect to your locally running Alfajores node with the ContractKit and send a transaction using this node.js script.

{% hint style="warning" %}
If the transaction does not work immediately, check that your account has funds in it on the [Alfajores block explorer](https://alfajores-blockscout.celo-testnet.org/).
{% endhint %}

```javascript
const Kit = require('@celo/contractkit')
const kit = Kit.newKit('http://localhost:8545')

let anAddress = '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d'

async function wrapper(){
   let accounts = await kit.web3.eth.getAccounts()
   kit.defaultAccount = accounts[0]

   let goldtoken = await kit.contracts.getGoldToken()
   let tx = await goldtoken.transfer(anAddress, 100000).send()
   let receipt = await tx.waitReceipt()
   console.log(receipt)
}

wrapper()
```
