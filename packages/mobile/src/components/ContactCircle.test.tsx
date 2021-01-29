import * as React from 'react'
import { Image } from 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ContactCircle from 'src/components/ContactCircle'
import { createMockStore } from 'test/utils'

const testContact = {
  recordID: '1',
  displayName: 'Zahara Tests Jorge',
  phoneNumbers: [],
  thumbnailPath: '',
}

const mockAddress = '0x123456'
const mockName = 'Mock name'
const mockStore = createMockStore({
  identity: {
    addressToDisplayName: {
      [mockAddress]: {
        name: mockName,
      },
    },
  },
})

describe('ContactCircle', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={mockStore}>
        <ContactCircle size={30} name={'Jerry'} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  describe('when given contact', () => {
    it('uses contact name for initial', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ContactCircle size={30} name={'Jerry'} contact={testContact} />
        </Provider>
      )
      expect(getByText('Z')).toBeTruthy()
    })
  })
  describe('when not given a contact', () => {
    it('uses name for initial', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ContactCircle size={30} name={'Jerry'} />
        </Provider>
      )
      expect(getByText('J')).toBeTruthy()
    })
  })
  describe('when has a thumbnail', () => {
    it('renders image', () => {
      const mockThumbnnailPath = './test.jpg'
      const { getByType } = render(
        <Provider store={mockStore}>
          <ContactCircle size={30} name={'Jerry'} thumbnailPath={mockThumbnnailPath} />
        </Provider>
      )
      expect(getByType(Image).props.source).toEqual({ uri: './test.jpg' })
    })
  })
  describe('when has a saved name but no picture', () => {
    it('renders initial', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <ContactCircle size={30} address={mockAddress} name={null} />
        </Provider>
      )
      expect(getByText(mockName[0])).toBeTruthy()
    })
  })
  describe('when has a saved name and picture', () => {
    it('renders picture', () => {
      const mockImageUrl = 'https://somehost.com/test.jpg'
      const { getByType } = render(
        <Provider
          store={createMockStore({
            identity: {
              addressToDisplayName: {
                [mockAddress]: {
                  name: mockName,
                  imageUrl: mockImageUrl,
                },
              },
            },
          })}
        >
          <ContactCircle size={30} address={mockAddress} name={mockName} />
        </Provider>
      )
      expect(getByType(Image).props.source).toEqual({ uri: mockImageUrl })
    })
  })
})
