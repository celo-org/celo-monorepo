import { Err, Ok, parseJsonAsResult, Result, RootError, trimLeading0x } from '@celo/base/src'
import { Encrypt } from '@celo/utils/lib/ecies'
import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import { trimPublicKeyPrefix } from '@celo/utils/src/ecdh'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { Address } from '../../base'
import OffchainDataWrapper, { OffchainErrors } from '../offchain-data-wrapper'

export enum SchemaErrorTypes {
  InvalidDataError = 'InvalidDataError',
  OffchainError = 'OffchainError',
  UnknownCiphertext = 'UnknownCiphertext',
}

export class InvalidDataError extends RootError<SchemaErrorTypes.InvalidDataError> {
  constructor() {
    super(SchemaErrorTypes.InvalidDataError)
  }
}

export class OffchainError extends RootError<SchemaErrorTypes.OffchainError> {
  constructor(readonly error: OffchainErrors) {
    super(SchemaErrorTypes.OffchainError)
  }
}

export class UnknownCiphertext extends RootError<SchemaErrorTypes.UnknownCiphertext> {
  constructor() {
    super(SchemaErrorTypes.UnknownCiphertext)
  }
}

type SchemaErrors = InvalidDataError | OffchainError | UnknownCiphertext

export class SimpleSchema<DataType> {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly type: t.Type<DataType>,
    readonly dataPath: string
  ) {}

  serialize(data: DataType) {
    return Buffer.from(JSON.stringify(data))
  }

  deserialize(buf: Buffer): Result<DataType, SchemaErrors> {
    return deserialize(this.type, buf)
  }

  async write(data: DataType) {
    if (!this.type.is(data)) {
      return
    }

    await this.wrapper.writeDataTo(this.serialize(data), this.dataPath)
  }

  async writeEncrypted(data: DataType, fromAddress: string, toAddress: string) {
    if (!this.type.is(data)) {
      return
    }

    return writeEncrypted(this.wrapper, this.dataPath, this.serialize(data), fromAddress, toAddress)
  }

  async writeWithSymmetric(data: DataType, fromAddress: string, toAddresses: string[]) {
    if (!this.type.is(data)) {
      return
    }

    return writeEncryptedWithSymmetric(
      this.wrapper,
      this.dataPath,
      this.serialize(data),
      fromAddress,
      toAddresses
    )
  }

  async read(account: string): Promise<Result<DataType, SchemaErrors>> {
    const rawData = await this.wrapper.readDataFromAsResult(account, this.dataPath)
    if (!rawData.ok) {
      return Err(new OffchainError(rawData.error))
    }

    return this.deserialize(rawData.result)
  }

  async readEncrypted(
    senderAddress: string,
    recipientAddress: Address
  ): Promise<Result<DataType, SchemaErrors>> {
    const result = await readEncrypted(this.wrapper, this.dataPath, senderAddress, recipientAddress)
    if (!result.ok) {
      return Err(result.error)
    }

    return this.deserialize(result.result)
  }
}

export class BinarySchema {
  constructor(readonly wrapper: OffchainDataWrapper, readonly dataPath: string) {}

  async write(data: Buffer) {
    await this.wrapper.writeDataTo(data, this.dataPath)
  }

  async writeEncrypted(data: Buffer, fromAddress: string, toAddress: string) {
    return writeEncrypted(this.wrapper, this.dataPath, data, fromAddress, toAddress)
  }

  async writeWithSymmetric(data: Buffer, fromAddress: string, toAddresses: string[]) {
    return writeEncryptedWithSymmetric(this.wrapper, this.dataPath, data, fromAddress, toAddresses)
  }

  async read(account: string): Promise<Result<Buffer, SchemaErrors>> {
    const rawData = await this.wrapper.readDataFromAsResult(account, this.dataPath)
    if (!rawData.ok) {
      return Err(new OffchainError(rawData.error))
    }

    return Ok(rawData.result)
  }

  async readEncrypted(senderAddress: string, recipientAddress: Address) {
    return readEncrypted(this.wrapper, this.dataPath, senderAddress, recipientAddress)
  }
}

// label = PRF(ECDH(A, B), A || B || data path)
// ciphertext path = "/cosmetic path/" || base64(label)
export function getDataPath(
  path: string,
  sharedSecret: Buffer,
  senderPublicKey: string,
  receiverPublicKey: string
) {
  const senderPublicKeyBuffer = Buffer.from(trimLeading0x(senderPublicKey), 'hex')
  const receiverPublicKeyBuffer = Buffer.from(trimLeading0x(receiverPublicKey), 'hex')

  return createHmac('sha3-256', sharedSecret)
    .update(Buffer.concat([senderPublicKeyBuffer, receiverPublicKeyBuffer, Buffer.from(path)]))
    .digest('base64')
}

export const writeEncrypted = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  data: Buffer,
  fromAddress: string,
  toAddress: string
) => {
  const [fromPubKey, toPubKey] = await Promise.all([
    addressToPublicKey(fromAddress, wrapper.kit.web3.eth.sign),
    addressToPublicKey(toAddress, wrapper.kit.web3.eth.sign),
  ])

  const wallet = wrapper.kit.getWallet()
  const sharedSecret = await wallet.computeSharedSecret(fromAddress, toPubKey)

  const computedDataPath = getDataPath(dataPath, sharedSecret, fromPubKey, toPubKey)
  const encryptedData = Encrypt(
    Buffer.from(trimPublicKeyPrefix(toPubKey), 'hex'),
    Buffer.from(data)
  )
  await wrapper.writeDataTo(encryptedData, '/ciphertexts/' + computedDataPath)
}

//  file_ciphertext = IV || E(message key, IV, data)
export const writeEncryptedWithSymmetric = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  data: Buffer,
  fromAddress: string,
  toAddresses: string[]
) => {
  const iv = randomBytes(16)
  const key = randomBytes(16)
  const cipher = createCipheriv('aes-128-ctr', key, iv)

  const output = cipher.update(Buffer.from(JSON.stringify(data)))
  const payload = Buffer.concat([iv, output, cipher.final()])

  await wrapper.writeDataTo(payload, `${dataPath}.enc`)
  await Promise.all(
    toAddresses.map(async (toAddress) =>
      writeEncrypted(wrapper, dataPath, key, fromAddress, toAddress)
    )
  )
}

const readEncrypted = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  senderAddress: string,
  recipientAddress: string
): Promise<Result<Buffer, SchemaErrors>> => {
  const wallet = wrapper.kit.getWallet()
  const sharedSecret = await wallet.computeSharedSecret(
    recipientAddress,
    await addressToPublicKey(senderAddress, wrapper.kit.web3.eth.sign)
  )

  const senderPubKey = await addressToPublicKey(senderAddress, wrapper.kit.web3.eth.sign)
  const recipientPubKey = await addressToPublicKey(recipientAddress, wrapper.kit.web3.eth.sign)

  const computedDataPath = getDataPath(dataPath, sharedSecret, senderPubKey, recipientPubKey)

  const [encryptedPayload, encryptedPayloadOrKey] = await Promise.all([
    wrapper.readDataFromAsResult(senderAddress, `${dataPath}.enc`),
    await wrapper.readDataFromAsResult(senderAddress, '/ciphertexts/' + computedDataPath),
  ])

  if (!encryptedPayloadOrKey.ok) {
    return Err(new OffchainError(encryptedPayloadOrKey.error))
  }

  // encrypted with symmetric key
  if (encryptedPayload.ok) {
    const key = encryptedPayloadOrKey.result
    const payload = encryptedPayload.result
    const iv = payload.slice(0, 16)
    const encryptedData = payload.slice(16)

    const decipher = createDecipheriv('aes-128-ctr', key, iv)

    return Ok(Buffer.concat([decipher.update(encryptedData), decipher.final()]))
  }

  return Ok(await wallet.decrypt(recipientAddress, encryptedPayloadOrKey.result))
}

export const deserialize = <DataType>(
  type: t.Type<DataType>,
  buf: Buffer
): Result<DataType, SchemaErrors> => {
  const dataAsJson = parseJsonAsResult(buf.toString())
  if (!dataAsJson.ok) {
    return Err(new InvalidDataError())
  }

  const parsedDataAsType = type.decode(dataAsJson.result)
  if (isLeft(parsedDataAsType)) {
    return Err(new InvalidDataError())
  }

  return Ok(parsedDataAsType.right)
}
