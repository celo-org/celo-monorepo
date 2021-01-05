import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  EscrowReclaimPaymentAction,
  EscrowTransferPaymentAction,
} from 'src/escrow/actions'
import { reclaimFromEscrow, transferToEscrow } from 'src/escrow/saga'
import { newTransactionContext } from 'src/transactions/types'
import { getConnectedAccount, unlockAccount, UnlockResult } from 'src/web3/saga'
import { mockAccount, mockE164Number, mockE164NumberHash, mockE164NumberPepper } from 'test/values'

describe(transferToEscrow, () => {
  it('fails if user cancels PIN input', async () => {
    const phoneHashDetails: PhoneNumberHashDetails = {
      e164Number: mockE164Number,
      phoneHash: mockE164NumberHash,
      pepper: mockE164NumberPepper,
    }
    const escrowTransferAction: EscrowTransferPaymentAction = {
      type: Actions.TRANSFER_PAYMENT,
      phoneHashDetails,
      amount: new BigNumber(10),
      context: newTransactionContext('Escrow', 'Transfer'),
    }
    await expectSaga(transferToEscrow, escrowTransferAction)
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })
})

describe(reclaimFromEscrow, () => {
  it('fails if user cancels PIN input', async () => {
    const reclaimEscrowAction: EscrowReclaimPaymentAction = {
      type: Actions.RECLAIM_PAYMENT,
      paymentID: 'Payment ID',
    }
    await expectSaga(reclaimFromEscrow, reclaimEscrowAction)
      .provide([
        [call(getConnectedAccount), mockAccount],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })
})
