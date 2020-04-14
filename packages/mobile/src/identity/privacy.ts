import { getPhoneHash, isE164Number } from '@celo/utils/src/phoneNumbers'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { PHONE_NUM_PRIVACY_SERVICE } from 'src/config'
import Logger from 'src/utils/Logger'

const TAG = 'identity/privacy'

export async function getPhoneHashPrivate(e164Number: string) {
  const salt = await getPhoneNumberSalt(e164Number)
  return getPhoneHash(e164Number, salt)
}

async function getPhoneNumberSalt(e164Number: string) {
  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Getting phone number salt')

  if (!isE164Number(e164Number)) {
    throw new Error(ErrorMessages.INVALID_PHONE_NUMBER)
  }

  // TODO blind the number
  const blindPhoneNumber = e164Number

  const res = await fetch(PHONE_NUM_PRIVACY_SERVICE, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blindPhoneNumber,
    }),
  })

  if (!res.ok) {
    handleGetSaltFailure(res)
    return false
  }

  Logger.debug(`${TAG}@getPhoneNumberSalt`, 'Response ok. Parsing.')
  const parsedRes = await res.json()

  // TODO extract out the val
  return parsedRes

  // } catch (error) {
  //   Logger.error(TAG, 'Error getting phone salt', error)
  //   throw new Error(ErrorMessages.SALT_FETCH_FAILURE)
  // }
}

function handleGetSaltFailure(res: Response) {
  Logger.error(`${TAG}@getPhoneNumberSalt`, `Response not okay. Status ${res.status}`)
  switch (res.status) {
    case 401:
      throw new Error(ErrorMessages.SALT_QUOTA_EXCEEDED)
    default:
      throw new Error(ErrorMessages.SALT_FETCH_FAILURE)
  }
}
