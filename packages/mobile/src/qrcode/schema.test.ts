import { zeroAddress } from 'ethereumjs-util'
import { isRight } from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { qrDataFromJson } from 'src/qrcode/schema'

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
    objects.forEach((obj) => {
      const parsed = qrDataFromJson(JSON.parse(JSON.stringify(obj)))
      expect(isRight(parsed)).toBeTruthy()
    })

  it('should parse valid address', () =>
    validParse(validAddressData, validUserData, validLocalPaymentData))

  it('should parse valid user data', () => validParse(validUserData))

  it('should parse valid local payment data', () => validParse(validLocalPaymentData))

  it('should parse valid BeamAndGo payment data', () => validParse(validBeamAndGoPaymentData))

  const invalidParse = (...pairs: Array<{ obj: object; s: string }>) =>
    pairs.forEach((pair) => {
      const parsed = qrDataFromJson(JSON.parse(JSON.stringify(pair.obj)))
      if (isRight(parsed)) {
        fail('should be left')
      }
      expect(PathReporter.report(parsed)[0]).toBe(pair.s)
    })

  it('should parse with error on invalid address', () =>
    invalidParse({
      obj: { address: zeroAddress().slice(0, -1) },
      s: 'is not a valid address',
    }))

  // TODO(yorke): add tests for invalid local payment or user data
})
