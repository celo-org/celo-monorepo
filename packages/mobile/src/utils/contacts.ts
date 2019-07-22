import { getMinimal, MinimalContact } from 'react-native-contacts'
import { checkContactsPermission } from 'src/utils/androidPermissions'
import Logger from 'src/utils/Logger'

const TAG = 'utils/contacts'

export async function getAllContacts(): Promise<MinimalContact[] | void> {
  let contactsReturn
  checkContactsPermission().then((contactPermissionsGiven) => {
    if (!contactPermissionsGiven) {
      Logger.warn(TAG, 'Permissions not given for retrieving contacts')
      contactsReturn = null
    }

    contactsReturn = new Promise((resolve, reject) => {
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
  })

  return contactsReturn
}
