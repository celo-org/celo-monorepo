import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
// import { PhoneNumberUtils } from '@celo/utils'
import { newKitFromWeb3 } from '../kit'
import { FederatedAttestationsWrapper } from './FederatedAttestations'

testWithGanache('FederatedAttestations Wrapper', (web3) => {
  // const PHONE_NUMBER = '+15555555555'
  // const IDENTIFIER = PhoneNumberUtils.getPhoneHash(PHONE_NUMBER)

  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let federatedAttestations: FederatedAttestationsWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
  })

  describe('TODO ASv2 DO NOT MERGE', () => {
    it('TODO ASv2 DO NOT MERGE', async () => {
      expect(accounts)
      federatedAttestations = await kit.contracts.getFederatedAttestations()
      expect(federatedAttestations)
    })
  })
})
