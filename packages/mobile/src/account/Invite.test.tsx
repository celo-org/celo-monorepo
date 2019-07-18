import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Invite from 'src/account/Invite'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

describe('Invite', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        {/*
          // @ts-ignore */}
        <Invite navigation={mockNavigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
