import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import DataSaver from 'src/account/DataSaver'
import { createMockStore } from 'test/utils'

describe('DataSaver', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <DataSaver />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
