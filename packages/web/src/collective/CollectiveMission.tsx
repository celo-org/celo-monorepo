import { useTranslation, NameSpaces } from 'src/i18n'
import { textStyles, standardStyles } from 'src/styles'
import { H1, H4 } from 'src/fonts/Fonts'
import { View } from 'react-native'
import ColLogo from 'src/collective/ColLogo'

export default function CollectiveMission() {
  const { t } = useTranslation(NameSpaces.collective)
  return (
    <View style={standardStyles.centered}>
      <ColLogo />
      <H1 style={[textStyles.invert, textStyles.center]}>{t('title')}</H1>
      <H4 style={[textStyles.invert, textStyles.center]}>{t('mission')}</H4>
    </View>
  )
}
