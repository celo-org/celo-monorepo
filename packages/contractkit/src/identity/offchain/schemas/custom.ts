import { Address } from '@celo/base'
import { Err, makeAsyncThrowable } from '@celo/base/lib/result'
import { AddressType, SignatureType } from '@celo/utils/lib/io'
import * as t from 'io-ts'
import { toChecksumAddress } from 'web3-utils'
import OffchainDataWrapper from '../../offchain-data-wrapper'
import BinarySchema from './binary'
import { OffchainError } from './errors'
import SimpleSchema from './simple'
import { buildEIP712TypedData, deserialize } from './utils'

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

  async readAsResult(account: Address, signer: Address) {
    const dataPath = this.basePath + '/' + toChecksumAddress(signer)
    const rawData = await this.wrapper.readDataFromAsResult(
      account,
      (buf) =>
        buildEIP712TypedData(
          this.wrapper,
          dataPath,
          JSON.parse(buf.toString()),
          AuthorizedSignerSchema
        ),
      dataPath
    )
    if (!rawData.ok) {
      return Err(new OffchainError(rawData.error))
    }

    return deserialize(AuthorizedSignerSchema, rawData.result)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))

  async write(signer: Address, proofOfPossession: string, filteredDataPaths: string) {
    const payload = {
      address: toChecksumAddress(signer),
      proofOfPossession,
      filteredDataPaths,
    }
    const dataPath = this.basePath + '/' + toChecksumAddress(signer)
    const typedData = await buildEIP712TypedData(
      this.wrapper,
      dataPath,
      payload,
      AuthorizedSignerSchema
    )
    const signature = await this.wrapper.kit.getWallet().signTypedData(this.wrapper.self, typedData)
    await this.wrapper.writeDataTo(Buffer.from(JSON.stringify(payload)), signature, dataPath)
  }
}
