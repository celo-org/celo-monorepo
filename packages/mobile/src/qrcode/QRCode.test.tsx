import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import QRCode from 'src/qrcode/QRCode'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockAccount, mockE164Number, mockName } from 'test/values'

const commonProps = {
  name: mockName,
  e164Number: mockE164Number,
  account: mockAccount,
  testID: 'SnapshotAccountOverview',
  ...getMockI18nProps(),
}

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

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
        <QRCode {...commonProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })
})
