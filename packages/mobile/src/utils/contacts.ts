import { isE164Number, SCRYPT_PARAMS } from '@celo/utils/src/phoneNumbers'
import { getMinimal, MinimalContact } from 'react-native-contacts'
import { scrypt } from 'react-native-fast-crypto'
import { checkContactsPermission } from 'src/utils/androidPermissions'
import Logger from 'src/utils/Logger'

const TAG = 'utils/contacts'

export async function getAllContacts(): Promise<MinimalContact[] | null> {
  const contactPermissionsGiven = await checkContactsPermission()
  if (!contactPermissionsGiven) {
    Logger.warn(TAG, 'Permissions not given for retrieving contacts')
    return null
  }

  return new Promise((resolve, reject) => {
    getMinimal((error, contacts) => {
      if (error) {
        Logger.error(TAG, 'Error getting all contacts', error)
        reject(error)
      }

      if (!contacts) {
        Logger.error(TAG, 'Contacts is null')
        reject('Contacts is null')
      }

      resolve(contacts)
    })
  })
}

export async function getPhoneHashRN(phoneNumber: string) {
  if (!phoneNumber || !isE164Number(phoneNumber)) {
    throw Error('Attempting to hash a non-e164 number: ' + phoneNumber)
  }

  const result = await scrypt(
    Buffer.from(phoneNumber.normalize('NFKC')),
    Buffer.from(SCRYPT_PARAMS.salt.normalize('NFKC')),
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    SCRYPT_PARAMS.dkLen
  )

  let hexHash = ''
  for (const item of result) {
    hexHash += item.toString(16)
  }
  return '0x' + hexHash.padStart(64, '0')
}
