import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import ErrorScreen from 'src/app/ErrorScreen'
import { Screens } from 'src/navigator/Screens'

const mockRoute = {
  name: Screens.ErrorScreen as Screens.ErrorScreen,
  key: '1',
  params: {},
}

describe('ErrorScreen', () => {
  describe('with errorMessage', () => {
    it('renders correctly', () => {
      const tree = renderer.create(<ErrorScreen route={mockRoute} errorMessage={'Déjà vu'} />)
      expect(tree).toMatchSnapshot()
    })
  })
  describe('without errorMessage', () => {
    it('renders correctly', () => {
      const tree = renderer.create(<ErrorScreen route={mockRoute} />)
      expect(tree).toMatchSnapshot()
    })
  })
})
