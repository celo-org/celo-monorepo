import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Debug from 'src/app/Debug'
import { createMockStore } from 'test/utils'

describe('Debug', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore()}>
        <Debug />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
