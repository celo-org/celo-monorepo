import { Err, Ok, parseJsonAsResult, Result, RootError, trimLeading0x } from '@celo/base/src'
import { publicKeyToAddress } from '@celo/utils/lib/address'
import { Encrypt } from '@celo/utils/lib/ecies'
import { trimPublicKeyPrefix } from '@celo/utils/src/ecdh'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import OffchainDataWrapper, { OffchainErrors } from '../offchain-data-wrapper'

export enum SchemaErrorTypes {
  InvalidDataError = 'InvalidDataError',
  OffchainError = 'OffchainError',
  UnknownCiphertext = 'UnknownCiphertext',
  UnavailableKey = 'UnavailableKey',
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

export class UnavailableKey extends RootError<SchemaErrorTypes.UnavailableKey> {
  constructor() {
    super(SchemaErrorTypes.UnavailableKey)
  }
}

type SchemaErrors = InvalidDataError | OffchainError | UnknownCiphertext | UnavailableKey

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

  async writeEncrypted(data: DataType, toAddress: string) {
    if (!this.type.is(data)) {
      return
    }

    return writeEncrypted(this.wrapper, this.dataPath, this.serialize(data), toAddress)
  }

  async writeWithSymmetric(data: DataType, toAddresses: string[]) {
    if (!this.type.is(data)) {
      return
    }

    return writeEncryptedWithSymmetric(
      this.wrapper,
      this.dataPath,
      this.serialize(data),
      toAddresses
    )
  }

  async read(account: string): Promise<Result<DataType, SchemaErrors>> {
    const rawData = await this.wrapper.readDataFromAsResult(account, this.dataPath)

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

  private async readEncrypted(account: string): Promise<Result<DataType, SchemaErrors>> {
    const encryptedResult = await readEncrypted(this.wrapper, this.dataPath, account)

    if (encryptedResult.ok) {
      return this.deserialize(encryptedResult.result)
    }

    return encryptedResult
  }
}

export class BinarySchema {
  constructor(readonly wrapper: OffchainDataWrapper, readonly dataPath: string) {}

  async write(data: Buffer) {
    await this.wrapper.writeDataTo(data, this.dataPath)
  }

  async writeEncrypted(data: Buffer, toAddress: string) {
    return writeEncrypted(this.wrapper, this.dataPath, data, toAddress)
  }

  async writeWithSymmetric(data: Buffer, toAddresses: string[]) {
    return writeEncryptedWithSymmetric(this.wrapper, this.dataPath, data, toAddresses)
  }

  async read(account: string): Promise<Result<Buffer, SchemaErrors>> {
    const rawData = await this.wrapper.readDataFromAsResult(account, this.dataPath)
    if (!rawData.ok) {
      return this.readEncrypted(account)
    }

    const encryptedResult = await this.readEncrypted(account)

    if (encryptedResult.ok) {
      return encryptedResult
    }
    return Ok(rawData.result)
  }

  private async readEncrypted(account: string) {
    return readEncrypted(this.wrapper, this.dataPath, account)
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

// Assumes that the wallet has the dataEncryptionKey of wrapper.self available
// TODO: Should check and throw a more meaningful error if not
export const writeEncrypted = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  data: Buffer,
  toAddress: string
) => {
  const accounts = await wrapper.kit.contracts.getAccounts()
  const [fromPubKey, toPubKey] = await Promise.all([
    accounts.getDataEncryptionKey(wrapper.self),
    accounts.getDataEncryptionKey(toAddress),
  ])
  const wallet = wrapper.kit.getWallet()
  const sharedSecret = await wallet.computeSharedSecret(publicKeyToAddress(fromPubKey), toPubKey)

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
  toAddresses: string[]
) => {
  const iv = randomBytes(16)
  const key = randomBytes(16)
  const cipher = createCipheriv('aes-128-ctr', key, iv)

  const output = cipher.update(data)
  const payload = Buffer.concat([iv, output, cipher.final()])

  await wrapper.writeDataTo(payload, `${dataPath}.enc`)
  await Promise.all(
    toAddresses.map(async (toAddress) => writeEncrypted(wrapper, dataPath, key, toAddress))
  )
}

const readEncrypted = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  senderAddress: string
): Promise<Result<Buffer, SchemaErrors>> => {
  const accounts = await wrapper.kit.contracts.getAccounts()
  const wallet = wrapper.kit.getWallet()
  const [readerPubKey, senderPubKey] = await Promise.all([
    accounts.getDataEncryptionKey(wrapper.self),
    accounts.getDataEncryptionKey(senderAddress),
  ])

  if (readerPubKey === null) {
    return Err(new UnavailableKey())
  }
  const readerPublicKeyAddress = publicKeyToAddress(readerPubKey)

  if (!wallet.hasAccount(readerPublicKeyAddress)) {
    return Err(new UnavailableKey())
  }

  const sharedSecret = await wallet.computeSharedSecret(readerPublicKeyAddress, senderPubKey)

  const computedDataPath = getDataPath(dataPath, sharedSecret, senderPubKey, readerPubKey)

  const [encryptedPayload, encryptedPayloadOrKey] = await Promise.all([
    wrapper.readDataFromAsResult(senderAddress, `${dataPath}.enc`),
    await wrapper.readDataFromAsResult(senderAddress, '/ciphertexts/' + computedDataPath),
  ])

  if (!encryptedPayloadOrKey.ok) {
    return Err(new OffchainError(encryptedPayloadOrKey.error))
  }

  const payloadOrKey = await wallet.decrypt(readerPublicKeyAddress, encryptedPayloadOrKey.result)

  // encrypted with symmetric key
  if (encryptedPayload.ok) {
    const key = payloadOrKey
    const payload = encryptedPayload.result
    const iv = payload.slice(0, 16)
    const encryptedData = payload.slice(16)

    const decipher = createDecipheriv('aes-128-ctr', key, iv)

    return Ok(Buffer.concat([decipher.update(encryptedData), decipher.final()]))
  }

  return Ok(payloadOrKey)
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
