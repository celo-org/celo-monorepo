import { AddressType, SignatureType } from '@celo/utils/lib/io'
import * as t from 'io-ts'
import { toChecksumAddress } from 'web3-utils'
import { Address } from '../../base'
import OffchainDataWrapper from '../offchain-data-wrapper'
import { readWithSchema, SingleSchema, writeWithSchema } from './schema-utils'

const NameSchema = t.type({
  name: t.string,
})
export type NameType = t.TypeOf<typeof NameSchema>

export class NameAccessor extends SingleSchema<NameType> {
  constructor(readonly wrapper: OffchainDataWrapper) {
    super(wrapper, NameSchema, '/account/name')
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
    return readWithSchema(
      this.wrapper,
      AuthorizedSignerSchema,
      account,
      this.basePath + '/' + toChecksumAddress(signer)
    )
  }

  async write(signer: Address, proofOfPossession: string, filteredDataPaths: string) {
    return writeWithSchema(
      this.wrapper,
      AuthorizedSignerSchema,
      this.basePath + '/' + toChecksumAddress(signer),
      {
        address: toChecksumAddress(signer),
        proofOfPossession,
        filteredDataPaths,
      }
    )
  }
}

const EncryptionKeysSchema = t.type({
  keys: t.record(
    t.string,
    t.type({
      privateKey: t.string,
      publicKey: t.string,
    })
  ),
})

type EncryptionKeysType = t.TypeOf<typeof EncryptionKeysSchema>
export class EncryptionKeysAccessor {
  basePath = '/others'
  constructor(readonly wrapper: OffchainDataWrapper) {}

  async read(account: Address, self: Address) {
    return readWithSchema(
      this.wrapper,
      EncryptionKeysSchema,
      account,
      this.basePath + '/' + self + '/encryptionKeys'
    )
  }

  async write(other: Address, keys: EncryptionKeysType) {
    return writeWithSchema(
      this.wrapper,
      EncryptionKeysSchema,
      this.basePath + '/' + other + '/encryptionKeys',
      keys
    )
  }
}
