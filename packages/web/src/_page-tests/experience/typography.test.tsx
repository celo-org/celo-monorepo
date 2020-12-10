import * as React from 'react'
import * as renderer from 'react-test-renderer'

import Typography from '../../../pages/experience/brand/typography'
import { TestProvider } from '../test-utils'

describe('Experience/Typography', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <Typography />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
