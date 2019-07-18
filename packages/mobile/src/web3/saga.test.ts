import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { pincodeSelector } from 'src/account/reducer'
import { createNewAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

jest.mock('src/account/actions', () => ({
  ...jest.requireActual('src/account/actions'),
  getPincode: async () => 'pin',
}))

const state = createMockStore({ web3: { account: mockAccount } }).getState()

describe(createNewAccount, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('returns an existing account', async () => {
    await expectSaga(createNewAccount)
      .withState(state)
      .provide([[select(currentAccountSelector), '123']])
      .returns('123')
      .run()
  })

  it('creates a new account', async () => {
    await expectSaga(createNewAccount)
      .withState(state)
      .provide([[select(currentAccountSelector), null]])
      .provide([[select(pincodeSelector), '123']])
      .returns('0x0000000000000000000000000000000000007E57')
      .run()
  })
})
