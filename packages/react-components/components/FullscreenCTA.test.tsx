import Button from '@celo/react-components/components/Button'
import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import { shallow } from 'enzyme'
import * as React from 'react'
import { Text, View } from 'react-native'
import * as renderer from 'react-test-renderer'

function FullscreenCTAContentMaker(errorMessage: string) {
  return (
    <View>
      <Text style={componentStyles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
        {errorMessage}
      </Text>
    </View>
  )
}

describe('FullscreenCTA', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <FullscreenCTA
        title={'App Update'}
        subtitle={'Please upgrade your app'}
        CTAText={'click Here!'}
        CTAHandler={jest.fn()}
      >
        {FullscreenCTAContentMaker('Update your app to make sure you are safe')}
      </FullscreenCTA>
    )
    expect(tree).toMatchSnapshot()
  })
  describe('when press the button', () => {
    it('calls the restart prop', () => {
      const restartApp = jest.fn()
      const contactCircle = shallow(
        <FullscreenCTA
          title={'Opps'}
          subtitle={'Something went wrong'}
          CTAText={'Restart'}
          CTAHandler={restartApp}
        >
          {FullscreenCTAContentMaker('There was an unexpected error')}
        </FullscreenCTA>
      )
      contactCircle.find(Button).simulate('press')
      expect(restartApp).toHaveBeenCalled()
    })
  })
})
