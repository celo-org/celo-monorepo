import * as React from 'react'
import { View } from 'react-native'
import ColLogo from 'src/alliance/ColLogo'
import { H1, H4 } from 'src/fonts/Fonts'
import { NameSpaces, useTranslation } from 'src/i18n'
import { standardStyles, textStyles } from 'src/styles'

export default function CollectiveMission() {
  const { t } = useTranslation(NameSpaces.alliance)
  return (
    <View style={[standardStyles.centered, standardStyles.blockMarginBottomMobile]}>
      <ColLogo />
      <H1 style={[textStyles.invert, textStyles.center, standardStyles.elementalMargin]}>
        {t('title')}
      </H1>
      <H4 style={[textStyles.invert, textStyles.center]}>{t('mission')}</H4>
    </View>
  )
}
