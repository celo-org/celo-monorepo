import { isValidAddress } from '@celo/utils/src/signatureUtils'
import { isEmpty } from 'lodash'
import * as RNFS from 'react-native-fs'
import Share from 'react-native-share'
import { all, put } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { updateE164PhoneNumberAddresses } from 'src/identity/actions'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { setRecipientCache } from 'src/recipients/actions'
import {
  getRecipientFromAddress,
  NumberToRecipient,
  Recipient,
  RecipientKind,
} from 'src/recipients/recipient'
import { QrCode, storeLatestInRecents, SVG } from 'src/send/actions'
import Logger from 'src/utils/Logger'
import uuidv1 from 'uuid'

const TAG = 'QR/utils'

export enum BarcodeTypes {
  QR_CODE = 'QR_CODE',
}

const QRFileName = '/celo-qr.png'

export async function shareSVGImage(svg: SVG) {
  if (!svg) {
    return
  }
  svg.toDataURL(async (data: string) => {
    const path = RNFS.DocumentDirectoryPath + QRFileName
    try {
      await RNFS.writeFile(path, data, 'base64')
      Share.open({
        url: 'file://' + path,
        type: 'image/png',
      }).catch((err: Error) => {
        throw err
      })
    } catch (e) {
      Logger.warn(TAG, e)
    }
  })
}

export function* handleBarcode(
  barcode: QrCode,
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient
) {
  if (barcode.type !== BarcodeTypes.QR_CODE) {
    return
  }

  let data: { address: string; e164PhoneNumber: string; displayName: string } | undefined
  try {
    data = JSON.parse(barcode.data)
  } catch (e) {
    Logger.warn(TAG, 'QR code read failed with ' + e)
  }

  if (typeof data !== 'object' || isEmpty(data.address)) {
    yield put(showError(ErrorMessages.QR_FAILED_NO_ADDRESS))
    return
  }
  if (!isValidAddress(data.address)) {
    yield put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
    return
  }
  if (typeof data.e164PhoneNumber !== 'string') {
    // Default for invalid e164PhoneNumber
    data.e164PhoneNumber = ''
  }
  if (typeof data.displayName !== 'string') {
    // Default for invalid displayName
    data.displayName = ''
  }

  const cachedRecipient = getRecipientFromAddress(data.address, addressToE164Number, recipientCache)

  const recipient: Recipient = cachedRecipient
    ? {
        ...data,
        kind: RecipientKind.QrCode,
        displayId: data.e164PhoneNumber,
        phoneNumberLabel: 'QR Code',
        thumbnailPath: cachedRecipient.thumbnailPath,
        contactId: cachedRecipient.contactId,
      }
    : {
        ...data,
        kind: RecipientKind.QrCode,
        displayId: data.e164PhoneNumber,
      }

  // TODO data in the QR should be encrypted so no one can create an arbitrary QR with any phone and address combination
  // add phone number to the recipientCache
  recipientCache[data.e164PhoneNumber] = {
    ...recipient,
    kind: RecipientKind.Contact,
    contactId: recipient.contactId ? recipient.contactId : uuidv1(),
  }
  addressToE164Number[data.address] = data.e164PhoneNumber

  yield all([
    put(setRecipientCache(recipientCache)),
    put(storeLatestInRecents(recipient)),
    put(updateE164PhoneNumberAddresses({}, addressToE164Number)),
  ])

  navigate(Screens.SendAmount, { recipient })
}
