import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import QRCode from 'src/qrcode/QRCode'
import { createMockStore } from 'test/utils'
import { mockAccount, mockName } from 'test/values'

describe('QRCode', () => {
  const store = createMockStore({
    account: { name: mockName },
    web3: {
      account: mockAccount,
    },
  })
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <QRCode qrSvgRef={{ current: null }} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })
})
