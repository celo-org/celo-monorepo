import { verificationPossibleSelector } from 'src/app/selectors'
import { getMockStoreData } from 'test/utils'
import { mockE164Number, mockE164NumberPepper } from 'test/values'

describe(verificationPossibleSelector, () => {
  it('returns true', () => {
    // cached salt
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balance: '0.00' },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
        })
      )
    ).toBe(true)

    // balance is sufficient
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balance: '0.1' },
          identity: { e164NumberToSalt: {} },
        })
      )
    ).toBe(true)
  })
  it('returns false', () => {
    // balance is not sufficient
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balance: '0.09' },
          identity: { e164NumberToSalt: {} },
        })
      )
    ).toBe(false)
  })
})
