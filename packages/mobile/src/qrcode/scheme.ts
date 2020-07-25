import { AddressType, E164PhoneNumberType } from '@celo/utils/lib/io'
import * as t from 'io-ts'
import { LocalCurrencyCode } from 'src/localCurrency/consts'

export const BaseQrDataType = t.type({
  address: AddressType,
})
export type BaseQrData = t.TypeOf<typeof BaseQrDataType>

export const UserQrDataType = t.intersection([
  BaseQrDataType,
  t.type({
    displayName: t.string,
    e164PhoneNumber: E164PhoneNumberType,
  }),
])
export type UserQrData = t.TypeOf<typeof UserQrDataType>

export const LocalPaymentQrDataType = t.intersection([
  BaseQrDataType,
  t.type({
    currencyCode: t.keyof(LocalCurrencyCode),
    amount: t.number,
  }),
])
export type LocalPaymentQrData = t.TypeOf<typeof LocalPaymentQrDataType>

const TopQrDataType = t.union([BaseQrDataType, UserQrDataType, LocalPaymentQrDataType])
export const qrDataFromJson = (obj: object) => TopQrDataType.decode(obj)
