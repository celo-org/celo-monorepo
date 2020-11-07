import { Address, trimLeading0x } from '@celo/base'
import { Err, makeAsyncThrowable } from '@celo/base/lib/result'
import { AddressType, SignatureType } from '@celo/utils/lib/io'
import * as t from 'io-ts'
import { toChecksumAddress } from 'web3-utils'
import OffchainDataWrapper, { OffchainErrors } from '../../offchain-data-wrapper'
import { buildEIP712TypedData, deserialize } from '../utils'
import { OffchainError } from './errors'

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
      dataPath,
      false,
      AuthorizedSignerSchema
    )
    if (!rawData.ok) {
      return Err(new OffchainError(rawData.error))
    }

    return deserialize(AuthorizedSignerSchema, rawData.result)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))

  async write(
    signer: Address,
    proofOfPossession: string,
    filteredDataPaths: string
  ): Promise<OffchainErrors | void> {
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
    return this.wrapper.writeDataTo(
      Buffer.from(JSON.stringify(payload)),
      Buffer.from(trimLeading0x(signature), 'hex'),
      dataPath
    )
  }
}
