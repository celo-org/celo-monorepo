import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import PhotosEducation from 'src/account/PhotosEducation'
import { createMockStore } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('PhotosEducation', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <PhotosEducation />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
