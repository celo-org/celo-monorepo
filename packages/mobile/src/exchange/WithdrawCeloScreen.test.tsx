import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import WithdrawCeloScreen from 'src/exchange/WithdrawCeloScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

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

    expect(getByTestId('CeloAmount').props.value).toBe('')
    fireEvent.press(getByTestId('MaxAmount'))
    expect(getByTestId('CeloAmount').props.value).toBe(SAMPLE_BALANCE)
  })
})
