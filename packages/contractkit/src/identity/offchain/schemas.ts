import { Err } from '@celo/base/lib/result'
import { AddressType, SignatureType } from '@celo/utils/lib/io'
import * as t from 'io-ts'
import { toChecksumAddress } from 'web3-utils'
import { Address } from '../../base'
import OffchainDataWrapper from '../offchain-data-wrapper'
import { BinarySchema, deserialize, OffchainError, SimpleSchema } from './schema-utils'

const NameSchema = t.type({
  name: t.string,
})
export type NameType = t.TypeOf<typeof NameSchema>

export class NameAccessor extends SimpleSchema<NameType> {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, NameSchema, '/account/name')
  }
}

export class ProfilePicture extends BinarySchema {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, '/account/picture')
  }
}

const AuthorizedSignerSchema = t.type({
  address: AddressType,
  proofOfPossession: SignatureType,
  filteredDataPaths: t.string,
})
export class AuthorizedSignerAccessor {
  basePath = '/account/authorizedSigners'
  constructor(readonly wrapper: OffchainDataWrapper) {}

  async read(account: Address, signer: Address) {
    const rawData = await this.wrapper.readDataFromAsResult(
      account,
      this.basePath + '/' + toChecksumAddress(signer)
    )
    if (!rawData.ok) {
      return Err(new OffchainError(rawData.error))
    }

    return deserialize(AuthorizedSignerSchema, rawData.result)
  }

  async write(signer: Address, proofOfPossession: string, filteredDataPaths: string) {
    await this.wrapper.writeDataTo(
      Buffer.from(
        JSON.stringify({
          address: toChecksumAddress(signer),
          proofOfPossession,
          filteredDataPaths,
        })
      ),
      this.basePath + '/' + toChecksumAddress(signer)
    )
  }
}
