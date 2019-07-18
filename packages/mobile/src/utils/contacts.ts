import { getMinimal, MinimalContact } from 'react-native-contacts'
import { requestContactsPermission } from 'src/utils/androidPermissions'
import Logger from 'src/utils/Logger'

const TAG = 'utils/contacts'

export async function getAllContacts(): Promise<MinimalContact[] | null> {
  const contactPermissionsGiven = await requestContactsPermission()
  if (!contactPermissionsGiven) {
    Logger.warn(TAG, 'Permissions not give for retrieving contacts')
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
