import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import fontFamily from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import * as renderer from 'react-test-renderer'

const styles = StyleSheet.create({
  errorMessage: {
    ...fontFamily.regular,
    fontSize: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(238, 238, 238, 0.75)',
    padding: 15,
  },
})

function FullscreenCTAContentMaker(errorMessage: string) {
  return (
    <View>
      <Text style={styles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
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
      const { getByName } = render(
        <FullscreenCTA
          title={'Opps'}
          subtitle={'Something went wrong'}
          CTAText={'Restart'}
          CTAHandler={restartApp}
        >
          {FullscreenCTAContentMaker('There was an unexpected error')}
        </FullscreenCTA>
      )
      fireEvent.press(getByName('Button'))
      expect(restartApp).toHaveBeenCalled()
    })
  })
})
