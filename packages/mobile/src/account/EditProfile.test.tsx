import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { setName } from 'src/account/actions'
import { EditProfile } from 'src/account/EditProfile'
import { createMockStore, getMockI18nProps } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

it('renders the EditProfile Component', () => {
  const store = createMockStore()
  const tree = renderer.create(
    <Provider store={store}>
      <EditProfile {...getMockI18nProps()} name={'Test'} setName={setName} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
