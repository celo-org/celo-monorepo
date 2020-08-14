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
import OffchainDataWrapper from '../offchain-data-wrapper'

export class SingleSchema<T> {
  constructor(
    readonly wrapper: OffchainDataWrapper,
    readonly type: t.Type<T>,
    readonly dataPath: string
  ) {}

  async read(account: string) {
    return readWithSchema(this.wrapper, this.type, account, this.dataPath)
  }

  async write(data: T) {
    return writeWithSchema(this.wrapper, this.type, this.dataPath, data)
  }

  async writeEncrypted(data: T, pubKeys: string[], decryptionKey?: string | undefined) {
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
  basePath = '/others'
  constructor(readonly wrapper: OffchainDataWrapper) {}

  async read(account: Address, self: Address) {
    return readWithSchema(
      this.wrapper,
      EncryptionKeysSchema,
      account,
      this.basePath + '/' + self + '/encryptionKeys'
    )
  }

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
  const encryptionKeys = await encryptionKeysAccessor.read(account, wrapper.self)

  // The decryption key is under the encryptionKeys path
  if (encryptionKeys && encryptionKeys.keys[encryptionWrappedData.publicKey]) {
    wrapper.kit.addAccount(encryptionKeys.keys[encryptionWrappedData.publicKey].privateKey)
    return true
  }

  return false
}

export const readWithSchema = async <T>(
  wrapper: OffchainDataWrapper,
  type: t.Type<T>,
  account: Address,
  dataPath: string
) => {
  const data = await wrapper.readDataFrom(account, dataPath)
  if (data === undefined) {
    return
  }

  const asJson = JSON.parse(data)
  const parseResult = type.decode(asJson)

  if (isRight(parseResult)) {
    return parseResult.right
  }

  const parseResultAsCiphertext = EncryptionWrappedData.decode(asJson)
  if (isLeft(parseResultAsCiphertext)) {
    return undefined
  }

  const pubKey = parseResultAsCiphertext.right.publicKey
  const pubKeyAddress = publicKeyToAddress(pubKey)
  const wallet = wrapper.kit.getWallet()

  const gotDecryptionKey = await getDecryptionKey(wrapper, account, parseResultAsCiphertext.right)

  if (gotDecryptionKey) {
    const decryptedCiphertext = await wallet.decrypt(
      pubKeyAddress,
      Buffer.from(parseResultAsCiphertext.right.ciphertext, 'hex')
    )

    const parseResultViaCiphertext = type.decode(JSON.parse(decryptedCiphertext.toString()))

    if (isLeft(parseResultViaCiphertext)) {
      return undefined
    }

    return parseResultViaCiphertext.right
  }

  return undefined
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
  const decryptionKeyPub = privateKeyToPublicKey(decryptionKey)

  const stringifiedPayload = JSON.stringify(data)

  const encryptedKeyMapping: Record<string, string> = {}
  pubKeys.forEach(
    (pubKey) =>
      (encryptedKeyMapping[pubKey] = Encrypt(
        Buffer.from(trimLeading0x(pubKey), 'hex'),
        Buffer.from(trimLeading0x(decryptionKey!), 'hex')
      ).toString('hex'))
  )

  const encryptedPayload: EncryptionWrappedDataType = {
    publicKey: decryptionKeyPub,
    ciphertext: Encrypt(
      Buffer.from(trimLeading0x(decryptionKeyPub), 'hex'),
      Buffer.from(stringifiedPayload)
    ).toString('hex'),
    encryptedKey: encryptedKeyMapping,
  }

  const serializedData = JSON.stringify(encryptedPayload)
  await wrapper.writeDataTo(serializedData, dataPath)
  return
}

export const writeWithSchema = async <T>(
  wrapper: OffchainDataWrapper,
  type: t.Type<T>,
  dataPath: string,
  data: T
) => {
  if (!type.is(data)) {
    return
  }
  const serializedData = JSON.stringify(data)
  await wrapper.writeDataTo(serializedData, dataPath)
  return
}
