import { Address } from '@celo/base/lib/address'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
import { StableTokenRegistryWrapper } from './StableTokenRegistry'

testWithGanache('StableTokenRegistry Wrapper', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: Address[] = []
  let stableTokenRegistry: StableTokenRegistryWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    stableTokenRegistry = await kit.contracts.getStableTokenRegistry()
  })

  describe('Verifying that it always has correct values', () => {
    it('has the correct list of fiatTicker', () => {
      expect(stableTokenRegistry.FiatTickers()).toEqual(['USD', 'EUR', 'BRL'])
    })
    it('has the correct list of stable token contracts', () => {
      expect(stableTokenRegistry.getContractInstances()).toEqual([
        'StableToken',
        'StableTokenEUR',
        'StableTokenBRL',
      ])
    })
    it('can query stable token contract names', () => {
      expect(stableTokenRegistry.queryStableTokenContractNames('USD')).toEqual('StableToken')
    })
  })
})
