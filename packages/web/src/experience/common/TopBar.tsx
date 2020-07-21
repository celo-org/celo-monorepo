import * as React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { NameSpaces, useTranslation } from 'src/i18n'
import Octocat from 'src/icons/Octocat'
import { useScreenSize } from 'src/layout/ScreenSize'
import LogoLightBg from 'src/logos/LogoLightBg'
import Button, { BTN } from 'src/shared/Button.3'
import links, { CeloLinks } from 'src/shared/menu-items'
import Navigation, { NavigationTheme } from 'src/shared/Navigation'
import { colors, fonts, standardStyles } from 'src/styles'
import { useBooleanToggle } from 'src/utils/useBooleanToggle'
interface Props {
  current: string
}

export default function TopBar({ current }: Props) {
  const { isMobile, isDesktop } = useScreenSize()
  const { t } = useTranslation(NameSpaces.common)
  const [showingKits, toggleKits] = useBooleanToggle()
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
        </View>
        <View style={styles.rowVerticalCenter}>
          {isMobile ? (
            <TouchableOpacity onPress={toggleKits}>
              <Image
                source={require('src/icons/prosper-light-bg.png')}
                style={{ height: 40, width: 30 }}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.kits}>
              <Kits current={current} />
            </View>
          )}
          {isDesktop && (
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
      {showingKits && (
        <View style={styles.kitsMobileShown}>
          <Kits current={current} />
        </View>
      )}
    </View>
  )
}

function Kits({ current }) {
  return (
    <>
      <Navigation
        style={styles.navLink}
        text={links.BRAND.name}
        link={links.BRAND.link}
        selected={links.BRAND.link === current}
        theme={NavigationTheme.LIGHT}
      />
      <Navigation
        style={styles.navLink}
        text={links.EVENTS_KIT.name}
        link={links.EVENTS_KIT.link}
        selected={links.EVENTS_KIT.link === current}
        theme={NavigationTheme.LIGHT}
      />

      <Navigation
        style={styles.navLink}
        text={links.MERCHANTS.name}
        link={links.MERCHANTS.link}
        selected={links.MERCHANTS.link === current}
        theme={NavigationTheme.LIGHT}
      />
    </>
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
  kitsMobileShown: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 80,
    paddingVertical: 20,
    borderColor: 'red',
    borderWifth: 1,
    width: '100%',
    backgroundColor: 'white',
    justifyContent: 'space-around',
    height: '40%',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  kitsMobileHidden: {
    display: 'none',
  },
  navLink: {
    marginBottom: 0,
    marginHorizontal: 15,
  },
})
