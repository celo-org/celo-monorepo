import { newKit } from '.'
import { CeloContract, NULL_ADDRESS } from './base'

async function main() {
  const kit = newKit('http://localhost:8545')

  console.log(await kit.web3.eth.getAccounts())
  // const validators = await kit.contracts.getValidators()

  // console.log(await validators.getValidatorGroupsVotes())

  // const tx = await validators.vote('0x....')
  // const receipt = tx.sendAndWaitForReceipt({
  //   from: '0x',
  // })
  // console.log(receipt)

  const sortedOracles = await kit.contracts.getSortedOracles()
  const stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
  console.log(await sortedOracles.getRates(stableTokenAddress))
  await sortedOracles.report(stableTokenAddress, 25, 1, NULL_ADDRESS, NULL_ADDRESS)

  kit.defaultAccount = '0xE834EC434DABA538cd1b9Fe1582052B880BD7e63'
  await sortedOracles.report(stableTokenAddress, 12, 1, NULL_ADDRESS, NULL_ADDRESS)

  console.log(await sortedOracles.getRates(stableTokenAddress))
  console.log(`number of rates?? ${await sortedOracles.numRates(stableTokenAddress)}`)
  console.log('what the fuck is the goddamn median')
  console.log(await sortedOracles.medianRate(stableTokenAddress))
}

main().catch((err) => {
  console.log(err)
  process.exit(1)
})
