import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import QRCode, { calculateMatrix } from 'src/qrcode/QRGen'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockQrCodeData } from 'test/values'

function getRefTest(c: any) {
  // test function
}

const commonProps = {
  value: mockQrCodeData,
  getRef: getRefTest,
  testID: 'SnapshotAccountOverview',
  ...getMockI18nProps(),
}

describe('QRCode', () => {
  const store = createMockStore({})
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <QRCode {...commonProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })
  it('calculates matrix correctly', () => {
    const props = {
      value: 'This is a QR Code.',
      size: 100,
      color: 'black',
      backgroundColor: 'white',
      ecl: 'M',
      onError: undefined,
    }
    const path = calculateMatrix(props)
    expect(path).toMatchSnapshot()
  })
})
