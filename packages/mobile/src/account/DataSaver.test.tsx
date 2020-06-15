import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import DataSaver from 'src/account/DataSaver'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('DataSaver', () => {
  it('renders correctly with prompt', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <DataSaver {...getMockStackScreenProps(Screens.DataSaver, { promptModalVisible: true })} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly no prompt', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <DataSaver {...getMockStackScreenProps(Screens.DataSaver, { promptModalVisible: false })} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
