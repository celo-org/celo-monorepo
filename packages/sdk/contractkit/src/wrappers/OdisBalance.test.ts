import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { OdisBalanceWrapper } from './OdisBalance'

testWithGanache('OdisBalance Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let odisBalance: OdisBalanceWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
  })

  describe('TODO OdisBalance', () => {
    it('TODO OdisBalance', async () => {
      expect(accounts)
      odisBalance = await kit.contracts.getOdisBalance()
      expect(odisBalance)
    })
  })
})
