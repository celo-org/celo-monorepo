# Choosing the Right Gas Price

Because the gas price suggested on MetaMask will be based on the Ethereum blockchain, the correct gas price for the Celo blockchain will need to be calculated. This can either be done by the user manually, or calculated in the dApp using an RPC call. See below for more details.

### **Manually**

In the MetaMask wallet, in the transaction screen, click "Advanced Options". There, gas prices can be modified manually. However, we highly recommend dApp developers handle this for their users, using the method outlined below, because there isn't currently an easy way to calculate current gas prices, other than checking against a block explorer.

### **RPC Call**

The Celo node includes an RPC method to suggest gas price.

Here is a JavaScript snippet you can use, which should work with both the web3 and ethers libraries:

```jsx
  await window.ethereum.request({
      method: "eth_gasPrice", 
      params: []
  })
```
