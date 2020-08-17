import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import WithdrawCeloScreen from 'src/exchange/WithdrawCeloScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const SAMPLE_ADDRESS = '0xcc642068bdbbdeb91f348213492d2a80ab1ed23c'
const SAMPLE_BALANCE = '55.00001'

const mockScreenProps = getMockStackScreenProps(Screens.WithdrawCeloScreen)

const store = createMockStore({
  goldToken: { balance: SAMPLE_BALANCE },
})

describe('WithdrawCeloScreen', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to the scan QR screen when the QR button is pressed', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('ScanQR'))

    jest.runOnlyPendingTimers()

    expect(navigate).toHaveBeenCalledWith(
      Screens.WithdrawCeloQrScannerScreen,
      expect.objectContaining({
        onAddressScanned: expect.any(Function),
      })
    )
  })

  it('populates amount with max balance when the max button is pressed', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )
    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS)

    expect(getByTestId('CeloAmount').props.value).toBe('')
    fireEvent.press(getByTestId('MaxAmount'))
    expect(getByTestId('CeloAmount').props.value).toBe(SAMPLE_BALANCE)
    expect(getByTestId('WithdrawReviewButton').props.disabled).toBe(false)
  })

  it('disables the review button if the amount is greater than the balance', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )
    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS)

    fireEvent.changeText(getByTestId('CeloAmount'), '55.00002')
    expect(getByTestId('WithdrawReviewButton').props.disabled).toBe(true)
  })

  it('disables the review button if the address is not the correct length or format', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )
    fireEvent.changeText(getByTestId('CeloAmount'), '1')

    // Address is too long
    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS + 'a')
    expect(getByTestId('WithdrawReviewButton').props.disabled).toBe(true)

    // Address doesn't start with 0x
    fireEvent.changeText(
      getByTestId('AccountAddress'),
      '1xcc642068bdbbdeb91f348213492d2a80ab1ed23c'
    )
    expect(getByTestId('WithdrawReviewButton').props.disabled).toBe(true)

    // Address is too short
    fireEvent.changeText(getByTestId('AccountAddress'), '0xcc642068bdbbdeb91f348213492d2a80ab1ed23')
    expect(getByTestId('WithdrawReviewButton').props.disabled).toBe(true)

    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS)
    expect(getByTestId('WithdrawReviewButton').props.disabled).toBe(false)
  })
})
