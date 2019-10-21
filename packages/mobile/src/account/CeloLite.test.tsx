import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import CeloLite from 'src/account/CeloLite'
import { createMockStore } from 'test/utils'

describe('CeloLite', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <CeloLite />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
