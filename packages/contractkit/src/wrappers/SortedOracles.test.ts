import { CeloContract } from '../base'
import { newKitFromWeb3 } from '../kit'
import { testWithGanache } from '../test-utils/ganache-test'
import { SortedOraclesWrapper } from './SortedOracles'

/*
TEST NOTES:
- In migrations: The only account that has cUSD is accounts[0]
*/

testWithGanache('SortedOracles Wrapper', (web3) => {
  // const ONE_USD = web3.utils.toWei('1', 'ether')

  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let sortedOracles: SortedOraclesWrapper
  let stableTokenAddress: string

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    console.log(accounts)
    kit.defaultAccount = accounts[0]
    sortedOracles = await kit.contracts.getSortedOracles()
    stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
  })

  it('SBAT getRates', async () => {
    const rates = await sortedOracles.getRates(stableTokenAddress)
    console.log(rates)
  })

  it('SBAT reportRate', async () => {})
})
