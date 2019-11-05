import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import PincodeConfirmation from 'src/pincode/PincodeConfirmation'
import { createMockNavigationProp, createMockStore } from 'test/utils'

describe('PincodeConfirmation', () => {
  it('renders correctly', () => {
    const navigation = createMockNavigationProp({
      reject: jest.fn(),
      resolve: jest.fn(),
    })

    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <PincodeConfirmation navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
