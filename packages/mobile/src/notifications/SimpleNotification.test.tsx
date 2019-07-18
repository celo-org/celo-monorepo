import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import SimpleNotification from 'src/notifications/SimpleNotification'

const props = () => ({
  text: 'Gold is where you can choose to store Celo dollars you have',
  image: require('src/images/placeholder.png'),
  title: 'Test',
  ctaList: [{ text: 'it goes boom', onPress: jest.fn() }],
})

describe(SimpleNotification, () => {
  it('renders correctly', () => {
    const tree = renderer.create(<SimpleNotification {...props()} />)
    expect(tree).toMatchSnapshot()
  })
})
