import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Color from '../../../pages/experience/brand/color'
import { TestProvider } from 'src/_page-tests/test-utils'

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
