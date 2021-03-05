# Celo DAppKit

DAppKit is a lightweight set of functions that allow mobile DApps to work with the Celo Wallet to sign transactions and access the user's account. This allows for a better user experience: DApps can focus on a great native experience without having to worry about key management. It also provides a simpler development experience, as no state or connection management is necessary.

DAppKit supports the following functionality:

- Request permission to access account information and phone number from the Celo Wallet
- Request permission to sign transaction(s) from the Celo Waller
- Look up phone numbers using the [Identity Protocol](https://docs.celo.org/celo-codebase/protocol/identity) to find contacts using Celo.

DAppKit is currently built with the excellent [Expo framework](https://expo.io) in mind. In the near future, we will make it more generic to all of React Native and possibly native stacks, but for now you get to take advantage of some awesome features like an incredibly easy setup, hot-reloading, and more.

# Usage

DAppKit uses deeplinks to communicate between your DApp and the Celo Wallet. All "requests" that your DApp makes to the Wallet needs to contain the following meta payload:

- `requestId` A string you can pass to DAppKit, that you can use to listen to the response for that request
- `dappName` A string that will be displayed to the user, indicating the DApp requesting access/signature.
- `callback` The deeplink that the Celo Wallet will use to redirect the user back to the DApp with the appropriate payload. If you want the user to be directed to a particular page in your DApp. With Expo, it's as simple as `Linking.makeUrl('/my/path')`

## Requesting Account Address

One of the first actions you will want to do as a DApp Developer is to get the address of your user's account, to display relevant information to them. It can be done as simply as:

([expo base template commit](https://github.com/celo-org/dappkit-base/commit/9ef5d8916018a1f7b09d062fdd601b851fb4bf79))

```javascript
import { requestAccountAddress, waitForAccountAuth } from '@celo/dappkit'
import * as Linking from 'expo-linking'

login = async () => {
  const requestId = 'login'
  const dappName = 'My DappName'
  const callback = Linking.makeUrl('/my/path')

  requestAccountAddress({
    requestId,
    dappName,
    callback,
  })

  const dappkitResponse = await waitForAccountAuth(requestId)

  this.setState({ address: dappkitResponse.address, phoneNumber: dappkitResponse.phoneNumber })
}
```

Once you have the account address, you can make calls against your own smart contract, or use [ContractKit](../contractkit/README.md) to fetch a user's balance:

([expo base template commit](https://github.com/celo-org/dappkit-base/commit/4fa0dd16a04cd2831dd685378bc49399984bd553))

```javascript
  const address = dappkitResponse.address
  this.setState({ address, phoneNumber: dappkitResponse.phoneNumber, isLoadingBalance: true })

  const kit = newKit('https://alfajores-forno.celo-testnet.org')
  kit.defaultAccount = address

  const stableToken = await kit.contracts.getStableToken()

  const [cUSDBalanceBig, cUSDDecimals] = await Promise.all([stableToken.balanceOf(address), stableToken.decimals()])
  const cUSDBalance = this.convertToContractDecimals(cUSDBalanceBig, cUSDDecimals)

  this.setState({ cUSDBalance, isLoadingBalance: false })
```

## Signing Transactions

Let's go from accessing account information to submitting transactions. To alter state on the blockchain, make a transaction object with your smart contract or any of the Celo Core Contracts in ContractKit. All that is left to do is to pass the transaction object to DAppKit.

([expo base template commit](https://github.com/celo-org/dappkit-base/commit/cf35c82d7650e7b6bc7208ece32440d3a32d9cc5))

```javascript
import {
  requestTxSig,
  waitForSignedTxs
} from "@celo/dappkit";

// Create the transaction object
const stableToken = await kit.contracts.getStableToken();
const decimals = await stableToken.decimals();
const txObject = stableToken.transfer(
  address,
  new BigNumber(10).pow(parseInt(decimals, 10)).toString()
).txo;

const requestId = "transfer";
const dappName = "My DappName";
const callback = Linking.makeUrl("/my/path");

// Request the TX signature from DAppKit
requestTxSig(
  kit,
  [
    {
      tx: txObject,
      from: this.state.address,
      to: stableToken.contract.options.address,
      feeCurrency: FeeCurrency.cUSD
    }
  ],
  { requestId, dappName, callback }
);

const dappkitResponse = await waitForSignedTxs(requestId);
const rawTx = dappkitResponse.rawTxs[0];

// Send the signed transaction via the kit
const tx = kit.connection.sendSignedTransaction(rawTx);

const receipt = await tx.waitReceipt();

const [cUSDBalanceBig, cUSDDecimals] = await Promise.all([
  stableToken.balanceOf(this.state.address),
  stableToken.decimals()
]);
const cUSDBalance = this.convertToContractDecimals(
  cUSDBalanceBig,
  cUSDDecimals
);

this.setState({ cUSDBalance, isLoadingBalance: false });
```

## ContractKit example

Let's make a common use example. What about exchanging some cUSD to CELO, and
then Locking that CELO to be able to vote for a validator group?
Let's do that

([expo base template commit](https://github.com/celo-org/dappkit-base/commit/cf35c82d7650e7b6bc7208ece32440d3a32d9cc5))

```javascript
import {
  requestTxSig,
  waitForSignedTxs
} from "@celo/dappkit";

// Let's assume that the address has enough cUSD to pay the
// transaction fees of all the transactions and enough to buy 10 CELO
// AND it's already a registered Account (otherwise it will require a call
// to the `createAccount` method from the Accounts contract)

// We will be using the following contracts:
const stableToken = await kit.contracts.getStableToken();
const exchange = await kit.contracts.getExchange();
const lockedGold = await kit.contracts.getLockedGold();
const election = await kit.contracts.getElection()

const decimals = await stableToken.decimals(); // both cusd and celo use the same

const tenCelo = new BigNumber(10).pow(parseInt(decimals, 10)).toString();
const oneHundredCUSD = new BigNumber(10).pow(parseInt(decimals, 10)).toString();
// Now we will generate the transactions that we require to be signed

// First of all, we need to increase the allowance of the exchange address
// to let the contract expend the amount of stable tokens to buy some CELO.
// We are allowing the exchange contract to spend 100 cUsd
const txObjectIncAllow = stableToken.increaseAllowance(
  exchange.address,
  oneHundredCUSD
).txo;

// Then we will call the Exchange contract, and attempt to buy 10 CELO with a 
// max price of 100 cUSD (it could use less than that).
const txObjectExchange = exchange.buy(
  tenCelo,
  oneHundredCUSD,
  true
).txo;

// Then we will call the lockedGold contract to lock our CELO
// (Remember that the address should be a registered Account)
// Later, the amount to be locked will be the parameter `value`.
const txObjectLock = lockedGold.lock().txo;

// Then we use the 10 CELO to vote for a specific validator group address.
const validatorGroupAddress = "VALIDATOR_GROUP_ADDRESS";
const txObjectVote = await election.vote(
  validatorGroupAddress, 
  tenCelo
).txo;

const dappName = "My DappName";
const callback = Linking.makeUrl("/my/path");

const requestId = "signMeEverything";

// Request the TX signature from DAppKit
requestTxSig(
  kit,
  [
    {
      tx: txObjectIncAllow,
      from: this.state.address,
      to: stableToken.contract.options.address,
      feeCurrency: FeeCurrency.cUSD
    }
  ],
  [
    {
      tx: txObjectExchange,
      from: this.state.address,
      to: exchange.contract.options.address,
      feeCurrency: FeeCurrency.cUSD
    }
  ],
  [
    {
      tx: txObjectLock,
      from: this.state.address,
      to: lockedGold.contract.options.address,
      feeCurrency: FeeCurrency.cUSD,
      value: tenCelo
    }
  ],
  [
    {
      tx: txObjectVote,
      from: this.state.address,
      to: election.contract.options.address,
      feeCurrency: FeeCurrency.cUSD
    }
  ],
  { requestIdIA, dappName, callback }
);

const dappkitResponse = await waitForSignedTxs(requestIdIA);

// execute the allowance
const tx0 = kit.connection.sendSignedTransaction(dappkitResponse.rawTxs[0]);
const receipt = await tx0.waitReceipt();

// execute the exchange
const tx1 = kit.connection.sendSignedTransaction(dappkitResponse.rawTxs[1]);
const receipt = await tx1.waitReceipt();

// execute the lock
const tx2 = kit.connection.sendSignedTransaction(dappkitResponse.rawTxs[2]);
const receipt = await tx2.waitReceipt();

// execute the vote
const tx3 = kit.connection.sendSignedTransaction(dappkitResponse.rawTxs[3]);
const receipt = await tx3.waitReceipt();

const voteInfo = await election.getVoter(this.state.address);

// REMEMBER that after voting the next epoch you HAVE TO ACTIVATE those votes
// using the `activate` method in the election contract.

this.setState({ voteInfo, isVoting: false });
```
