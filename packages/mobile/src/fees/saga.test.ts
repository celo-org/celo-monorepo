import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { defaultFeeUpdated, FeeType, updateDefaultFee } from 'src/fees/actions'
import { watchUpdateDefaultFee } from 'src/fees/saga'
import { getInvitationVerificationFee } from 'src/invite/saga'

// jest.mock('src/utils/time', () => ({
//   clockInSync: () => true,
// }))

// jest.mock('src/identity/reducer', () => ({
//   ...jest.requireActual('src/identity/reducer'),
//   addressToE164NumberSelector: (state: any) => ({}),
// }))

describe(watchUpdateDefaultFee, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('updates the default invite fee', async () => {
    await expectSaga(watchUpdateDefaultFee)
      .dispatch(updateDefaultFee(FeeType.INVITE))
      .provide([[call(getInvitationVerificationFee), '42']])
      .put(defaultFeeUpdated(FeeType.INVITE, '42'))
      .silentRun()
  })
})
