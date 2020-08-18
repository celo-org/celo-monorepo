import { zeroAddress } from 'ethereumjs-util'
import { UriData, uriDataFromJson, uriDataFromUrl, urlFromUriData } from 'src/qrcode/schema'

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

describe('qrcode/schema', () => {
  describe('#uriDataFromJson', () => {
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

  const data1: Partial<UriData> = {
    address: '0x8902dBbE62F149841F2b05a63dFE615bD8F69340',
    displayName: undefined,
    e164PhoneNumber: undefined,
  }
  const url1 = urlFromUriData(data1)

  const data2: Partial<UriData> = {
    ...data1,
    displayName: 'Steven Cowrie',
    e164PhoneNumber: '+254720670799',
  }
  const url2 = urlFromUriData(data2)

  describe('#urlFromUriData', () => {
    it('should strip undefined values', () => {
      expect(url1).toBe(`celo://wallet/pay?address=${data1.address}`)
    })

    it('should include defined values', () => {
      const params = new URLSearchParams(Object(data2))
      expect(url2).toBe(encodeURI(`celo://wallet/pay?${params.toString()}`))
    })
  })

  describe('#uriDataFromUrl', () => {
    it('should parse correctly', () => {
      uriDataFromUrl(url1)
      uriDataFromUrl(url2)
    })
  })
})
