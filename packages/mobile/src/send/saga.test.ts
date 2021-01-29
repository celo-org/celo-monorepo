import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { showError, showMessage } from 'src/alert/actions'
import { SendOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { validateRecipientAddressSuccess } from 'src/identity/actions'
import {
  addressToDisplayNameSelector,
  addressToE164NumberSelector,
  e164NumberToAddressSelector,
  E164NumberToAddressType,
} from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { urlFromUriData } from 'src/qrcode/schema'
import { BarcodeTypes } from 'src/qrcode/utils'
import { phoneRecipientCacheSelector, valoraRecipientCacheSelector } from 'src/recipients/reducer'
import {
  Actions,
  HandleBarcodeDetectedAction,
  QrCode,
  SendPaymentOrInviteAction,
} from 'src/send/actions'
import { sendPaymentOrInviteSaga, watchQrCodeDetections } from 'src/send/saga'
import { getConnectedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'
import {
  mockAccount,
  mockAccount2Invite,
  mockAccountInvite,
  mockE164Number,
  mockE164NumberInvite,
  mockName,
  mockQrCodeData,
  mockQrCodeData2,
  mockQRCodeRecipient,
  mockTransactionData,
} from 'test/values'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

const mockE164NumberToAddress: E164NumberToAddressType = {
  [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
}

describe(watchQrCodeDetections, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to the send amount screen with a valid qr code', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData) }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(phoneRecipientCacheSelector), {}],
        [select(valoraRecipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
        [select(addressToDisplayNameSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        name: mockName,
        e164PhoneNumber: mockE164Number,
        contactId: undefined,
        thumbnailPath: undefined,
      },
    })
  })

  it('navigates to the send amount screen with a qr code with an empty display name', async () => {
    const data: QrCode = {
      type: BarcodeTypes.QR_CODE,
      data: urlFromUriData({
        address: mockQrCodeData.address,
        e164PhoneNumber: mockQrCodeData.e164PhoneNumber,
      }),
    }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(phoneRecipientCacheSelector), {}],
        [select(valoraRecipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
        [select(addressToDisplayNameSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        name: 'anonymous',
        e164PhoneNumber: mockE164Number,
        contactId: undefined,
        thumbnailPath: undefined,
      },
    })
  })

  it('navigates to the send amount screen with a qr code with an empty phone number', async () => {
    const data: QrCode = {
      type: BarcodeTypes.QR_CODE,
      data: urlFromUriData({
        address: mockQrCodeData.address,
        name: mockQrCodeData.displayName,
      }),
    }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(phoneRecipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
        [select(addressToDisplayNameSelector), {}],
        [select(valoraRecipientCacheSelector)],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      origin: SendOrigin.AppSendFlow,
      isFromScan: true,
      recipient: {
        address: mockAccount.toLowerCase(),
        name: mockName,
        displayNumber: undefined,
        e164PhoneNumber: undefined,
        contactId: undefined,
        thumbnailPath: undefined,
      },
    })
  })

  it('displays an error when scanning an invalid qr code', async () => {
    const INVALID_QR = 'not-json'
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: INVALID_QR }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(phoneRecipientCacheSelector), {}],
        [select(valoraRecipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
        [select(addressToDisplayNameSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('displays an error when scanning a qr code with an invalid address', async () => {
    const INVALID_QR_ADDRESS = {
      address: 'not-an-address',
      e164PhoneNumber: '+>19999907599',
      displayName: 'Joe',
    }
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(INVALID_QR_ADDRESS) }

    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(phoneRecipientCacheSelector), {}],
        [select(valoraRecipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), {}],
        [select(addressToDisplayNameSelector), {}],
      ])
      .dispatch({ type: Actions.BARCODE_DETECTED, data })
      .put(showError(ErrorMessages.QR_FAILED_INVALID_ADDRESS))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('navigates to the send confirmation screen when secure send scan is successful for a send', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData2) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(phoneRecipientCacheSelector), {}],
        [select(valoraRecipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(addressToDisplayNameSelector), {}],
      ])
      .dispatch(qrAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccount2Invite.toLowerCase()))
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      origin: SendOrigin.AppSendFlow,
      transactionData: mockTransactionData,
      addressJustValidated: true,
    })
  })

  it('navigates to the payment request confirmation screen when secure send scan is successful for a request', async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData2) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      isOutgoingPaymentRequest: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(phoneRecipientCacheSelector), {}],
        [select(valoraRecipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(addressToDisplayNameSelector), {}],
      ])
      .dispatch(qrAction)
      .put(validateRecipientAddressSuccess(mockE164NumberInvite, mockAccount2Invite.toLowerCase()))
      .silentRun()
    expect(navigate).toHaveBeenCalledWith(Screens.PaymentRequestConfirmation, {
      transactionData: mockTransactionData,
      addressJustValidated: true,
    })
  })

  it("displays an error when QR code scanned for secure send doesn't map to the recipient", async () => {
    const data: QrCode = { type: BarcodeTypes.QR_CODE, data: urlFromUriData(mockQrCodeData) }
    const qrAction: HandleBarcodeDetectedAction = {
      type: Actions.BARCODE_DETECTED,
      data,
      scanIsForSecureSend: true,
      transactionData: mockTransactionData,
    }
    await expectSaga(watchQrCodeDetections)
      .provide([
        [select(addressToE164NumberSelector), {}],
        [select(phoneRecipientCacheSelector), {}],
        [select(valoraRecipientCacheSelector), {}],
        [select(e164NumberToAddressSelector), mockE164NumberToAddress],
        [select(addressToDisplayNameSelector), {}],
      ])
      .dispatch(qrAction)
      .put(showMessage(ErrorMessages.QR_FAILED_INVALID_RECIPIENT))
      .silentRun()
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe(sendPaymentOrInviteSaga, () => {
  it('fails if user cancels PIN input', async () => {
    const account = '0x000123'
    const sendPaymentOrInviteAction: SendPaymentOrInviteAction = {
      type: Actions.SEND_PAYMENT_OR_INVITE,
      amount: new BigNumber(10),
      comment: '',
      recipient: mockQRCodeRecipient,
      firebasePendingRequestUid: null,
      fromModal: false,
    }
    await expectSaga(sendPaymentOrInviteSaga, sendPaymentOrInviteAction)
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })
})
