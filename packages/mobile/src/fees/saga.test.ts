import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { estimateFee, feeEstimated, FeeType } from 'src/fees/actions'
import { watchEstimateFee } from 'src/fees/saga'
import { getInvitationVerificationFee } from 'src/invite/saga'

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
      .provide([[call(getInvitationVerificationFee), '42']])
      .put(feeEstimated(FeeType.INVITE, '42'))
      .silentRun()
  })
})
