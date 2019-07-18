const { mockNavigationServiceFor } = require('test/utils')
const { navigateBack } = mockNavigationServiceFor('PhotosEducation')

import { shallow } from 'enzyme'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Education from 'src/account/Education'
import PhotosEducation, { PhotosEducation as PhotosEducationRaw } from 'src/account/PhotosEducation'
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

  describe('behavior for finishing', () => {
    it('sets photosNUXCompleted and navigates back', () => {
      const setComplete = jest.fn()
      const photoEd = shallow(<PhotosEducationRaw photosNUXCompleted={setComplete} />)
      photoEd.find(Education).simulate('finish')
      expect(setComplete).toBeCalled()
      expect(navigateBack).toBeCalled()
    })
  })
})
