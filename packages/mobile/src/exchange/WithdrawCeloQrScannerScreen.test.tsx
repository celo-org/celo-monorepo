import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import WithdrawCeloQrScannerScreen from 'src/exchange/WithdrawCeloQrScannerScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const SAMPLE_ADDRESS = '0xcc642068bdbbdeb91f348213492d2a80ab1ed23c'

const onAddressScanned = jest.fn()

const mockScreenProps = getMockStackScreenProps(Screens.WithdrawCeloQrScannerScreen, {
  onAddressScanned,
})

const store = createMockStore()

describe('WithdrawCeloQrScannerScreen', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <WithdrawCeloQrScannerScreen {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('calls onAddressScanned when a QR is scanned', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloQrScannerScreen {...mockScreenProps} />
      </Provider>
    )

    getByTestId('Camera').props.onBarCodeRead({
      type: 'QR',
      data: SAMPLE_ADDRESS,
    })

    expect(onAddressScanned).toHaveBeenCalledWith(SAMPLE_ADDRESS)
  })

  it('calls onAddressScanned when a Valora QR is scanned', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloQrScannerScreen {...mockScreenProps} />
      </Provider>
    )

    getByTestId('Camera').props.onBarCodeRead({
      type: 'QR',
      data: JSON.stringify({ address: SAMPLE_ADDRESS }),
    })

    expect(onAddressScanned).toHaveBeenCalledWith(SAMPLE_ADDRESS)
  })
})
