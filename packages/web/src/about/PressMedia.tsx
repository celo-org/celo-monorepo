import * as React from 'react'
import { Text } from 'react-native'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import Button, { BTN } from 'src/shared/Button.3'
import { fonts } from 'src/styles'

export default withNamespaces(NameSpaces.about)(function PressAndMedia({ t }: I18nProps) {
  return (
    <BookLayout label={t('Press and Media')} endBlock={true}>
      <Text style={[fonts.p]}>
        {t('pressText')}{' '}
        <Button kind={BTN.INLINE} text={'press@celo.org'} href="mailto:press@celo.org" />.
      </Text>
    </BookLayout>
  )
})
