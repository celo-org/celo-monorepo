import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Octocat from 'src/icons/Octocat'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import { CeloLinks } from 'src/shared/menu-items'
import { colors, fonts, standardStyles } from 'src/styles'

export default withNamespaces(NameSpaces.common)(function TopBar({ t }: I18nProps) {
  return (
    <View style={[standardStyles.row, styles.container]}>
      <TouchableOpacity style={standardStyles.row}>
        <LogoLightBg height={30} />
        <Text style={[fonts.h3, styles.title]}>Brand Kit</Text>
      </TouchableOpacity>
      <Button
        kind={BTN.NAV}
        href={CeloLinks.gitHub}
        text={t('github')}
        target={'_blank'}
        iconRight={<Octocat size={22} color={colors.dark} />}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  title: {
    marginLeft: 20,
  },
  container: {
    backgroundColor: colors.white,
    borderBottomColor: colors.gray,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
  },
})
