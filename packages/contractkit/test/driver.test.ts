import { Address } from '../src/base'
import { newKit } from '../src/kit'

test('Test driver', async () => {
  // Integration
  // const kit = newKit('http://35.247.98.50:8545')
  const kit = newKit('http://35.247.74.27:8545')

  // kit.web3
  const account: Address = '0xCEa3eF8e187490A9d85A1849D98412E5D27D1Bb3'
  // const account2: Address = '0xCEa3eF5e187490A9d85A1849D98412E5D27D1Bb3'

  // To interact with contract we obtain them from kit
  const goldToken = await kit.contracts.getGoldToken()

  const balance = await goldToken.balanceOf(account)
  console.log(`balance:`, balance)

  // // internally kit does:
  // // 1. obtain the address from registry
  // const stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
  // // 2. cache them in `kit.contracts`

  // // to send transactions:

  // // we can define default options
  // kit.defaultAccount = account
  // kit.defaultOptions.gasInflationFactor = 1.3
  // await kit.setGasCurrency(CeloContract.StableToken)

  // const txResult = await kit.sendTransactionObject(
  //   goldToken.methods.transfer(account2, 1000),
  //   // overrides
  //   {
  //     gasInflationFactor: 2,
  //   }
  // )

  // console.log(await txResult.getHash())
  // console.log(await txResult.waitReceipt())
  // console.log(await txResult.waitConfirmation())

  // // For Raw transactions

  // // native gold transfer
  // const txResult2 = await kit.sendTransaction({
  //   to: account2,
  //   value: 10000,
  // })

  // // same as before

  // // Basic Contract are not sufficient all the time, for that we have wrappers

  // // For example Validators.vote()

  // const validators = await kit.contracts.getValidators()
  // kit.sendTransactionObject(await validators.vote('group'))
})
