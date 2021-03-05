# Usage

This page walks you through the main functionalities of DAppKit and provides small code snippets. We recommend checkout out the [Celo Truffle Box](https://github.com/critesjosh/celo-dappkit) tutorial for a step-by-step guide on creating a mobile DApp using Expo.

## Overview

DAppKit uses deeplinks to communicate between your DApp and the Celo Wallet. All "requests" that your DApp makes to the Wallet needs to contain the following meta payload:

- `requestId` A string you can pass to DAppKit, that you can use to listen to the response for that request.
- `dappName` A string that will be displayed to the user, indicating the DApp requesting access/signature.
- `callback` The deeplink that the Celo Wallet will use to redirect the user back to the DApp with the appropriate payload. If using Expo, it's as simple as `Linking.makeUrl('/my/path')`.

## Requesting Account Address

One of the first actions you will want to do as a DApp Developer is to get the address of your user's account, to display relevant information to them. It can be done as simply as:

```javascript
import { requestAccountAddress, waitForAccountAuth } from '@celo/dappkit'
import { Linking } from 'expo'

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

Once you have the account address, you can make calls against your own smart contract, or use [ContractKit](../contractkit/README.md) to fetch a users balance

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

Let's go from accessing account information to submitting transactions. To alter state on the blockchain, you need to make a transaction object with your smart contract or any of the Celo Core Contracts in ContractKit. All that is left to do is to pass the transaction object to DAppKit.

```javascript
import { toTxResult } from '@celo/connect'
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
const tx = dappkitResponse.rawTxs[0];

// Send the signed transaction via web3
await toTxResult(kit.web3.eth.sendSignedTransaction(tx)).waitReceipt()

const [cUSDBalanceBig, cUSDDecimals] = await Promise.all([
  stableToken.balanceOf(this.state.address),
  stableToken.decimals()
]);
const cUSDBalance = this.convertToContractDecimals(
  cUSDBalanceBig,
  cUSDDecimals
);

this.setState({ cUSDBalance, isLoadingBalance: false })
```

## DAppKit vs. DAppKit-web

Originally, DAppKit was designed for mobile apps in mind and did not work out-of-the-box for web DApps running in the browser of a mobile device. DAppKit-web includes workarounds for some of the typical issues that arose for folks using DAppKit to integrate their web DApps with Valora.

DAppkit uses React's `Linking` library to listen for URL changes (i.e. on return to the DApp from Valora) and then receive and parse the requested information; this causes redirection to new tabs on web browsers, however, which means that the information requested via DAppkit does not make it back to the session. To get around this, DAppkit-web uses the web browser's `localStorage` to store this returned URL, which can then be accessed by the new tabs.

DAppKit-web includes the main functionality from DAppKit, so all that is required is to import from `@celo/dappkit/lib/web` instead of from `@celo/dappkit`. The usage of DAppkit-web is the same as above, but calling the functions `waitForAccountAuth` and `waitForSignedTxs` should be surrounded with a `try...catch`, since these functions can return a timeout error.

This should look something like the following:

```js
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

- Safari on iOS: if the web DApp is open in a tab that is not the most recently opened tab (bottom tab when viewing all open tabs), the user will return to the following tab after completing authentication or signing the transaction in Valora. The information is properly populated in the original web DApp's tab.
- Chrome on iOS: on returning to the web DApp from Valora, a second tab is opened which must be manually closed. The information is properly populated in the original web DApp's tab.
