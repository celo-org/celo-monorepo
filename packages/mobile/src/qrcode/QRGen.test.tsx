import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import QRCode from 'src/qrcode/QRGen'
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
})
