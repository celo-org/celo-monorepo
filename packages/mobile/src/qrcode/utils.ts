import { isValidAddress } from '@celo/utils/src/address'
import { isEmpty } from 'lodash'
import * as RNFS from 'react-native-fs'
import Share from 'react-native-share'
import { put } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import { replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  getRecipientFromAddress,
  NumberToRecipient,
  Recipient,
  RecipientKind,
} from 'src/recipients/recipient'
import {
  QrCode,
  storeLatestInRecents,
  SVG,
  validateRecipientAddressSuccess,
} from 'src/send/actions'
import { TransactionData } from 'src/send/SendAmount'
import Logger from 'src/utils/Logger'

export enum BarcodeTypes {
  QR_CODE = 'QR_CODE',
}

const TAG = 'QR/utils'

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
  recipientCache: NumberToRecipient,
  e164NumberToAddress: E164NumberToAddressType,
  scanIsForSecureSend?: true,
  transactionData?: TransactionData
) {
  let data: { address: string; e164PhoneNumber: string; displayName: string } | undefined

  try {
    data = JSON.parse(barcode.data)
  } catch (e) {
    Logger.warn(TAG, 'QR code read failed with ' + e)
  }
  if (typeof data !== 'object' || isEmpty(data.address)) {
    // yield put(showError(ErrorMessages.QR_FAILED_NO_ADDRESS))
    yield put(showError(ErrorMessages.QR_FAILED_INVALID_RECIPIENT))
    return
  }
  if (!isValidAddress(data.address)) {
    yield put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
    return
  }
  try {
    if (scanIsForSecureSend) {
      if (!transactionData) {
        throw Error(
          'Error passing through data: Transaction and recipient information not received'
        )
      }

      const targetAddress = data.address
      const { e164PhoneNumber } = transactionData.recipient
      if (!e164PhoneNumber) {
        throw Error('Error passing through data: Phone number not part of recipient data')
      }

      // Typically use 'getAddressFromPhoneNumber' but need all the possible addresses when doing secure send validation
      const possibleRecievingAddresses = e164NumberToAddress[e164PhoneNumber]
      if (!possibleRecievingAddresses) {
        yield put(showError(ErrorMessages.QR_FAILED_NO_PHONE_NUMBER))
        return
      }

      if (!possibleRecievingAddresses.includes(targetAddress)) {
        yield put(showError(ErrorMessages.QR_FAILED_INVALID_RECIPIENT))
        return
      }

      yield put(validateRecipientAddressSuccess(e164PhoneNumber, targetAddress))
    }
  } catch (error) {
    Logger.error(TAG + '@handleBarcode', `Error with secure send validation: `, error)
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
  yield put(storeLatestInRecents(recipient))

  if (scanIsForSecureSend) {
    replace(Screens.SendConfirmation, { transactionData })
  } else {
    replace(Screens.SendAmount, { recipient })
  }
}
