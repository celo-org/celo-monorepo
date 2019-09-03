import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { ContextualInfo } from 'src/fauceting/MicroComponents'
import { RequestState } from './utils'

function translator(key: string) {
  return key
}

describe('ContextualInfo', () => {
  it('renders', () => {
    const tree = renderer.create(
      <ContextualInfo requestState={RequestState.Initial} isFaucet={true} t={translator} />
    )
    expect(tree).toMatchSnapshot()
  })
})
