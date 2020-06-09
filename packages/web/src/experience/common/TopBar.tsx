import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NameSpaces, useTranslation } from 'src/i18n'
import Octocat from 'src/icons/Octocat'
import { useScreenSize } from 'src/layout/ScreenSize'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import links, { CeloLinks } from 'src/shared/menu-items'
import Navigation, { NavigationTheme } from 'src/shared/navigation'
import { colors, fonts, standardStyles } from 'src/styles'

interface Props {
  current: string
}

export default function TopBar({ current }: Props) {
  const { isMobile } = useScreenSize()
  const { t } = useTranslation(NameSpaces.common)
  const name = current === links.BRAND.link ? links.BRAND.name : links.EVENTS_KIT.name
  return (
    <View style={standardStyles.centered}>
      <View style={[standardStyles.row, styles.container]}>
        <View style={styles.rowVerticalCenter}>
          <a href={links.HOME.link}>
            <TouchableOpacity style={styles.rowVerticalCenter}>
              <LogoLightBg height={30} />
            </TouchableOpacity>
          </a>
          {!isMobile && (
            <a href={current}>
              <TouchableOpacity style={styles.rowVerticalCenter}>
                <Text
                  // @ts-ignore -- added initial to the aug but it still isnt liking it
                  style={[fonts.h3, styles.title]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            </a>
          )}
        </View>
        <View style={styles.rowVerticalCenter}>
          <View style={styles.kits}>
            <Navigation
              style={styles.navLink}
              text={links.EVENTS_KIT.name}
              link={links.EVENTS_KIT.link}
              selected={links.EVENTS_KIT.link === current}
              theme={NavigationTheme.LIGHT}
            />
            <Navigation
              style={styles.navLink}
              text={links.BRAND.name}
              link={links.BRAND.link}
              selected={links.BRAND.link === current}
              theme={NavigationTheme.LIGHT}
            />
          </View>
          {!isMobile && (
            <Button
              kind={BTN.NAV}
              href={CeloLinks.gitHub}
              text={t('github')}
              target={'_blank'}
              iconRight={<Octocat size={22} color={colors.dark} />}
            />
          )}
        </View>
      </View>
    </View>
  )
}

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
  rowVerticalCenter: {
    alignContent: 'center',
    flexDirection: 'row',
  },
  kits: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 30,
  },
  navLink: {
    marginBottom: 0,
    marginHorizontal: 15,
  },
})
