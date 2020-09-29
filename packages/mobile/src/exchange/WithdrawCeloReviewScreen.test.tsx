import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { Actions } from 'src/exchange/actions'
import WithdrawCeloReviewScreen from 'src/exchange/WithdrawCeloReviewScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const SAMPLE_ADDRESS = '0xcc642068bdbbdeb91f348213492d2a80ab1ed23c'
const SAMPLE_AMOUNT = new BigNumber(5.001)

const mockScreenProps = getMockStackScreenProps(Screens.WithdrawCeloReviewScreen, {
  recipientAddress: SAMPLE_ADDRESS,
  amount: SAMPLE_AMOUNT,
})

const store = createMockStore()

describe('WithdrawCeloReviewScreen', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <WithdrawCeloReviewScreen {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('dispatches a withdraw event when the button is clicked', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloReviewScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('ConfirmWithdrawButton'))
    expect(store.getActions()).toEqual([
      {
        type: Actions.WITHDRAW_CELO,
        amount: SAMPLE_AMOUNT,
        recipientAddress: SAMPLE_ADDRESS,
      },
    ])
  })
})
