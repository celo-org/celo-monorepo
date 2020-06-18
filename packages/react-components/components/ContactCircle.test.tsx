import ContactCircle from '@celo/react-components/components/ContactCircle'
import * as React from 'react'
import { render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'

const testContact = {
  recordID: '1',
  displayName: 'Zahara Tests Jorge',
  phoneNumbers: [],
  thumbnailPath: '',
}

describe('ContactCircle', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<ContactCircle size={30} name={'Jerry'} />)
    expect(tree).toMatchSnapshot()
  })
  describe('when given contact', () => {
    it('uses contact name for initial', () => {
      const { getByText } = render(<ContactCircle size={30} name={'Jerry'} contact={testContact} />)

      expect(getByText('Z')).toBeTruthy()
    })
  })
  describe('when not given a contact', () => {
    it('uses name for initial', () => {
      const { getByText } = render(<ContactCircle size={30} name={'Jerry'} />)

      expect(getByText('J')).toBeTruthy()
    })
  })
  describe('when has a thumbnail', () => {
    it('renders image', () => {
      const mockThumbnnailPath = './test.jpg'
      const { getByName } = render(
        <ContactCircle size={30} name={'Jerry'} thumbnailPath={mockThumbnnailPath} />
      )
      expect(getByName('Image').props.source).toEqual({ uri: './test.jpg' })
    })
  })
})
