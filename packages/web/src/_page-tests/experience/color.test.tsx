import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import Color from '../../../pages/experience/brand/color'

describe('Experience/Color', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Color />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
