// import { newKit } from '.'
// import { CeloContract, NULL_ADDRESS } from './base'

// async function main() {
//   const kit = newKit('http://localhost:8545')

//   // const accounts = await kit.web3.eth.getAccounts()
//   const firstOracle = '0x5409ED021D9299bf6814279A6A1411A7e866A631'
//   kit.defaultAccount = '0xE834EC434DABA538cd1b9Fe1582052B880BD7e63'

//   const sortedOracles = await kit.contracts.getSortedOracles()
//   const stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
//   const rates = await sortedOracles.getRates(stableTokenAddress)
//   console.log(rates)
//   const tx = await sortedOracles.report(stableTokenAddress, 25, 1, firstOracle, NULL_ADDRESS).send()
//   await tx.waitReceipt()

//   console.log(await sortedOracles.getRates(stableTokenAddress))
//   console.log(`number of rates?? ${await sortedOracles.numRates(stableTokenAddress)}`)
// }

// main().catch((err) => {
//   console.log(err)
//   process.exit(1)
// })
