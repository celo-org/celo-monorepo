import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import PhotosEducation from 'src/account/PhotosEducation'
import { createMockStore } from 'test/utils'

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
