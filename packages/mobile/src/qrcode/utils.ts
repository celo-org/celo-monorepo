import { isValidAddress } from '@celo/utils/src/address'
import { isEmpty } from 'lodash'
import * as RNFS from 'react-native-fs'
import Share from 'react-native-share'
import { call, put } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { validateRecipientAddressSuccess } from 'src/identity/actions'
import { AddressToE164NumberType, E164NumberToAddressType } from 'src/identity/reducer'
import { replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  getRecipientFromAddress,
  NumberToRecipient,
  Recipient,
  RecipientKind,
} from 'src/recipients/recipient'
import { QrCode, storeLatestInRecents, SVG } from 'src/send/actions'
import { TransactionDataInput } from 'src/send/SendAmount'
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

function* handleSecureSend(
  data: { address: string; e164PhoneNumber: string; displayName: string },
  e164NumberToAddress: E164NumberToAddressType,
  secureSendTxData: TransactionDataInput,
  requesterAddress?: string
) {
  if (!secureSendTxData.recipient.e164PhoneNumber) {
    throw Error(`Invalid recipient type for Secure Send: ${secureSendTxData.recipient.kind}`)
  }

  const userScannedAddress = data.address.toLowerCase()
  const { e164PhoneNumber } = secureSendTxData.recipient
  const possibleReceivingAddresses = e164NumberToAddress[e164PhoneNumber]
  // This should never happen. Secure Send is triggered when there are
  // multiple addresses for a given phone number
  if (!possibleReceivingAddresses) {
    throw Error("No addresses associated with recipient's phone number")
  }

  // Need to add the requester address to the option set in the event
  // a request is coming from an unverified account
  if (requesterAddress && !possibleReceivingAddresses.includes(requesterAddress)) {
    possibleReceivingAddresses.push(requesterAddress)
  }
  const possibleReceivingAddressesFormatted = possibleReceivingAddresses.map((address) =>
    address.toLowerCase()
  )
  if (!possibleReceivingAddressesFormatted.includes(userScannedAddress)) {
    const error = ErrorMessages.QR_FAILED_INVALID_RECIPIENT
    ValoraAnalytics.track(SendEvents.send_secure_incorrect, {
      confirmByScan: true,
      error,
    })
    yield put(showMessage(error))
    return false
  }

  ValoraAnalytics.track(SendEvents.send_secure_complete, { confirmByScan: true })
  yield put(validateRecipientAddressSuccess(e164PhoneNumber, userScannedAddress))
  return true
}

export function* handleBarcode(
  barcode: QrCode,
  addressToE164Number: AddressToE164NumberType,
  recipientCache: NumberToRecipient,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendTxData?: TransactionDataInput,
  isOutgoingPaymentRequest?: true,
  requesterAddress?: string
) {
  let data: { address: string; e164PhoneNumber: string; displayName: string } | undefined

  try {
    data = JSON.parse(barcode.data)
  } catch (e) {
    Logger.warn(TAG, 'QR code read failed with ' + e)
  }
  if (typeof data !== 'object' || isEmpty(data.address)) {
    yield put(showMessage(ErrorMessages.QR_FAILED_NO_ADDRESS))
    return
  }
  if (!isValidAddress(data.address)) {
    yield put(showMessage(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
    return
  }

  if (secureSendTxData) {
    const success = yield call(
      handleSecureSend,
      data,
      e164NumberToAddress,
      secureSendTxData,
      requesterAddress
    )
    if (!success) {
      return
    }
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

  if (secureSendTxData && isOutgoingPaymentRequest) {
    replace(Screens.PaymentRequestConfirmation, {
      transactionData: secureSendTxData,
      addressJustValidated: true,
    })
  } else if (secureSendTxData) {
    replace(Screens.SendConfirmation, {
      transactionData: secureSendTxData,
      addressJustValidated: true,
    })
  } else {
    replace(Screens.SendAmount, { recipient, isFromScan: true, isOutgoingPaymentRequest })
  }
}
