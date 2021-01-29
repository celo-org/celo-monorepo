import * as React from 'react'
import { Image } from 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import ContactCircle from 'src/components/ContactCircle'
import { createMockStore } from 'test/utils'

const mockAddress = '0x123456'
const mockName = 'Mock name'

const mockStore = createMockStore()

describe('ContactCircle', () => {
  describe('when given recipient with only address', () => {
    it('uses DefaultAvatar svg', () => {
      const tree = renderer.create(
        <Provider store={mockStore}>
          <ContactCircle
            size={30}
            recipient={{
              address: mockAddress,
            }}
          />
        </Provider>
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when has a thumbnail and name', () => {
    it('renders image', () => {
      const mockThumbnnailPath = './test.jpg'
      const { getByType } = render(
        <Provider store={mockStore}>
          <ContactCircle
            size={30}
            recipient={{
              name: mockName,
              address: mockAddress,
              thumbnailPath: mockThumbnnailPath,
            }}
          />
        </Provider>
      )
      expect(getByType(Image).props.source).toEqual({ uri: './test.jpg' })
    })
  })
  describe('when has a name but no picture', () => {
    it('renders initial', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ContactCircle
            size={30}
            recipient={{
              name: mockName,
              address: mockAddress,
            }}
          />
        </Provider>
      )
      expect(getByText(mockName[0])).toBeTruthy()
    })
  })
})
