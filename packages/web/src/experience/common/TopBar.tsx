import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Hamburger from 'src/header/Hamburger'
import { useScreenSize } from 'src/layout/ScreenSize'
import LogoLightBg from 'src/logos/LogoLightBg'
import RingsGlyph from 'src/logos/RingsGlyph'
import links from 'src/shared/menu-items'
import MobileMenu from 'src/shared/MobileMenu'
import Navigation, { NavigationTheme } from 'src/shared/Navigation'
import { colors, fonts, standardStyles } from 'src/styles'
import { useBooleanToggle } from 'src/utils/useBooleanToggle'
interface Props {
  current: string
}

const KITS = [links.BRAND, links.EVENTS_KIT, links.MERCHANTS]

export default function TopBar({ current }: Props) {
  const { isMobile } = useScreenSize()
  const [showingKits, toggleKits] = useBooleanToggle()
  const name = current === links.BRAND.link ? links.BRAND.name : links.EVENTS_KIT.name

  return (
    <View style={standardStyles.centered}>
      <View style={[standardStyles.row, styles.container, isMobile && styles.containerMobile]}>
        <View style={styles.rowVerticalCenter}>
          <a href={links.HOME.link}>
            <TouchableOpacity style={styles.rowVerticalCenter}>
              {isMobile ? <RingsGlyph height={30} /> : <LogoLightBg height={30} />}
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
            <Hamburger
              onPress={toggleKits}
              isOpen={showingKits}
              color={colors.dark}
              style={styles.hamburger}
            />
          ) : (
            <View style={styles.kits}>
              <Kits current={current} />
            </View>
          )}
          {showingKits && (
            <View style={styles.kitsMobileShown}>
              <MobileMenu currentPage={current} menu={KITS} />
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

function Kits({ current }) {
  return (
    <>
      {KITS.map((kit) => {
        return (
          <Navigation
            key={kit.link}
            style={styles.navLink}
            text={kit.name}
            link={kit.link}
            selected={kit.link === current}
            theme={NavigationTheme.LIGHT}
          />
        )
      })}
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
  containerMobile: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  hamburger: { marginVertical: 0, marginHorizontal: 0, zIndex: 100 },
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
    zIndex: 10,
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingVertical: 20,
    borderWifth: 1,
    width: '100%',
    backgroundColor: colors.white,
    justifyContent: 'space-around',
  },
  navLink: {
    marginBottom: 0,
    marginHorizontal: 15,
  },
})
