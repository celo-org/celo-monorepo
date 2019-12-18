import * as React from 'react'
import * as renderer from 'react-test-renderer'
jest.mock('next/router', () => {
  return {
    SingletonRouter: {},
    withRouter: function withRouter(Component) {
      return function Wrapped(props) {
        return <Component router={{ pathName: '/test/color' }} {...props} />
      }
    },
  }
})
import Color from './color'

describe('Experience/Color', () => {
  xit('renders', () => {
    const tree = renderer.create(<Color />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
