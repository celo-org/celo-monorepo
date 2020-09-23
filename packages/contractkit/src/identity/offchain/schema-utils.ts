import {
  Err,
  makeAsyncThrowable,
  Ok,
  parseJsonAsResult,
  Result,
  RootError,
  trimLeading0x,
} from '@celo/base/src'
import { ensureLeading0x, publicKeyToAddress } from '@celo/utils/lib/address'
import { Encrypt } from '@celo/utils/lib/ecies'
import { addressToPublicKey } from '@celo/utils/lib/signatureUtils'
import { trimPublicKeyPrefix } from '@celo/utils/src/ecdh'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'
import { isLeft, isRight } from 'fp-ts/lib/Either'
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

  async readAsResult(account: string) {
    return readWithSchemaAsResult(this.wrapper, this.type, account, this.dataPath)
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))

  async readEncrypted(
    recipientAddress: Address,
    senderAddress: string
  ): Promise<Result<DataType, SchemaErrors>> {
    const wallet = this.wrapper.kit.getWallet()
    const sharedSecret = await wallet.computeSharedSecret(
      recipientAddress,
      await addressToPublicKey(senderAddress, this.wrapper.kit.web3.eth.sign)
    )

    const response = await readEncrypted(
      this.wrapper,
      this.dataPath,
      (data) => wallet.decrypt(recipientAddress, data),
      sharedSecret,
      senderAddress,
      recipientAddress
    )
    if (!response.ok) {
      return Err(new InvalidDataError())
    }

    return verifySchema(this.type, response.result)
  }

  async write(data: DataType) {
    return writeWithSchema(this.wrapper, this.type, this.dataPath, data)
  }

  async writeEncrypted(data: DataType, fromAddress: string, toAddress: string) {
    const wallet = this.wrapper.kit.getWallet()

    const [fromPubKey, toPubKey] = await Promise.all([
      addressToPublicKey(fromAddress, this.wrapper.kit.web3.eth.sign),
      addressToPublicKey(toAddress, this.wrapper.kit.web3.eth.sign),
    ])

    const sharedSecret = await wallet.computeSharedSecret(fromAddress, toPubKey)

    return writeEncryptedWithSchema(
      this.wrapper,
      this.type,
      this.dataPath,
      data,
      sharedSecret,
      fromPubKey,
      toPubKey
    )
  }

  //  file_ciphertext = IV || E(message key, IV, data)
  async writeWithSymmetric(data: DataType, fromAddress: string, toAddresses: string[]) {
    if (!this.type.is(data)) {
      return Err(new InvalidDataError())
    }

    const wallet = this.wrapper.kit.getWallet()

    const iv = randomBytes(16)
    const key = randomBytes(16)
    const cipher = createCipheriv('aes-128-ctr', key, iv)

    const output = cipher.update(Buffer.from(JSON.stringify(data)))
    const payload = Buffer.concat([iv, output, cipher.final()])

    const fromPubKey = await addressToPublicKey(fromAddress, this.wrapper.kit.web3.eth.sign)

    await this.wrapper.writeDataTo(payload, `${this.dataPath}.enc`)
    await Promise.all(
      toAddresses.map(async (address) => {
        const toPubKey = await addressToPublicKey(address, this.wrapper.kit.web3.eth.sign)
        const sharedSecret = await wallet.computeSharedSecret(fromAddress, toPubKey)

        return writeEncrypted(this.wrapper, this.dataPath, key, sharedSecret, fromPubKey, toPubKey)
      })
    )
  }

  async readWithSymmetric(
    recipientAddress: Address,
    senderAddress: Address
  ): Promise<Result<Buffer, SchemaErrors>> {
    const wallet = this.wrapper.kit.getWallet()
    const sharedSecret = await wallet.computeSharedSecret(
      recipientAddress,
      await addressToPublicKey(senderAddress, this.wrapper.kit.web3.eth.sign)
    )

    const readKeyResponse = await readEncrypted(
      this.wrapper,
      this.dataPath,
      async (data) => wallet.decrypt(recipientAddress, data),
      sharedSecret,
      senderAddress,
      recipientAddress
    )
    if (!readKeyResponse.ok) {
      return Err(new InvalidDataError())
    }

    const key = readKeyResponse.result
    const payload = await this.wrapper.readDataFrom(senderAddress, `${this.dataPath}.enc`)
    const iv = payload.slice(0, 16)
    const encryptedData = payload.slice(16)

    const decipher = createDecipheriv('aes-128-ctr', key, iv)
    return Ok(Buffer.concat([decipher.update(encryptedData), decipher.final()]))
  }
}

// Core Schemas
const EncryptionWrappedData = t.type({
  publicKey: t.string,
  ciphertext: t.string,
  encryptedKey: t.union([t.record(t.string, t.string), t.undefined]),
})

type EncryptionWrappedDataType = t.TypeOf<typeof EncryptionWrappedData>

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
  basePath = '/accounts'
  constructor(readonly wrapper: OffchainDataWrapper) {}

  async readAsResult(account: Address) {
    return readWithSchemaAsResult(
      this.wrapper,
      EncryptionKeysSchema,
      account,
      this.basePath + '/' + this.wrapper.self + '/encryptionKeys'
    )
  }

  read = makeAsyncThrowable(this.readAsResult.bind(this))

  async write(other: Address, keys: EncryptionKeysType) {
    return writeWithSchema(
      this.wrapper,
      EncryptionKeysSchema,
      this.basePath + '/' + other + '/encryptionKeys',
      keys
    )
  }

  // async writeEncrypted(
  //   other: Address,
  //   keys: EncryptionKeysType,
  //   decryptionKey: string,
  //   pubKeys: string[]
  // ) {
  //   return writeEncryptedWithSchema(
  //     this.wrapper,
  //     this.t
  //     EncryptionKeysSchema,
  //     this.basePath + '/' + other + '/encryptionKeys',
  //     keys,
  //     decryptionKey,
  //     pubKeys
  //   )
  // }
}

const getDecryptionKey = async (
  wrapper: OffchainDataWrapper,
  account: Address,
  encryptionWrappedData: EncryptionWrappedDataType
) => {
  const wallet = wrapper.kit.getWallet()
  const decryptionPublicKey = encryptionWrappedData.publicKey
  const decryptionKeyAddress = publicKeyToAddress(decryptionPublicKey)

  if (wallet.hasAccount(decryptionKeyAddress)) {
    return true
  }

  if (encryptionWrappedData.encryptedKey) {
    const keyToDecryptDecryptionKey = Object.keys(encryptionWrappedData.encryptedKey).find((x) =>
      wallet.hasAccount(publicKeyToAddress(x))
    )

    if (keyToDecryptDecryptionKey) {
      const decryptionKeyCiphertext = encryptionWrappedData.encryptedKey[keyToDecryptDecryptionKey]

      const decryptionKey = await wallet.decrypt(
        publicKeyToAddress(keyToDecryptDecryptionKey),
        Buffer.from(decryptionKeyCiphertext, 'hex')
      )

      wrapper.kit.addAccount(ensureLeading0x(decryptionKey.toString('hex')))
      return true
    }
  }

  const encryptionKeysAccessor = new EncryptionKeysAccessor(wrapper)
  const encryptionKeys = await encryptionKeysAccessor.readAsResult(account)

  if (!encryptionKeys.ok) {
    return false
  }

  // The decryption key is under the encryptionKeys path
  if (encryptionKeys.result.keys[encryptionWrappedData.publicKey]) {
    wrapper.kit.addAccount(encryptionKeys.result.keys[encryptionWrappedData.publicKey].privateKey)
    return true
  }

  return false
}

export const readWithSchemaAsResult = async <DataType>(
  wrapper: OffchainDataWrapper,
  type: t.Type<DataType>,
  account: Address,
  dataPath: string
): Promise<Result<DataType, SchemaErrors>> => {
  const rawData = await wrapper.readDataFromAsResult(account, dataPath)
  if (!rawData.ok) {
    return Err(new OffchainError(rawData.error))
  }

  const dataAsJson = parseJsonAsResult(rawData.result.toString())

  if (!dataAsJson.ok) {
    return Err(new InvalidDataError())
  }

  const parsedDataAsType = type.decode(dataAsJson.result)

  if (isRight(parsedDataAsType)) {
    return Ok(parsedDataAsType.right)
  }

  const parseDataAsEncryptionWrapped = EncryptionWrappedData.decode(dataAsJson.result)
  if (isLeft(parseDataAsEncryptionWrapped)) {
    return Err(new InvalidDataError())
  }

  const decryptionKeyPublic = parseDataAsEncryptionWrapped.right.publicKey
  const decryptionKeyAddress = publicKeyToAddress(decryptionKeyPublic)
  const wallet = wrapper.kit.getWallet()

  const hasDecryptionKey = await getDecryptionKey(
    wrapper,
    account,
    parseDataAsEncryptionWrapped.right
  )

  if (hasDecryptionKey) {
    const plaintext = await wallet.decrypt(
      decryptionKeyAddress,
      Buffer.from(parseDataAsEncryptionWrapped.right.ciphertext, 'hex')
    )

    const parsedPlaintextAsObject = parseJsonAsResult(plaintext.toString())
    if (!parsedPlaintextAsObject.ok) {
      return Err(new InvalidDataError())
    }

    const parsedPlaintextAsType = type.decode(parsedPlaintextAsObject.result)
    if (isLeft(parsedPlaintextAsType)) {
      return Err(new InvalidDataError())
    }

    return Ok(parsedPlaintextAsType.right)
  }

  return Err(new UnknownCiphertext())
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

export const writeWithSchema = async <DataType>(
  wrapper: OffchainDataWrapper,
  type: t.Type<DataType>,
  dataPath: string,
  data: DataType
) => {
  if (!type.is(data)) {
    return
  }
  const serializedData = JSON.stringify(data)
  await wrapper.writeDataTo(Buffer.from(serializedData), dataPath)
  return
}

export const writeEncrypted = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  data: Buffer | string,
  sharedSecret: Buffer,
  publisherPublicKey: string,
  receiverPublicKey: string
) => {
  const computedDataPath = getDataPath(
    dataPath,
    sharedSecret,
    publisherPublicKey,
    receiverPublicKey
  )
  const encryptedData = Encrypt(
    Buffer.from(trimPublicKeyPrefix(receiverPublicKey), 'hex'),
    Buffer.from(data)
  )
  await wrapper.writeDataTo(encryptedData, '/ciphertexts/' + computedDataPath)
}

export const writeEncryptedWithSchema = async <T>(
  wrapper: OffchainDataWrapper,
  type: t.Type<T>,
  dataPath: string,
  data: T,
  sharedSecret: Buffer,
  publisherPublicKey: string,
  receiverPublicKey: string
) => {
  if (!type.is(data)) {
    return
  }

  return writeEncrypted(
    wrapper,
    dataPath,
    JSON.stringify(data),
    sharedSecret,
    publisherPublicKey,
    receiverPublicKey
  )
}

const readEncrypted = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  decrypt: (data: Buffer) => Promise<Buffer>,
  sharedSecret: Buffer,
  senderAddress: string,
  recipientAddress: string
): Promise<Result<Buffer, SchemaErrors>> => {
  const senderPubKey = await addressToPublicKey(senderAddress, wrapper.kit.web3.eth.sign)
  const recipientPubKey = await addressToPublicKey(recipientAddress, wrapper.kit.web3.eth.sign)

  const computedDataPath = getDataPath(dataPath, sharedSecret, senderPubKey, recipientPubKey)
  const rawData = await wrapper.readDataFromAsResult(
    senderAddress,
    '/ciphertexts/' + computedDataPath
  )
  if (!rawData.ok) {
    return Err(new OffchainError(rawData.error))
  }

  return Ok(await decrypt(rawData.result))
}

export const readWithSchema = makeAsyncThrowable(readWithSchemaAsResult)

function verifySchema<T>(type: t.Type<T>, data: any) {
  const dataAsJson = parseJsonAsResult(data)
  if (!dataAsJson.ok) {
    return Err(new InvalidDataError())
  }

  const parsedDataAsType = type.decode(dataAsJson.result)

  if (isRight(parsedDataAsType)) {
    return Ok(parsedDataAsType.right)
  }

  const parseDataAsEncryptionWrapped = EncryptionWrappedData.decode(dataAsJson.result)
  if (isLeft(parseDataAsEncryptionWrapped)) {
    return Err(new InvalidDataError())
  }

  return Err(new InvalidDataError())
}
