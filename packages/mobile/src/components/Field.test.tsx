import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import Field from 'src/components/Field'

const SAMPLE_LABEL = 'Input'

it('renders correctly blank', () => {
  const tree = renderer.create(<Field label={SAMPLE_LABEL} />)
  expect(tree).toMatchSnapshot()
})

it('renders correctly when filled and last', () => {
  const tree = renderer.create(<Field label={SAMPLE_LABEL} value={'preset value'} last={true} />)
  expect(tree).toMatchSnapshot()
})
