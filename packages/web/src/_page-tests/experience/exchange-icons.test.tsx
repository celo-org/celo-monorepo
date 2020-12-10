import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { TestProvider } from 'src/_page-tests/test-utils'
import ExchangeIcons from '../../../pages/experience/brand/exchange-icons'

describe('Experience/ExchangeIcons', () => {
  it('renders', () => {
    const tree = renderer
      .create(
        <TestProvider>
          <ExchangeIcons />
        </TestProvider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
