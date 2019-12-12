import * as React from 'react'
import * as renderer from 'react-test-renderer'
import Showcase from 'src/brandkit/common/Showcase'

describe('Showcase', () => {
  it('renders', () => {
    const showCase = renderer
      .create(
        <Showcase
          name={'test'}
          description="Trust, Attest, Verify"
          loading={false}
          size={100}
          uri="example.com"
        />
      )
      .toJSON()
    expect(showCase).toMatchSnapshot()
  })
})
