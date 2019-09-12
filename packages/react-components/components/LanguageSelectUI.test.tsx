import LanguageSelectUI from '@celo/react-components/components/LanguageSelectUI'
import * as React from 'react'
import * as renderer from 'react-test-renderer'

describe('LanguageSelectUI', () => {
  it('renders correctly with minimum props', () => {
    const tree = renderer.create(
      <LanguageSelectUI
        logo={{ uri: './test.jpg' }}
        onSubmit={jest.fn()}
        onLanguageSelected={jest.fn()}
        isSubmitDisabled={false}
        currentSelected="en"
        t={jest.fn()}
        languages={[
          { name: 'English', code: 'en-US' },
          { name: 'Español (América Latina)', code: 'es-419' },
        ]}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
