import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { SendOrigin } from 'src/analytics/types'
import { TokenTransactionType } from 'src/apollo/types'
import { activeScreenChanged } from 'src/app/actions'
import { bidaliPaymentRequested } from 'src/fiatExchanges/actions'
import { watchBidaliPaymentRequests } from 'src/fiatExchanges/saga'
import { Actions as IdentityActions, updateKnownAddresses } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AddressRecipient } from 'src/recipients/recipient'
import {
  sendPaymentOrInvite,
  sendPaymentOrInviteFailure,
  sendPaymentOrInviteSuccess,
} from 'src/send/actions'

const now = Date.now()
Date.now = jest.fn(() => now)

describe(watchBidaliPaymentRequests, () => {
  const amount = new BigNumber(20)
  const recipient: AddressRecipient = {
    address: '0xTEST',
    name: 'Bidali',
    thumbnailPath:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fbidali.png?alt=media',
  }

  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('triggers the payment flow and calls `onPaymentSent` when successful', async () => {
    const onPaymentSent = jest.fn()
    const onCancelled = jest.fn()

    await expectSaga(watchBidaliPaymentRequests)
      .put(
        updateKnownAddresses({
          '0xTEST': { name: recipient.name!, imageUrl: recipient.thumbnailPath || null },
        })
      )
      .dispatch(
        bidaliPaymentRequested(
          '0xTEST',
          '20',
          'cUSD',
          'Some description',
          'TEST_CHARGE_ID',
          onPaymentSent,
          onCancelled
        )
      )
      .dispatch(
        sendPaymentOrInvite(
          amount,
          'Some description (TEST_CHARGE_ID)',
          recipient,
          '0xTEST',
          undefined,
          undefined,
          true
        )
      )
      .dispatch(sendPaymentOrInviteSuccess(amount))
      .run()

    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationModal, {
      origin: SendOrigin.Bidali,
      transactionData: {
        amount,
        reason: 'Some description (TEST_CHARGE_ID)',
        recipient,
        type: TokenTransactionType.PayPrefill,
      },
    })
    expect(onPaymentSent).toHaveBeenCalledTimes(1)
    expect(onCancelled).not.toHaveBeenCalled()
  })

  it('triggers the payment flow and calls `onCancelled` when navigating back to the Bidali screen after a failure', async () => {
    const onPaymentSent = jest.fn()
    const onCancelled = jest.fn()

    await expectSaga(watchBidaliPaymentRequests)
      .not.put.actionType(IdentityActions.UPDATE_KNOWN_ADDRESSES)
      .dispatch(
        bidaliPaymentRequested(
          '0xTEST',
          '20',
          'cUSD',
          'Some description',
          'TEST_CHARGE_ID',
          onPaymentSent,
          onCancelled
        )
      )
      .dispatch(
        sendPaymentOrInvite(
          amount,
          'Some description (TEST_CHARGE_ID)',
          recipient,
          '0xTEST',
          undefined,
          undefined,
          true
        )
      )
      .dispatch(sendPaymentOrInviteFailure())
      .dispatch(activeScreenChanged(Screens.BidaliScreen))
      .run()

    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationModal, {
      origin: SendOrigin.Bidali,
      transactionData: {
        amount,
        reason: 'Some description (TEST_CHARGE_ID)',
        recipient,
        type: TokenTransactionType.PayPrefill,
      },
    })
    expect(onPaymentSent).not.toHaveBeenCalled()
    expect(onCancelled).toHaveBeenCalled()
  })

  it('throws an error when passing an unsupported currency', async () => {
    const onPaymentSent = jest.fn()
    const onCancelled = jest.fn()

    await expect(
      expectSaga(watchBidaliPaymentRequests)
        .dispatch(
          bidaliPaymentRequested(
            '0xTEST',
            '20',
            'CELO',
            'Some description',
            'TEST_CHARGE_ID',
            onPaymentSent,
            onCancelled
          )
        )
        .run()
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"Unsupported payment currency from Bidali: CELO"`)

    expect(navigate).not.toHaveBeenCalled()
    expect(onPaymentSent).not.toHaveBeenCalled()
    expect(onCancelled).not.toHaveBeenCalled()
  })
})
