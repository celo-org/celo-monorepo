import { ensureLeading0x, privateKeyToAddress, publicKeyToAddress } from '@celo/utils/lib/address'
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
}

const EncryptedCipherText = t.type({
  publicKey: t.string,
  ciphertext: t.string,
  encryptedKey: t.record(t.string, t.string),
})

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

  const parseResultAsCiphertext = EncryptedCipherText.decode(asJson)
  if (isLeft(parseResultAsCiphertext)) {
    return undefined
  }

  const pubKey = parseResultAsCiphertext.right.publicKey
  const pubKeyAddress = publicKeyToAddress(pubKey)
  const wallet = wrapper.kit.getWallet()
  if (wallet.hasAccount(pubKeyAddress)) {
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

  const keyToDecryptDecryptionKey = Object.keys(
    parseResultAsCiphertext.right.encryptedKey
  ).find((x) => wallet.hasAccount(publicKeyToAddress(x)))

  if (keyToDecryptDecryptionKey) {
    const decryptionKeyCiphertext =
      parseResultAsCiphertext.right.encryptedKey[keyToDecryptDecryptionKey]

    const decryptionKey = await wallet.decrypt(
      publicKeyToAddress(keyToDecryptDecryptionKey),
      Buffer.from(decryptionKeyCiphertext, 'hex')
    )

    wrapper.kit.addAccount(ensureLeading0x(decryptionKey.toString('hex')))

    const actualPlaintext = await wallet.decrypt(
      privateKeyToAddress(ensureLeading0x(decryptionKey.toString('hex'))),
      Buffer.from(parseResultAsCiphertext.right.ciphertext, 'hex')
    )

    const parseResultViaCiphertext = type.decode(JSON.parse(actualPlaintext.toString()))

    if (isLeft(parseResultViaCiphertext)) {
      return undefined
    }

    return parseResultViaCiphertext.right
  }

  // TODO: We might not have the encryption key, but it might be encrypted to us

  return undefined
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
