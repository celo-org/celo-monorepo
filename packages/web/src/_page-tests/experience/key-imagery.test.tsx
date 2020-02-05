import * as React from 'react'
import * as renderer from 'react-test-renderer'

jest.mock('src/brandkit/common/Fetch', () => {
  return function FetchHoc({ children }) {
    return children({
      loading: false,
      error: false,
      data: [{ name: 'Graphic', description: 'visual', uri: 'example.jpg' }],
    })
  }
})

import KeyImagery from 'src/../pages/experience/brand/key-imagery'

describe('Experience/KeyImagery', () => {
  it('renders', () => {
    const tree = renderer.create(<KeyImagery />).toJSON()
    expect(tree).toMatchSnapshot()
  })
})
