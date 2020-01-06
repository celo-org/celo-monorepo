import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Error from '../../pages/_error'

describe('Error', () => {
  it('renders', () => {
    const tree = renderer.create(<Error statusCode={404} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
