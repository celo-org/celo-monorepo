import { AddressType, E164PhoneNumberType } from '@celo/utils/lib/io'
import { isLeft } from 'fp-ts/lib/Either'
import {
  keyof as ioKeyof,
  string as ioString,
  type as ioType,
  TypeOf as ioTypeOf,
  undefined as ioUndefined,
  union as ioUnion,
} from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { parse } from 'url'

export const UriDataType = ioType({
  address: AddressType,
  displayName: ioUnion([ioUndefined, ioString]),
  e164PhoneNumber: ioUnion([ioUndefined, E164PhoneNumberType]),
  currencyCode: ioUnion([ioUndefined, ioKeyof(LocalCurrencyCode)]),
  amount: ioUnion([ioUndefined, ioString]),
  comment: ioUnion([ioUndefined, ioString]),
})
export type UriData = ioTypeOf<typeof UriDataType>

export const uriDataFromJson = (obj: object): UriData => {
  const either = UriDataType.decode(obj)
  if (isLeft(either)) {
    throw new Error(PathReporter.report(either)[0])
  }
  return either.right
}
export const uriDataFromUrl = (url: string) => uriDataFromJson(parse(decodeURI(url), true).query)

enum UriMethod {
  pay = 'pay',
}

export const urlFromUriData = (data: Partial<UriData>, method: UriMethod = UriMethod.pay) => {
  const params = new URLSearchParams(
    Object(Object.entries(data).filter(([k, v], _) => v !== undefined))
  )
  return encodeURI(`celo://wallet/${method.toString()}?${params.toString()}`)
}
