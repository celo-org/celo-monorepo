import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import DataSaver from 'src/account/DataSaver'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

const mockRoute = {
  name: Screens.DataSaver as Screens.DataSaver,
  key: '1',
  params: {
    promptModalVisible: false,
  },
}

describe('DataSaver', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <DataSaver navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
