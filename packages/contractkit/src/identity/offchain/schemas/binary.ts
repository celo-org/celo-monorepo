import { Err, makeAsyncThrowable, Ok } from '@celo/base/lib/result'
import OffchainDataWrapper from '../../offchain-data-wrapper'
import { OffchainError } from './errors'
import {
  buildEIP712TypedData,
  EncryptedSchema,
  readEncrypted,
  Schema,
  signBuffer,
  writeEncrypted,
} from './utils'

/**
 * Schema for writing any generic binary data
 */
export class BinarySchema implements Schema<Buffer> {
  constructor(readonly wrapper: OffchainDataWrapper, readonly dataPath: string) {}

  async write(data: Buffer) {
    const signature = await signBuffer(this.wrapper, this.dataPath, data)
    const error = await this.wrapper.writeDataTo(data, signature, this.dataPath)
    if (error) {
      return new OffchainError(error)
    }
  }

  async readAsResult(account: string) {
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

/**
 * Schema for writing any encrypted binary data.
 */
export class EncryptedBinarySchema implements EncryptedSchema<Buffer> {
  constructor(readonly wrapper: OffchainDataWrapper, readonly dataPath: string) {}

  async write(data: Buffer, toAddresses: string[], symmetricKey?: Buffer) {
    return writeEncrypted(this.wrapper, this.dataPath, data, toAddresses, symmetricKey)
  }

  async readAsResult(account: string) {
    return readEncrypted(this.wrapper, this.dataPath, account)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))
}
