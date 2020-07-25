import { zeroAddress } from 'ethereumjs-util'
import { isRight } from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { BaseQrData, LocalPaymentQrData, qrDataFromJson, UserQrData } from 'src/qrcode/scheme'

const validBaseData: BaseQrData = { address: zeroAddress() }
const validUserData: UserQrData = {
  ...validBaseData,
  displayName: 'alice',
  e164PhoneNumber: '+19995550123',
}
const validLocalPaymentData: LocalPaymentQrData = {
  ...validBaseData,
  currencyCode: 'PHP',
  amount: 521.46,
}

describe('#qrDataFromJson', () => {
  const validParse = (...objects: object[]) =>
    objects.forEach((obj) => {
      const parsed = qrDataFromJson(JSON.parse(JSON.stringify(obj)))
      expect(isRight(parsed)).toBeTruthy()
    })

  it('should parse valid address', () =>
    validParse(validBaseData, validUserData, validLocalPaymentData))

  it('should parse valid user data', () => validParse(validUserData))

  it('should parse valid local payment data', () => validParse(validLocalPaymentData))

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
})
