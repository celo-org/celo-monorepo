import {
  Err,
  makeAsyncThrowable,
  Ok,
  parseJsonAsResult,
  Result,
  RootError,
} from '@celo/base/lib/result'
import {
  ensureLeading0x,
  privateKeyToPublicKey,
  publicKeyToAddress,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { Encrypt } from '@celo/utils/lib/ecies'
import { randomBytes } from 'crypto'
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

  async write(data: DataType) {
    return writeWithSchema(this.wrapper, this.type, this.dataPath, data)
  }

  async writeEncrypted(data: DataType, pubKeys: string[], decryptionKey?: string | undefined) {
    return writeEncryptedWithSchema(
      this.wrapper,
      this.type,
      this.dataPath,
      data,
      pubKeys,
      decryptionKey
    )
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

  async writeEncrypted(
    other: Address,
    keys: EncryptionKeysType,
    pubKeys: string[],
    decryptionKey?: string | undefined
  ) {
    return writeEncryptedWithSchema(
      this.wrapper,
      EncryptionKeysSchema,
      this.basePath + '/' + other + '/encryptionKeys',
      keys,
      pubKeys,
      decryptionKey
    )
  }
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

  const dataAsJson = parseJsonAsResult(rawData.result)

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

export const writeEncryptedWithSchema = async <T>(
  wrapper: OffchainDataWrapper,
  type: t.Type<T>,
  dataPath: string,
  data: T,
  pubKeys: string[],
  decryptionKey?: string | undefined
) => {
  if (!type.is(data)) {
    return
  }

  if (decryptionKey === undefined) {
    decryptionKey = ensureLeading0x(randomBytes(32).toString('hex'))
  }
  const decryptionKeyPublic = privateKeyToPublicKey(decryptionKey)

  const stringifiedData = JSON.stringify(data)

  const encryptedKeyMapping: Record<string, string> = {}
  pubKeys.forEach(
    (pubKey) =>
      (encryptedKeyMapping[pubKey] = Encrypt(
        Buffer.from(trimLeading0x(pubKey), 'hex'),
        Buffer.from(trimLeading0x(decryptionKey!), 'hex')
      ).toString('hex'))
  )

  const encryptedData: EncryptionWrappedDataType = {
    publicKey: decryptionKeyPublic,
    ciphertext: Encrypt(
      Buffer.from(trimLeading0x(decryptionKeyPublic), 'hex'),
      Buffer.from(stringifiedData)
    ).toString('hex'),
    encryptedKey: encryptedKeyMapping,
  }

  const serializedData = JSON.stringify(encryptedData)
  await wrapper.writeDataTo(serializedData, dataPath)
  return
}

export const readWithSchema = makeAsyncThrowable(readWithSchemaAsResult)

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
  await wrapper.writeDataTo(serializedData, dataPath)
  return
}
