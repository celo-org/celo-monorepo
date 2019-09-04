import * as React from 'react'
import { I18nextProvider } from 'react-i18next'
import { Text } from 'react-native'
import * as renderer from 'react-test-renderer'
import StackSection from 'src/dev/StackSection'
import NextI18NextInstance from 'src/i18n'
import { ScreenSizeProvider } from 'src/layout/ScreenSize'

describe('StackSection', () => {
  it('renders with typical props', () => {
    const tree = renderer.create(
      <ScreenSizeProvider>
        <I18nextProvider i18n={NextI18NextInstance.i18n} initialLanguage="en">
          <StackSection
            title="Test"
            text="Stack Section Test"
            label="Driven Test Development"
            id="1"
            children={<Text>I am a Child</Text>}
            buttonOne={{ title: 'test', href: '/text' }}
            buttonTwo={{ title: 'test', href: '/text' }}
          />
        </I18nextProvider>
      </ScreenSizeProvider>
    )
    expect(tree).toMatchSnapshot()
  })
})
