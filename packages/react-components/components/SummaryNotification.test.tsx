import SummaryNotification from '@celo/react-components/components/SummaryNotification'
import { shallow } from 'enzyme'
import * as React from 'react'
import { Text } from 'react-native'
import * as renderer from 'react-test-renderer'

const props = (onPress = jest.fn()) => ({
  text: 'Gold is where you can choose to store Celo dollars you have',
  image: '',
  title: 'Test',
  reviewCTA: { text: 'it goes boom', onPress },
})

describe(SummaryNotification, () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <SummaryNotification {...props()}>
        <Text>Test</Text>
      </SummaryNotification>
    )
    expect(tree).toMatchSnapshot()
  })
  describe('when ctas are pressed', () => {
    it('calls the on press function', () => {
      const clickHandler = jest.fn()

      const wrapper = shallow(
        <SummaryNotification {...props(clickHandler)}>
          <Text>Test</Text>
        </SummaryNotification>
      )
      wrapper
        .find('TextButton')
        .first()
        .simulate('press')

      expect(clickHandler).toHaveBeenCalled()
    })
  })
})
