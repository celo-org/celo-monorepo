# Usage

This page walks you through the main functionalities of DAppKit and provides small code snippets. We recommend checking out the [Celo Truffle Box](https://github.com/critesjosh/celo-dappkit) tutorial for a step-by-step guide on creating a mobile DApp using Expo.

## Overview

DAppKit uses [deeplinks](https://en.wikipedia.org/wiki/Mobile_deep_linking) to communicate between your DApp and the [Celo Developer Wallet](https://celo.org/developers/wallet) \(for testing\) and [Valora](https://valoraapp.com/) \(for production\).

{% hint style="info" %}
Note: DappKit uses the same deeplink for both the testing and production wallets. This means that when testing on iOS devices, the deeplinks will open the testing wallet vs the product wallet if both are installed on the same device. On Android devices, when multiple wallets are installed users are able to select which wallet they would like to use to open the deeplink. We are currently working to make separate deeplinks. Given the low transaction fees, many developers have chosen to only develop on mainnet to get around this.
{% endhint %}

All 'requests' that your DApp makes to the Wallet needs to contain the following meta payload:

* `requestId` A string you can pass to DAppKit, that you can use to listen to the response for that request.
* `dappName` A string that will be displayed to the user, indicating the DApp requesting access/signature.
* `callback` The deeplink that the Celo Wallet will use to redirect the user back to the DApp with the appropriate payload. If using Expo, it's as simple as `Linking.makeUrl('/my/path')`.

## Requesting Account Address

One of the first actions you will want to do as a DApp Developer is to get the address of your user's account, to display relevant information to them. It can be done as simply as:

```javascript
import { requestAccountAddress, waitForAccountAuth } from '@celo/dappkit';
import { Linking } from 'expo';

login = async () => {
  const requestId = 'login';
  const dappName = 'My DappName';
  const callback = Linking.makeUrl('/my/path');

  requestAccountAddress({
    requestId,
    dappName,
    callback,
  });

  const dappkitResponse = await waitForAccountAuth(requestId);

  // The pepper is not available in all Valora versions
  this.setState({ address: dappkitResponse.address, phoneNumber: dappkitResponse.phoneNumber, pepper: dappkitResponse.pepper });
}
```

Once you have the account address, you can make calls against your own smart contract, or use [ContractKit](../contractkit/) to interact with Celo Core Contracts to do actions like fetch a user's balance.

First import and instantiate an instance of ContractKit. For ContractKit version 1.0.0 onwards, you also need to import and instantiate a Web3 instance manually:

```javascript
// Add ContractKit to your file and instantiate the kit.
// note: for versions prior to 1.x.x, please check the legacy docs.
import { newKitFromWeb3 } from '@celo/contractkit';
import Web3 from 'web3';

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
// mainnet -- comment out the above, uncomment below for mainnet
// const web3 = new Web3('https://forno.celo.org');

const kit = newKitFromWeb3(web3);
```

Then add the following to your `login` method to fetch a user's balance:

```javascript
// Note that `address` and `phoneNumber` are already stored in state from the first login snippet
this.setState({isLoadingBalance: true });
// Set the default account to the account returned from the wallet
kit.defaultAccount = this.state.address;
// Get the StableToken contract
const stableToken = await kit.contracts.getStableToken();
// Get the user account balance (cUSD)
const cUSDBalanceBig = await stableToken.balanceOf(kit.defaultAccount);

// Convert from a big number to a string
let cUSDBalance = cUSDBalanceBig.toString();
this.setState({ cUSDBalance, isLoadingBalance: false });
```

## Checking attestations for the phone number

If the user is using a Valora version that passes the `pepper` that Valora has for a `phone_number`, you can use both pieces of information to determine attestations for the identifier \(learn more about the [lightweight identity protocol here](../../celo-codebase/protocol/identity/)\):

```javascript
import { PhoneNumberUtils } from '@celo/utils'
const attestations = await kit.contracts.getAttestations();

const identifier = PhoneNumberUtils.getPhoneHash(dappkitResponse.phoneNumber, dappkitResponse.pepper);

// Find all accounts that have received attestations for this phone number
const accounts = attestations.lookupAccountsForIdentifier(identifier);

// Get the attestations stats for the accounts
for (const account of accounts) {
  const stat = await attestations.getAttestationStat(identifier, account);
  console.log(`Total: ${stat.total}, Completed: ${stat.completed}`);
}
```

## Signing Transactions

Let's go from accessing account information to submitting transactions. To alter state on the blockchain, you need to make a transaction object with your smart contract or any of the Celo Core Contracts in ContractKit. All that is left to do is to pass the transaction object to DAppKit.

```javascript
import { toTxResult } from '@celo/connect';
import {
  requestTxSig,
  waitForSignedTxs
} from '@celo/dappkit';

// Create the transaction object
const stableToken = await kit.contracts.getStableToken();
const decimals = await stableToken.decimals();
// This can be a specific account address, a contract address, etc.
const transferTo = '<TRANSFER_TO_ACCOUNT>'
const transferValue = new BigNumber('10e18');
const txObject = stableToken.transfer(
  transferTo,
  transferValue.toString()
).txo;

const requestId = 'transfer';
const dappName = 'My DappName';
const callback = Linking.makeUrl('/my/path');

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
const tx = await kit.connection.sendSignedTransaction(rawTx);
const receipt = await tx.waitReceipt();

const cUSDBalanceBig = await stableToken.balanceOf(kit.defaultAccount);
this.setState({ cUSDBalance: cUSDBalanceBig.toString(), isLoadingBalance: false });
```

## Example: Exchanging cUSD and Locking CELO

Here's an example of how to go about exchanging some cUSD to CELO, and then Locking that CELO to be able to vote for a validator group.

```javascript
import {
  requestTxSig,
  waitForSignedTxs
} from '@celo/dappkit';

import { BigNumber } from 'bignumber.js';

const dappName = 'My DappName';
const callback = Linking.makeUrl('/my/path');

// Let's assume that the address has funds enough in cUSD to pay the
// transaction fees of all the transactions and enough to buy 1 CELO
// In this example, we also assume that we have already requested
// the user's account address, and it is stored in `this.state.address`.

// We will be using the following contracts:
const stableToken = await kit.contracts.getStableToken();
const exchange = await kit.contracts.getExchange();
const lockedGold = await kit.contracts.getLockedGold();
const election = await kit.contracts.getElection();
const accounts = await kit.contracts.getAccounts();

// Let's ensure that the account is registered. If not, we need to call
// the `createAccount` method from the Accounts contract)

const txIsAccount = await accounts.isAccount(this.state.address);
const txRegisterAccountObj = accounts.createAccount().txo;

if (!txIsAccount) {
  requestTxSig(
    // @ts-ignore
    kit,
    [
      {
        tx: txRegisterAccountObj,
        from: this.state.address,
        to: accounts.address,
        feeCurrency: FeeCurrency.cUSD
      }
    ],
    { requestId, dappName, callback }
  );
  const respRegisterAccount = await waitForSignedTxs(requestId);
  const txRegisterAccount = await kit.connection.sendSignedTransaction(respRegisterAccount.rawTxs[0]);
  const receiptRegisterAccount = await txRegisterAccount.waitReceipt();
  console.log(`Tx hash: ${receiptRegisterAccount.transactionHash}`);
  // Handle account registration
}

// 1e18 = 1 Celo
const oneCelo = new BigNumber('1e18');
const tenCUSD = new BigNumber('10e18');
// Now we will generate the transactions that we require to be signed

// First of all, we need to increase the allowance of the exchange address
// to let the contract expend the amount of stable tokens to buy one CELO.
// We are allowing the exchange contract to spend 10 cUSD
const txObjectIncAllow = stableToken.increaseAllowance(
  exchange.address,
  tenCUSD
).txo;

// Then we will call the Exchange contract, and attempt to buy 1 CELO with a 
// max price of 10 cUSD (it could use less than that).
const txObjectExchange = exchange.buy(
  oneCelo,
  tenCUSD,
  true
).txo;

// Then we will call the lockedGold contract to lock our CELO
// (Remember that the address should be a registered Account)
// Later, the amount to be locked will be the parameter `value`.
const txObjectLock = lockedGold.lock().txo;

// Then we use the 1 CELO to vote for a specific validator group address.
// Here you have to change the validator group address
// (At the moment of writing the tuto, the 0x5edfCe0bad47e24E30625c275457F5b4Bb619241
// was a valid address, but you could check the groups using the celocli)
const validatorGroupAddress = '<VALIDATOR_GROUP_ADDRESS>';
const txObjectVote = (await election.vote(
  validatorGroupAddress, 
  oneCelo
)).txo;

const requestId = 'signMeEverything';

// Request the TX signature from DAppKit
requestTxSig(
  kit,
  [
    {
      tx: txObjectIncAllow,
      from: this.state.address,
      to: stableToken.address,
      feeCurrency: FeeCurrency.cUSD
    },
    {
      tx: txObjectExchange,
      from: this.state.address,
      to: exchange.address,
      feeCurrency: FeeCurrency.cUSD,
      estimatedGas: 200000
    },
    {
      tx: txObjectLock,
      from: this.state.address,
      to: lockedGold.address,
      feeCurrency: FeeCurrency.cUSD,
      value: oneCelo
    },
    {
      tx: txObjectVote,
      from: this.state.address,
      to: election.address,
      feeCurrency: FeeCurrency.cUSD,
      estimatedGas: 200000
    }
  ],
  { requestId, dappName, callback }
);

const dappkitResponse = await waitForSignedTxs(requestId);

const receipts = [];
// execute the allowance
console.log('execute the allowance');
const tx0 = await kit.connection.sendSignedTransaction(dappkitResponse.rawTxs[0]);
receipts.push(await tx0.waitReceipt());

// execute the exchange
console.log('execute the exchange');
const tx1 = await kit.connection.sendSignedTransaction(dappkitResponse.rawTxs[1]);
receipts.push(await tx1.waitReceipt());

// execute the lock
console.log('execute the lock');
const tx2 = await kit.connection.sendSignedTransaction(dappkitResponse.rawTxs[2]);
receipts.push(await tx2.waitReceipt());

// execute the vote
console.log('execute the vote');
const tx3 = await kit.connection.sendSignedTransaction(dappkitResponse.rawTxs[3]);
receipts.push(await tx3.waitReceipt());
console.log('Receipts: ', receipts);

const voteInfo = await election.getVoter(this.state.address);
console.log('Vote info: ', voteInfo);
// REMEMBER that after voting the next epoch you HAVE TO ACTIVATE those votes
// using the `activate` method in the election contract.

this.setState({ voteInfo, isVoting: false });
```

## DAppKit vs. DAppKit-web

Originally, DAppKit was designed for mobile apps in mind and did not work out-of-the-box for web DApps running in the browser of a mobile device. DAppKit-web includes workarounds for some of the typical issues that arose for folks using DAppKit to integrate their web DApps with Valora.

DAppKit uses React Native's `Linking` library to listen for URL changes \(i.e. on return to the DApp from Valora\) so it can receive and parse the requested information; this causes redirection to new tabs on web browsers, however, which means that the information requested via DAppkit does not make it back to the original session. To get around this, DAppkit-web uses the web browser's `localStorage` to store this returned URL, which can then be accessed by the old tab.

DAppKit-web includes the main functionality from DAppKit, so all that is required is to import from `@celo/dappkit/lib/web` instead of from `@celo/dappkit`. The usage of DAppkit-web is the same as above, but calling the functions `waitForAccountAuth` and `waitForSignedTxs` should be surrounded with a `try...catch`, since these functions can throw a timeout error.

This should look something like the following:

```javascript
try {
  const dappkitResponse = await waitForAccountAuth(requestId)
  // Handle successful login
} catch (error) {
  // Catch and handle possible timeout errors
}

...

let tx;
try {
  const dappkitResponse = await waitForSignedTxs(requestId)
  tx = dappkitResponse.rawTxs[0]
} catch (error) {
  // Catch and handle possible timeout errors
  return
}
// Send transaction via ContractKit or web3 directly
```

An example dummy web DApp can be found [here](https://github.com/celo-org/dappkit-web-starter). This is a very simple one-page app that demonstrates the flow above: requesting the user's account address in the Celo Wallet, creating a transaction object, allowing the user to sign this transaction in the Celo Wallet, and then submitting the transaction to the chain via ContractKit. It is a simplified, web-specific version based off of the [Celo Truffle Box](https://github.com/critesjosh/celo-dappkit) tutorial, which should be completed prior to using the dummy web DApp.

### Known Issues

DAppKit's web functionality should be regarded as a beta solution and the following are known issues:

* Safari on iOS: if the web DApp is open in a tab that is not the most recently opened tab \(bottom tab when viewing all open tabs\), the user will return to the following tab after completing authentication or signing the transaction in Valora. The information is properly populated in the original web DApp's tab.
* Chrome on iOS: on returning to the web DApp from Valora, a second tab is opened which must be manually closed. The information is properly populated in the original web DApp's tab.

