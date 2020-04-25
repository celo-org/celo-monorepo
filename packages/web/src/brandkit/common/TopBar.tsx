import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Octocat from 'src/icons/Octocat'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import menuItems, { CeloLinks } from 'src/shared/menu-items'
import { colors, fonts, standardStyles } from 'src/styles'

interface Props {
  isMobile: boolean
}

export default withNamespaces(NameSpaces.common)(function TopBar({
  t,
  isMobile,
}: I18nProps & Props) {
  return (
    <View style={standardStyles.centered}>
      <View style={[standardStyles.row, styles.container]}>
        <a href={menuItems.BRAND.link}>
          <TouchableOpacity style={styles.logo}>
            <LogoLightBg height={30} />
            {!isMobile && (
              <Text
                // @ts-ignore -- added initial to the aug but it still isnt liking it
                style={[fonts.h3, styles.title]}
              >
                BrandKit
              </Text>
            )}
          </TouchableOpacity>
        </a>
        <Button
          kind={BTN.NAV}
          href={CeloLinks.gitHub}
          text={t('github')}
          target={'_blank'}
          iconRight={<Octocat size={22} color={colors.dark} />}
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  title: {
    marginLeft: 15,
    lineHeight: 'initial', // fixes the vertical alignment
  },
  container: {
    maxWidth: 1600,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  logo: {
    alignContent: 'center',
    flexDirection: 'row',
  },
})
