import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import ReclaimPaymentConfirmationCard from 'src/escrow/ReclaimPaymentConfirmationCard'
import {} from 'src/home/NotificationBox'
import { createMockStore } from 'test/utils'
import { mockContactWithPhone } from 'test/values'

const store = createMockStore()

describe('ReclaimPaymentConfirmationCard', () => {
  it('renders correctly for send payment confirmation', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <ReclaimPaymentConfirmationCard
          recipient={mockContactWithPhone}
          amount={new BigNumber(10)}
          currency={CURRENCY_ENUM.DOLLAR}
          fee={new BigNumber(0.01)}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
