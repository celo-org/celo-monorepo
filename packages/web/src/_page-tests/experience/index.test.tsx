import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import Brandkit from '../../../pages/experience/brand/index'

describe('Experience/Brandkit', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Brandkit />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
