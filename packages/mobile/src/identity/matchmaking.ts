import { PNPUtils } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/utils/phone-number-lookup/phone-number-identifier'
import DeviceInfo from 'react-native-device-info'
import { call, put } from 'redux-saga/effects'
import { ErrorMessages } from 'src/app/ErrorMessages'
import networkConfig from 'src/geth/networkConfig'
import { addContactsMatches } from 'src/identity/actions'
import { getUserSelfPhoneHashDetails } from 'src/identity/privateHashing'
import { ContactMatches } from 'src/identity/types'
import { NumberToRecipient } from 'src/recipients/recipient'
import Logger from 'src/utils/Logger'
import { getAuthSignerForAccount } from 'src/web3/dataEncryptionKey'
import { getConnectedUnlockedAccount } from 'src/web3/saga'

const TAG = 'identity/matchmaking'

// Uses the phone number privacy service to find mutual matches between Celo users
export function* fetchContactMatches(e164NumberToRecipients: NumberToRecipient) {
  const account: string = yield call(getConnectedUnlockedAccount)
  Logger.debug(TAG, 'Starting contact matchmaking')
  const selfPhoneDetails: PhoneNumberHashDetails | undefined = yield call(
    getUserSelfPhoneHashDetails
  )

  if (!selfPhoneDetails) {
    Logger.warn(TAG, 'User must be verified with cached phone hash details')
    return
  }

  const authSigner = yield call(getAuthSignerForAccount, account)

  try {
    const matchedE164Number: string[] = yield call(
      PNPUtils.Matchmaking.getContactMatches,
      selfPhoneDetails.e164Number,
      Object.keys(e164NumberToRecipients),
      account,
      selfPhoneDetails.phoneHash,
      authSigner,
      networkConfig,
      DeviceInfo.getVersion()
    )

    const matches = getMatchedContacts(e164NumberToRecipients, matchedE164Number)
    yield put(addContactsMatches(matches))
  } catch (error) {
    if (error.message === ErrorMessages.PGPNP_QUOTA_ERROR) {
      throw new Error(ErrorMessages.MATCHMAKING_QUOTA_EXCEEDED)
    }
    throw error
  }
}

function getMatchedContacts(
  e164NumberToRecipients: NumberToRecipient,
  matchedE164Number: string[]
) {
  const matches: ContactMatches = {}
  for (const e164Number of matchedE164Number) {
    const recipient = e164NumberToRecipients[e164Number]
    if (!recipient) {
      throw new Error('Recipient missing in recipient map, should never happen')
    }

    matches[e164Number] = { contactId: recipient.contactId }
  }
  return matches
}
