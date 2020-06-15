import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { PhoneNumberUtils } from '@celo/utils'
import { newKitFromWeb3 } from '../kit'
import { AttestationsWrapper } from './Attestations'

testWithGanache('Attestations Wrapper', (web3) => {
  const PHONE_NUMBER = '+15555555555'
  const IDENTIFIER = PhoneNumberUtils.getPhoneHash(PHONE_NUMBER)

  const kit = newKitFromWeb3(web3)
  let accounts: string[] = []
  let attestations: AttestationsWrapper

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    attestations = await kit.contracts.getAttestations()
  })

  describe('Verification with default values', () => {
    it('No completions returns false', async () => {
      jest
        .spyOn<any, any>(attestations, 'getAttestationStat')
        .mockReturnValue({ completed: 0, total: 3 })

      const result = await attestations.getVerifiedStatus(IDENTIFIER, accounts[0])
      expect(result.isVerified).toBeFalsy()
      expect(result.numAttestationsRemaining).toBe(3)
    })
    it('Not enough completions returns false', async () => {
      jest
        .spyOn<any, any>(attestations, 'getAttestationStat')
        .mockReturnValue({ completed: 2, total: 6 })

      const result = await attestations.getVerifiedStatus(IDENTIFIER, accounts[0])
      expect(result.isVerified).toBeFalsy()
      expect(result.numAttestationsRemaining).toBe(1)
    })
    it('Fraction too low returns false', async () => {
      jest
        .spyOn<any, any>(attestations, 'getAttestationStat')
        .mockReturnValue({ completed: 3, total: 30 })

      const result = await attestations.getVerifiedStatus(IDENTIFIER, accounts[0])
      expect(result.isVerified).toBeFalsy()
    })
    it('Fraction pass threshold returns true', async () => {
      jest
        .spyOn<any, any>(attestations, 'getAttestationStat')
        .mockReturnValue({ completed: 3, total: 9 })

      const result = await attestations.getVerifiedStatus(IDENTIFIER, accounts[0])
      expect(result.isVerified).toBeTruthy()
    })
  })
})
