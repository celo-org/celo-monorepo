import { AddressType, E164PhoneNumberType } from '@celo/utils/lib/io'
import * as t from 'io-ts'
import { LocalCurrencyCode } from 'src/localCurrency/consts'

export const QrDataType = t.type({
  address: AddressType,
  // io-ts way of defining optional key-value pair
  displayName: t.union([t.undefined, t.string]),
  e164PhoneNumber: t.union([t.undefined, E164PhoneNumberType]),
  currencyCode: t.union([t.undefined, t.keyof(LocalCurrencyCode)]),
  // TODO: amount string is valid BigNumber
  amount: t.union([t.undefined, t.string]),
  comment: t.union([t.undefined, t.string]),
})
export type QrData = t.TypeOf<typeof QrDataType>

export const qrDataFromJson = (obj: object) => QrDataType.decode(obj)
