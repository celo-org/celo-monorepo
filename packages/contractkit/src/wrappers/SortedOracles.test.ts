import { CeloContract, NULL_ADDRESS } from '../base'
import { newKitFromWeb3 } from '../kit'
import { testWithGanache } from '../test-utils/ganache-test'
import { SortedOraclesWrapper } from './SortedOracles'

/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/

testWithGanache('SortedOracles Wrapper', (web3) => {
  // const ONE_USD = web3.utils.toWei('1', 'ether')
  // const oracleAddress = '0xE834EC434DABA538cd1b9Fe1582052B880BD7e63'
  const oracleAddress = '0x5409ED021D9299bf6814279A6A1411A7e866A631'
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let sortedOracles: SortedOraclesWrapper
  let stableTokenAddress: string

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    console.log(accounts)
    kit.defaultAccount = oracleAddress
    sortedOracles = await kit.contracts.getSortedOracles()
    stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
  })

  it('SBAT getRates', async () => {
    const rates = await sortedOracles.getRates(stableTokenAddress)
    console.log(rates)
  })

  it('SBAT reportRate', async () => {
    const rates = await sortedOracles.getRates(stableTokenAddress)
    console.log(rates)
    await sortedOracles
      .report(stableTokenAddress, 16, 1, oracleAddress, NULL_ADDRESS)
      .sendAndWaitForReceipt()
    const rates2 = await sortedOracles.getRates(stableTokenAddress)
    console.log(rates2)
  })
})
