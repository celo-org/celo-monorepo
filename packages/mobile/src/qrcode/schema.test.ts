import { zeroAddress } from 'ethereumjs-util'
import { uriDataFromJson } from 'src/qrcode/schema'

const validAddressData = { address: zeroAddress() }
const validUserData = {
  ...validAddressData,
  displayName: 'alice',
  e164PhoneNumber: '+14155552671',
}
const validLocalPaymentData = {
  ...validAddressData,
  currencyCode: 'PHP',
  amount: '521.46',
}
const validBeamAndGoPaymentData = {
  address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
  displayName: 'Super 8',
  currencyCode: 'PHP',
  amount: '500',
  comment: '92a53156-c0f2-11ea-b3de-0242ac13000',
}

describe('#qrDataFromJson', () => {
  const validParse = (...objects: object[]) =>
    objects.forEach((obj) => uriDataFromJson(JSON.parse(JSON.stringify(obj))))

  it('should parse valid address', () =>
    validParse(validAddressData, validUserData, validLocalPaymentData))

  it('should parse valid user data', () => validParse(validUserData))

  it('should parse valid local payment data', () => validParse(validLocalPaymentData))

  it('should parse valid BeamAndGo payment data', () => validParse(validBeamAndGoPaymentData))

  const invalidParse = (...pairs: Array<{ obj: object; s: string }>) =>
    pairs.forEach((pair) => {
      try {
        uriDataFromJson(JSON.parse(JSON.stringify(pair.obj)))
      } catch (e) {
        expect(e).toEqual(new Error(pair.s))
      }
    })

  it('should parse with error on invalid address', () =>
    invalidParse({
      obj: { address: zeroAddress().slice(0, -1) },
      s: 'is not a valid address',
    }))
})
