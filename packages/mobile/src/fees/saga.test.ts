import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { estimateFee, feeEstimated, FeeType } from 'src/fees/actions'
import { watchEstimateFee } from 'src/fees/saga'
import { getInvitationVerificationFee } from 'src/invite/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { mockAccount } from 'test/values'

describe(watchEstimateFee, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('updates the default invite fee', async () => {
    await expectSaga(watchEstimateFee)
      .dispatch(estimateFee(FeeType.INVITE))
      .provide([
        [select(currentAccountSelector), mockAccount],
        [call(getInvitationVerificationFee), '42'],
      ])
      .put(feeEstimated(FeeType.INVITE, '42'))
      .silentRun()
  })
})
