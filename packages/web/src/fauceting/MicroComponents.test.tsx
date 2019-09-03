import { ContextualInfo } from 'src/fauceting/MicroComponents'
import * as renderer from 'react-test-renderer'
import { RequestState } from './utils'
import * as React from 'react'

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
