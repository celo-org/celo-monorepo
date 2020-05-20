# Usage

This page walks you through the main functionalities of DAppKit. You can also find the result of this walkthrough on the [expo base template](https://github.com/celo-org/dappkit-base) on branch [`dappkit-usage`](https://github.com/celo-org/dappkit-base/tree/dappkit-usage).

DAppKit uses deeplinks to communicate between your DApp and the Celo Wallet. All "requests" that your DApp makes to the Wallet needs to contain the following meta payload:

- `requestId` A string you can pass to DAppKit, that you can use to listen to the response for that request
- `dappName` A string that will be displayed to the user, indicating the DApp requesting access/signature.
- `callback` The deeplink that the Celo Wallet will use to redirect the user back to the DApp with the appropriate payload. If you want the user to be directed to a particular page in your DApp. With Expo, it's as simple as `Linking.makeUrl('/my/path')`

## Requesting Account Address

One of the first actions you will want to do as a DApp Developer is to get the address of your user's account, to display relevant informtion to them. It can be done as simply as:

([expo base template commit](https://github.com/celo-org/dappkit-base/commit/7d04983f0875eac7a1e44963a97b5ecd81a0d1d0))

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

([expo base template commit](https://github.com/celo-org/dappkit-base/commit/3be9f5c506788bcc1c22c4e8e02fac62c0821ee9))

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

([expo base template commit](https://github.com/celo-org/dappkit-base/commit/e3a1c00f2b8a6f6f6891c515a131ff66b55cb563))

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
})
```
