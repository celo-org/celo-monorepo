import { IdentityUtils as IdentityUtilsJS } from '@celo/utils/'
import { scrypt as RNscrypt, scryptBulk as RNscryptBulk } from 'react-native-fast-crypto'

enum IdentifierTypeEnum {
  PHONE_NUMBER = 'phone_number',
}

async function calculateHashRN(identifier: string) {
  const result = await RNscrypt(
    Buffer.from(identifier.normalize('NFKC')),
    Buffer.from(IdentityUtilsJS.SCRYPT_PARAMS.salt.normalize('NFKC')),
    IdentityUtilsJS.SCRYPT_PARAMS.N,
    IdentityUtilsJS.SCRYPT_PARAMS.r,
    IdentityUtilsJS.SCRYPT_PARAMS.p,
    IdentityUtilsJS.SCRYPT_PARAMS.dkLen
  )
  let hexHash = ''
  for (const item of result) {
    hexHash += item.toString(16)
  }
  return '0x' + hexHash.padStart(64, '0')
}

async function calculateHashRNBulk(identifierList: string[]) {
  const identifierListBuffer = identifierList.map((identifier) =>
    Buffer.from(identifier.normalize('NFKC'))
  )
  const result = await RNscryptBulk(
    identifierListBuffer,
    Buffer.from(IdentityUtilsJS.SCRYPT_PARAMS.salt.normalize('NFKC')),
    IdentityUtilsJS.SCRYPT_PARAMS.N,
    IdentityUtilsJS.SCRYPT_PARAMS.r,
    IdentityUtilsJS.SCRYPT_PARAMS.p,
    IdentityUtilsJS.SCRYPT_PARAMS.dkLen
  )
  let hexHash = ''
  const hashList = new Array(identifierList.length)
  for (let index = 0; index < result.length; index++) {
    const item = result[index]
    let itemArray = item
    if (typeof item === 'object') {
      itemArray = Object.values(item)
    }
    for (const hash of itemArray) {
      hexHash += hash.toString(16)
    }
    hashList[index] = '0x' + hexHash.padStart(64, '0')
    hexHash = ''
  }
  return hashList
}

function identityHash(
  identifier: string,
  type: IdentifierTypeEnum = IdentifierTypeEnum.PHONE_NUMBER
): Promise<string> {
  if (!identifier) {
    throw Error('Attempting to hash an empty identifier')
  }
  const modifiedIdentifier = IdentityUtilsJS.preprocessPrefix(identifier, type)
  return calculateHashRN(modifiedIdentifier)
}

function identityHashBulk(
  identifierList: string[],
  type: IdentifierTypeEnum = IdentifierTypeEnum.PHONE_NUMBER
): Promise<string[]> {
  if (identifierList.length == 0) {
    throw Error('Attempting to hash empty identifier list')
  }
  const modifiedIdentifierList = IdentityUtilsJS.preprocessPrefixBulk(identifierList, type)
  return calculateHashRNBulk(modifiedIdentifierList)
}

export const IdentityUtils = {
  identityHash,
  IdentifierTypeEnum,
  identityHashBulk,
}
