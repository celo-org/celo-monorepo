# Celo DAppKit

DAppKit is a lightweight set of functions that allow mobile DApps to work with the Celo Wallet to sign transactions and access the user's account. This allows for a better user experience: DApps can focus on a great native experience without having to worry about key management. It also provides a simpler development experience, as no state or connection management is necessary.

DAppKit supports the following functionality:

- Request permission to access account information and phone number from the Celo Wallet
- Request permission to sign transaction(s) from the Celo Waller
- Look up phone numbers using the [Identity Protocol](https://docs.celo.org/celo-codebase/protocol/identity) to find contacts using Celo.

DAppKit is currently built with the excellent [Expo framework](https://expo.io) in mind. In the near future, we will make it more generic to all of React Native and possibly native stacks, but for now you get to take advantage of some awesome features like an incredibly easy setup, hot-reloading, and more.

# Usage

This section walks you through the main functionalities of DAppKit. You can also find the result of this walkthrough on the [expo base template](https://github.com/celo-org/dappkit-base) on branch [`dappkit-usage`](https://github.com/celo-org/dappkit-base/tree/dappkit-usage).

DAppKit uses deeplinks to communicate between your DApp and the Celo Wallt. All "requests" that your DApp makes to the Wallet needs to contain the follwing meta payload:

- `requestId` A string you can pass to DAppKit, that you can use to listen to the resopnse for that request
- `dappName` A string that will be displayed to the user, indicating the DApp requesting access/signature.
- `callback` The deeplink that the Celo Wallet will use to redirect the user back to the DApp with the appropriate payload. If you want the user to be directed to a particular page in your DApp. With Expo, it's as simple as `Linking.makeUrl('/my/path')`

## Requesting Account Address

One of the first actions you will want to do as a DApp Developer is to get the address of your user's account, to display relevant informtion to them. It can be done as simply as:

([expo base template commit](https://github.com/celo-org/dappkit-base/commit/9ef5d8916018a1f7b09d062fdd601b851fb4bf79))

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
  kit.web3,
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
kit.web3.eth.sendSignedTransaction(tx).on("confirmation", async () => {
  const [cUSDBalanceBig, cUSDDecimals] = await Promise.all([
    stableToken.balanceOf(this.state.address),
    stableToken.decimals()
  ]);
  const cUSDBalance = this.convertToContractDecimals(
    cUSDBalanceBig,
    cUSDDecimals
  );

  this.setState({ cUSDBalance, isLoadingBalance: false });
})
```
