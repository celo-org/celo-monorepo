import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import AppLoading from 'src/app/AppLoading'

describe('AppLoading', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<AppLoading />)
    expect(tree).toMatchSnapshot()
  })
})
