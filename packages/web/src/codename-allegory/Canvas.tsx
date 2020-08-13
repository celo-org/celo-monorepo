import Head from 'next/head'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Body from 'src/codename-allegory/Body'
import SideBar from 'src/codename-allegory/SideBar'
import preview from 'src/codename-allegory/twit.jpg'
import OpenGraph from 'src/header/OpenGraph'
import { useBooleanToggle } from 'src/hooks/useBooleanToggle'
import menuItems from 'src/shared/menu-items'
import { fonts, textStyles } from 'src/styles'
const DURATION = 600

export default function Canvas() {
  const [isOpen, toggleSidebar] = useBooleanToggle()
  return (
    <>
      <OpenGraph
        title="As Wealth Flowers"
        description="A Wish for Collective Propsperity"
        path={menuItems.WISH.link}
        image={preview}
      />
      <Head>
        <script async={true} src="https://platform.twitter.com/widgets.js" />
      </Head>
      <View style={styles.root}>
        <View style={styles.nav}>
          <Text onPress={toggleSidebar} style={[fonts.p, textStyles.heavy, styles.navText]}>
            <View style={styles.about}>
              <Fade duration={DURATION} when={!isOpen}>
                About
              </Fade>
            </View>
            <Fade duration={DURATION} opposite={true} when={isOpen}>
              Close
            </Fade>
          </Text>
        </View>
        <View style={styles.container}>
          <Body isOpen={isOpen} />
          <SideBar isOpen={isOpen} />
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 10,
  },
  nav: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
  navText: {
    fontSize: 18,
  },
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
  },
  about: { position: 'absolute' },
})
