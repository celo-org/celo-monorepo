import { makeAsyncThrowable, Ok, Result } from '@celo/base/lib/result'
import OffchainDataWrapper from '../../offchain-data-wrapper'
import { SchemaErrors } from './errors'
import {
  buildEIP712TypedData,
  resolveEncrypted,
  signBuffer,
  writeEncrypted,
  writeEncryptedWithSymmetric,
} from './utils'

export default class BinarySchema {
  constructor(readonly wrapper: OffchainDataWrapper, readonly dataPath: string) {}

  async write(data: Buffer) {
    const signature = await signBuffer(this.wrapper, this.dataPath, data)
    return this.wrapper.writeDataTo(data, signature, this.dataPath)
  }

  async writeEncrypted(data: Buffer, toAddress: string) {
    return writeEncrypted(this.wrapper, this.dataPath, data, toAddress)
  }

  async writeWithSymmetric(data: Buffer, toAddresses: string[], symmetricKey?: Buffer) {
    return writeEncryptedWithSymmetric(this.wrapper, this.dataPath, data, toAddresses, symmetricKey)
  }

  async readAsResult(account: string): Promise<Result<Buffer, SchemaErrors>> {
    const rawData = await this.wrapper.readDataFromAsResult(
      account,
      (buf) => buildEIP712TypedData(this.wrapper, this.dataPath, buf),
      this.dataPath
    )
    if (!rawData.ok) {
      return this.readEncrypted(account)
    }

    const encryptedResult = await this.readEncrypted(account)

    if (encryptedResult.ok) {
      return encryptedResult
    }
    return Ok(rawData.result)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))

  private async readEncrypted(account: string) {
    return resolveEncrypted(this.wrapper, this.dataPath, account)
  }
}
