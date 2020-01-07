import Error from 'pages/_error'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('Error', () => {
  it('renders', () => {
    const tree = renderer.create(<Error statusCode={404} />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
