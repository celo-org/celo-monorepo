import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import PincodeEnter from 'src/pincode/PincodeEnter'
import { createMockNavigationProp, createMockStore } from 'test/utils'

describe('PincodeEnter', () => {
  it('renders correctly', () => {
    const navigation = createMockNavigationProp({
      reject: jest.fn(),
      resolve: jest.fn(),
    })

    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <PincodeEnter navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
