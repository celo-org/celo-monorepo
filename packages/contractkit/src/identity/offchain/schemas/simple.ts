import { Err, makeAsyncThrowable, Result } from '@celo/base/lib/result'
import * as t from 'io-ts'
import OffchainDataWrapper from '../../offchain-data-wrapper'
import { InvalidDataError, OffchainError, SchemaErrors } from './errors'
import {
  buildEIP712TypedData,
  deserialize,
  EncryptedSchema,
  readEncrypted,
  Schema,
  writeEncrypted,
} from './utils'

function serialize<DataType>(data: DataType) {
  return Buffer.from(JSON.stringify(data))
}

/**
 * A generic schema for reading and writing objects to and from storage. Passing
 * in a type parameter is supported for runtime type safety.
 */
export class SimpleSchema<DataType> implements Schema<DataType> {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly type: t.Type<DataType>,
    readonly dataPath: string
  ) {}

  private async sign(data: DataType) {
    const typedData = await buildEIP712TypedData(this.wrapper, this.dataPath, data, this.type)
    const wallet = this.wrapper.kit.getWallet()
    return wallet.signTypedData(this.wrapper.signer, typedData)
  }

  async write(data: DataType) {
    if (!this.type.is(data)) {
      return new InvalidDataError()
    }

    const error = await this.wrapper.writeDataTo(
      serialize(data),
      await this.sign(data),
      this.dataPath
    )
    if (error) {
      return new OffchainError(error)
    }
  }

  async readAsResult(account: string): Promise<Result<DataType, SchemaErrors>> {
    const rawData = await this.wrapper.readDataFromAsResult(
      account,
      (buf) =>
        buildEIP712TypedData(this.wrapper, this.dataPath, JSON.parse(buf.toString()), this.type),
      this.dataPath
    )

    if (!rawData.ok) {
      return Err(new OffchainError(rawData.error))
    }

    const deserializedResult = deserialize(this.type, rawData.result)
    if (deserializedResult.ok) {
      return deserializedResult
    }

    return deserializedResult
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))
}

/**
 * A generic schema for writing and reading encrypted objects to and from storage. Passing
 * in a type parameter is supported for runtime type safety.
 */
export class EncryptedSimpleSchema<DataType> implements EncryptedSchema<DataType> {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly type: t.Type<DataType>,
    readonly dataPath: string
  ) {}

  write(data: DataType, toAddresses: string[], symmetricKey?: Buffer) {
    if (!this.type.is(data)) {
      return Promise.resolve(new InvalidDataError())
    }

    return writeEncrypted(this.wrapper, this.dataPath, serialize(data), toAddresses, symmetricKey)
  }

  async readAsResult(account: string): Promise<Result<DataType, SchemaErrors>> {
    const encryptedResult = await readEncrypted(this.wrapper, this.dataPath, account)

    if (encryptedResult.ok) {
      return deserialize(this.type, encryptedResult.result)
    }

    return encryptedResult
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))
}
