import { Platform } from 'react-native'
import { getAll, getMinimal, MinimalContact } from 'react-native-contacts'
import Logger from 'src/utils/Logger'
import { checkContactsPermission } from 'src/utils/permissions'

const TAG = 'utils/contacts'

// Stop gap solution since getMinimal is not yet implement on iOS
function customGetAll(callback: (error: any, contacts: MinimalContact[]) => void) {
  getAll((error, fullContacts) => {
    if (error) {
      callback(error, [])
      return
    }

    const minimalContacts = fullContacts
      .map(
        ({
          recordID,
          givenName,
          middleName,
          familyName,
          company,
          phoneNumbers,
          thumbnailPath,
        }): MinimalContact => ({
          recordID,
          displayName: [givenName, middleName, familyName].filter(Boolean).join(' ') || company,
          phoneNumbers,
          thumbnailPath,
        })
      )
      // some contacts are only email and number
      .filter((minimalContact) => !!minimalContact.displayName)

    callback(null, minimalContacts)
  })
}

export async function getAllContacts(): Promise<MinimalContact[] | null> {
  const contactPermissionsGiven = await checkContactsPermission()
  if (!contactPermissionsGiven) {
    Logger.warn(TAG, 'Permissions not given for retrieving contacts')
    return null
  }

  const getMethod = Platform.OS === 'android' ? getMinimal : customGetAll

  return new Promise((resolve, reject) => {
    getMethod((error, contacts) => {
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
