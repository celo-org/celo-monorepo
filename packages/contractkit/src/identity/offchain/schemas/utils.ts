import { Err, Ok, parseJsonAsResult, Result, trimLeading0x } from '@celo/base/src'
import { publicKeyToAddress } from '@celo/utils/lib/address'
import { Encrypt } from '@celo/utils/lib/ecies'
import { EIP712Object, EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { trimPublicKeyPrefix } from '@celo/utils/src/ecdh'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'
import { keccak256 } from 'ethereumjs-util'
import { isLeft } from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { join, normalize } from 'path'
import OffchainDataWrapper, { OffchainErrorTypes } from '../../offchain-data-wrapper'
import {
  InvalidDataError,
  InvalidKey,
  OffchainError,
  SchemaErrors,
  SchemaErrorTypes,
  UnavailableKey,
} from './errors'

const KEY_LENGTH = 16
const IV_LENGTH = 16

// label = PRF(ECDH(A, B), A || B || data path)
// ciphertext path = "/cosmetic path/" || base64(label)
function getCiphertextLabel(
  path: string,
  sharedSecret: Buffer,
  senderPublicKey: string,
  receiverPublicKey: string
) {
  const senderPublicKeyBuffer = Buffer.from(trimLeading0x(senderPublicKey), 'hex')
  const receiverPublicKeyBuffer = Buffer.from(trimLeading0x(receiverPublicKey), 'hex')

  const label = createHmac('blake2s256', sharedSecret)
    .update(Buffer.concat([senderPublicKeyBuffer, receiverPublicKeyBuffer, Buffer.from(path)]))
    .digest('base64')
  return normalize(join('ciphertexts', label))
}

// Assumes that the wallet has the dataEncryptionKey of wrapper.self available
// TODO: Should check and throw a more meaningful error if not
export const writeEncrypted = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  data: Buffer,
  toAddress: string
): Promise<void | Error> => {
  const accounts = await wrapper.kit.contracts.getAccounts()
  const [fromPubKey, toPubKey] = await Promise.all([
    accounts.getDataEncryptionKey(wrapper.self),
    accounts.getDataEncryptionKey(toAddress),
  ])
  const wallet = wrapper.kit.getWallet()
  const sharedSecret = await wallet.computeSharedSecret(publicKeyToAddress(fromPubKey), toPubKey)

  const computedDataPath = getCiphertextLabel(dataPath, sharedSecret, fromPubKey, toPubKey)
  const encryptedData = Encrypt(
    Buffer.from(trimPublicKeyPrefix(toPubKey), 'hex'),
    Buffer.from(data)
  )

  const signature = await signBuffer(wrapper, computedDataPath, encryptedData)
  return wrapper.writeDataTo(encryptedData, signature, computedDataPath)
}

// if explicitly passing in a symmetric key, use that.
// else check for existing key
// otherwise generate new one
async function fetchOrGenerateKey(
  wrapper: OffchainDataWrapper,
  dataPath: string,
  symmetricKey?: Buffer
) {
  if (symmetricKey) {
    return Ok(symmetricKey)
  }

  const existingKey = await readEncrypted(wrapper, dataPath, wrapper.self)
  if (existingKey.ok) {
    return Ok(existingKey.result)
  }

  if (
    existingKey.error.errorType === SchemaErrorTypes.OffchainError &&
    existingKey.error.error.errorType === OffchainErrorTypes.NoStorageRootProvidedData
  ) {
    return Ok(randomBytes(16))
  }

  return Err(existingKey.error)
}

export const writeEncryptedWithSymmetric = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  data: Buffer,
  toAddresses: string[],
  symmetricKey?: Buffer
) => {
  const fetchKey = await fetchOrGenerateKey(wrapper, dataPath, symmetricKey)
  if (!fetchKey.ok) {
    return fetchKey.error
  }

  //  file_ciphertext = IV || E(message key, IV, data)
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-128-ctr', fetchKey.result, iv)
  const payload = Buffer.concat([iv, cipher.update(data), cipher.final()])

  const signature = await signBuffer(wrapper, `${dataPath}.enc`, payload)
  await wrapper.writeDataTo(payload, signature, `${dataPath}.enc`)

  await Promise.all(
    // here we encrypt the key to ourselves so we can retrieve it later
    [wrapper.self, ...toAddresses].map(async (toAddress) =>
      writeEncrypted(wrapper, dataPath, fetchKey.result, toAddress)
    )
  )
}

export const readEncrypted = async (
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
    return Err(new UnavailableKey(senderAddress))
  }
  const readerPublicKeyAddress = publicKeyToAddress(readerPubKey)

  if (!wallet.hasAccount(readerPublicKeyAddress)) {
    return Err(new UnavailableKey(readerPublicKeyAddress))
  }

  const sharedSecret = await wallet.computeSharedSecret(readerPublicKeyAddress, senderPubKey)

  const computedDataPath = getCiphertextLabel(dataPath, sharedSecret, senderPubKey, readerPubKey)
  const encryptedPayload = await wrapper.readDataFromAsResult(
    senderAddress,
    (buf) => buildEIP712TypedData(wrapper, computedDataPath, buf),
    computedDataPath
  )

  if (!encryptedPayload.ok) {
    return Err(new OffchainError(encryptedPayload.error))
  }

  const payload = await wallet.decrypt(readerPublicKeyAddress, encryptedPayload.result)
  return Ok(payload)
}

export const resolveEncrypted = async (
  wrapper: OffchainDataWrapper,
  dataPath: string,
  senderAddress: string
): Promise<Result<Buffer, SchemaErrors>> => {
  const encryptedPayloadPath = `${dataPath}.enc`
  const [encryptedPayload, keyOrPayload] = await Promise.all([
    wrapper.readDataFromAsResult(
      senderAddress,
      (buf) => buildEIP712TypedData(wrapper, encryptedPayloadPath, buf),
      encryptedPayloadPath
    ),
    readEncrypted(wrapper, dataPath, senderAddress),
  ])

  if (!keyOrPayload.ok) {
    return Err(keyOrPayload.error)
  }

  if (encryptedPayload.ok && keyOrPayload.ok) {
    const key = keyOrPayload.result
    if (key.length !== KEY_LENGTH) {
      return Err(new InvalidKey())
    }

    const payload = encryptedPayload.result
    const iv = payload.slice(0, IV_LENGTH)
    const encryptedData = payload.slice(IV_LENGTH)
    const decipher = createDecipheriv('aes-128-ctr', key, iv)

    return Ok(Buffer.concat([decipher.update(encryptedData), decipher.final()]))
  }

  return keyOrPayload
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

export const buildEIP712TypedData = async <DataType>(
  wrapper: OffchainDataWrapper,
  path: string,
  data: DataType | Buffer,
  type?: t.Type<DataType>
): Promise<EIP712TypedData> => {
  const chainId = await wrapper.kit.web3.eth.getChainId()
  const EIP712Domain = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
  ]

  let types = {}
  let message = {}
  if (Buffer.isBuffer(data)) {
    types = {
      ClaimWithPath: [
        { name: 'path', type: 'string' },
        { name: 'hash', type: 'string' },
      ],
    }
    message = {
      hash: keccak256(data).toString('hex'),
    }
  } else {
    const Claim = buildEIP712Schema(type!)
    types = {
      Claim,
      ClaimWithPath: [
        { name: 'path', type: 'string' },
        { name: 'payload', type: 'Claim' },
      ],
    }
    message = {
      payload: (data as unknown) as EIP712Object,
    }
  }

  return {
    types: {
      EIP712Domain,
      ...types,
    },
    domain: {
      name: 'CIP8 Claim',
      version: '1.0.0',
      chainId,
    },
    primaryType: 'ClaimWithPath',
    message: {
      path,
      ...message,
    },
  }
}

export type EIP712Schema = Array<{ name: string; type: string }>

export const signBuffer = async (wrapper: OffchainDataWrapper, dataPath: string, buf: Buffer) => {
  const typedData = await buildEIP712TypedData(wrapper, dataPath, buf)
  return wrapper.kit.getWallet().signTypedData(wrapper.signer, typedData)
}

const ioTsToSolidityTypeMapping: { [x: string]: string } = {
  [t.string._tag]: 'string',
  [t.number._tag]: 'uint256',
  [t.boolean._tag]: 'bool',
}

export const buildEIP712Schema = <DataType>(type: t.Type<DataType>): EIP712Schema => {
  // @ts-ignore
  const shape = type.props
  // @ts-ignore
  return Object.entries(shape).reduce((accum, [key, value]) => {
    // @ts-ignore
    return [
      ...accum,
      {
        name: key,
        // @ts-ignore
        type: ioTsToSolidityTypeMapping[value._tag] || 'string',
      },
    ]
  }, [])
}
