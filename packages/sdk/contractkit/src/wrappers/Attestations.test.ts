import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { PhoneNumberUtils } from '@celo/phone-utils'
import { newKitFromWeb3 } from '../kit'
import { AttestationsWrapper, getSecurityCodePrefix } from './Attestations'

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

describe(getSecurityCodePrefix, () => {
  it('should compute correct hash', () => {
    expect(getSecurityCodePrefix('0x000000000000000000000008')).toEqual('8')
    // 0xf7f551752A78Ce650385B58364225e5ec18D96cB -> 1415591498931780605110544902041322891412830525131
    expect(getSecurityCodePrefix('0xf7f551752A78Ce650385B58364225e5ec18D96cB')).toEqual('1')
  })
})
