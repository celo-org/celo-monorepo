import { Err, makeAsyncThrowable, Ok, Result } from '@celo/base/lib/result'
import OffchainDataWrapper from '../../offchain-data-wrapper'
import { OffchainError, SchemaErrors } from './errors'
import {
  buildEIP712TypedData,
  EncryptedSchema,
  readEncrypted,
  Schema,
  signBuffer,
  writeEncrypted,
} from './utils'

export class BinarySchema implements Schema<Buffer> {
  constructor(readonly wrapper: OffchainDataWrapper, readonly dataPath: string) {}

  async write(data: Buffer) {
    const signature = await signBuffer(this.wrapper, this.dataPath, data)
    return this.wrapper.writeDataTo(data, signature, this.dataPath)
  }

  async readAsResult(account: string): Promise<Result<Buffer, SchemaErrors>> {
    const rawData = await this.wrapper.readDataFromAsResult(
      account,
      (buf) => buildEIP712TypedData(this.wrapper, this.dataPath, buf),
      this.dataPath
    )
    if (!rawData.ok) {
      return Err(new OffchainError(rawData.error))
    }

    return Ok(rawData.result)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))
}

export class EncryptedBinarySchema implements EncryptedSchema<Buffer> {
  constructor(readonly wrapper: OffchainDataWrapper, readonly dataPath: string) {}

  async write(data: Buffer, toAddresses: string[], symmetricKey?: Buffer) {
    return writeEncrypted(this.wrapper, this.dataPath, data, toAddresses, symmetricKey)
  }

  async readAsResult(account: string): Promise<Result<Buffer, SchemaErrors>> {
    return readEncrypted(this.wrapper, this.dataPath, account)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))
}
