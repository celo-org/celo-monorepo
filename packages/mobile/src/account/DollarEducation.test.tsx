import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import DollarEducation from 'src/account/DollarEducation'
import { createMockStore } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('DollarEducation', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <DollarEducation />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
