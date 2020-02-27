import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Background from 'src/app/Background'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

describe('Background', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore()}>
        <Background
          navigation={{
            ...mockNavigation,
            getParam: () => jest.fn(),
          }}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
