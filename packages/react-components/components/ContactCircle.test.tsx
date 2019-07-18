import ContactCircle from '@celo/react-components/components/ContactCircle'
import { shallow } from 'enzyme'
import * as React from 'react'
import { Text } from 'react-native'
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
      const contactCircle = shallow(
        <ContactCircle size={30} name={'Jerry'} contact={testContact} />
      )

      expect(
        contactCircle
          .find(Text)
          .children()
          .text()
      ).toEqual('Z')
    })
  })
  describe('when "preferNameInitial"', () => {
    it('uses name for initial', () => {
      const contactCircle = shallow(
        <ContactCircle size={30} name={'Jerry'} contact={testContact} preferNameInitial={true} />
      )

      expect(
        contactCircle
          .find(Text)
          .children()
          .text()
      ).toEqual('J')
    })
  })
  describe('when has image', () => {
    it('renders image', () => {
      const contactWithImage = { ...testContact, hasThumbnail: true, thumbnailPath: './test.jpg' }
      const contactCircle = shallow(
        <ContactCircle
          size={30}
          name={'Jerry'}
          contact={contactWithImage}
          preferNameInitial={true}
        />
      )

      expect(contactCircle.find({ resizeMode: 'cover' }).prop('source')).toEqual({
        uri: './test.jpg',
      })
    })
  })
})
