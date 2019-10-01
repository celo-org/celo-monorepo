import { IdentityUtils as IdentityUtilsJS } from '@celo/utils/'
import { scrypt as RNscrypt } from 'react-native-fast-crypto'

async function _calculateHashRN(identifier: string) {
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

function identityHash(
  identifier: string,
  type: string = IdentityUtilsJS.IdentifierTypeEnum.PHONE_NUMBER
): Promise<string> {
  if (!identifier) {
    throw Error('Attempting to hash an empty identifier')
  }
  const modifiedIdentifier = IdentityUtilsJS.preprocessPrefix(identifier, type)
  return _calculateHashRN(modifiedIdentifier)
}

const IdentifierTypeEnum = IdentityUtilsJS.IdentifierTypeEnum

export const IdentityUtils = {
  identityHash,
  IdentifierTypeEnum,
}
