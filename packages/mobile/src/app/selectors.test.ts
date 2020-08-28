import { verificationPossibleSelector } from 'src/app/selectors'
import { getMockStoreData } from 'test/utils'
import { mockE164Number, mockE164NumberPepper } from 'test/values'

describe(verificationPossibleSelector, () => {
  it('returns true when the number pepper is already cached', () => {
    // cached salt
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balance: '0' },
          goldToken: { balance: '0' },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
        })
      )
    ).toBe(true)
  })
  it('returns true when balance is sufficient', () => {
    // balance is sufficient
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balance: '0.01' },
          goldToken: { balance: '0' },
          identity: { e164NumberToSalt: {} },
        })
      )
    ).toBe(true)
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balance: '0' },
          goldToken: { balance: '0.005' },
          identity: { e164NumberToSalt: {} },
        })
      )
    ).toBe(true)
  })
  it('returns true when balance is not sufficient', () => {
    // balance is not sufficient
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balance: '0.009' },
          goldToken: { balance: '0.004' },
          identity: { e164NumberToSalt: {} },
        })
      )
    ).toBe(false)
  })
})
