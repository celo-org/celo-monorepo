import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import ErrorScreen from 'src/app/ErrorScreen'

describe('ErrorScreen', () => {
  describe('with errorMessage', () => {
    it('renders correctly', () => {
      const tree = renderer.create(<ErrorScreen errorMessage={'Déjà vu'} />)
      expect(tree).toMatchSnapshot()
    })
  })
  describe('without errorMessage', () => {
    it('renders correctly', () => {
      const tree = renderer.create(<ErrorScreen />)
      expect(tree).toMatchSnapshot()
    })
  })
})
