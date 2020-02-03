import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import DataSaver from 'src/account/DataSaver'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

describe('DataSaver', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <DataSaver navigation={mockNavigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
