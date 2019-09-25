import * as React from 'react'
import { Text } from 'react-native'
import { I18nProps, withNamespaces, NameSpaces } from 'src/i18n'
import SideTitledSection from 'src/layout/SideTitledSection'
import Button, { BTN } from 'src/shared/Button.3'
import { fonts, textStyles } from 'src/styles'

export default withNamespaces(NameSpaces.about)(function PressAndMedia({ t }: I18nProps) {
  return (
    <SideTitledSection title={t('Press and Media')}>
      <Text style={[fonts.p, textStyles.center]}>
        {t('pressText')}{' '}
        <Button kind={BTN.INLINE} text={'press@celo.org'} href="mailto:press@celo.org" />.
      </Text>
    </SideTitledSection>
  )
})
