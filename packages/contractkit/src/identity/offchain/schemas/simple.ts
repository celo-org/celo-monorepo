import { makeAsyncThrowable, Result } from '@celo/base/lib/result'
import * as t from 'io-ts'
import OffchainDataWrapper from '../../offchain-data-wrapper'
import { InvalidDataError, SchemaErrors } from './errors'
import {
  buildEIP712TypedData,
  deserialize,
  resolveEncrypted,
  writeEncrypted,
  writeEncryptedWithSymmetric,
} from './utils'

export default class SimpleSchema<DataType> {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly type: t.Type<DataType>,
    readonly dataPath: string
  ) {}

  private serialize(data: DataType) {
    return Buffer.from(JSON.stringify(data))
  }

  private deserialize(buf: Buffer) {
    return deserialize(this.type, buf)
  }

  private async sign(data: DataType) {
    const typedData = await buildEIP712TypedData(this.wrapper, this.dataPath, data, this.type)
    const wallet = this.wrapper.kit.getWallet()
    return wallet.signTypedData(this.wrapper.signer, typedData)
  }

  async write(data: DataType) {
    if (!this.type.is(data)) {
      return new InvalidDataError()
    }

    return this.wrapper.writeDataTo(this.serialize(data), await this.sign(data), this.dataPath)
  }

  async writeEncrypted(data: DataType, toAddress: string) {
    if (!this.type.is(data)) {
      return new InvalidDataError()
    }

    return writeEncrypted(this.wrapper, this.dataPath, this.serialize(data), toAddress)
  }

  async writeWithSymmetric(data: DataType, toAddresses: string[], symmetricKey?: Buffer) {
    if (!this.type.is(data)) {
      return new InvalidDataError()
    }

    return writeEncryptedWithSymmetric(
      this.wrapper,
      this.dataPath,
      this.serialize(data),
      toAddresses,
      symmetricKey
    )
  }

  async readAsResult(account: string): Promise<Result<DataType, SchemaErrors>> {
    const rawData = await this.wrapper.readDataFromAsResult(
      account,
      (buf) =>
        buildEIP712TypedData(this.wrapper, this.dataPath, JSON.parse(buf.toString()), this.type),
      this.dataPath
    )

    if (!rawData.ok) {
      return this.readEncrypted(account)
    }

    const deserializedResult = this.deserialize(rawData.result)

    if (deserializedResult.ok) {
      return deserializedResult
    }

    const encryptedResult = await this.readEncrypted(account)

    if (encryptedResult.ok) {
      return encryptedResult
    }

    return deserializedResult
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))

  private async readEncrypted(account: string): Promise<Result<DataType, SchemaErrors>> {
    const encryptedResult = await resolveEncrypted(this.wrapper, this.dataPath, account)

    if (encryptedResult.ok) {
      return this.deserialize(encryptedResult.result)
    }

    return encryptedResult
  }
}
