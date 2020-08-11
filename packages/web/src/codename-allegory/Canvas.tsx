import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Body from 'src/codename-allegory/Body'
import SideBar from 'src/codename-allegory/SideBar'
import OpenGraph from 'src/header/OpenGraph'
import menuItems from 'src/shared/menu-items'
import { fonts, textStyles } from 'src/styles'
import { useBooleanToggle } from 'src/hooks/useBooleanToggle'
import Fade from 'react-reveal/Fade'
import Head from 'next/head'

const DURATION = 600

export default function Canvas() {
  const [isOpen, toggleSidebar] = useBooleanToggle()
  return (
    <>
      <OpenGraph
        title="A Wish for Collective Propsperity"
        description="Changing the Heart of Money"
        path={menuItems.WISH.link}
      />
      <Head>
        <script async={true} src="https://platform.twitter.com/widgets.js" />
      </Head>
      <View style={styles.root}>
        <View style={styles.nav}>
          <Text onPress={toggleSidebar} style={[fonts.p, textStyles.heavy]}>
            <View style={{ position: 'absolute' }}>
              <Fade duration={DURATION} left={true} cascade={true} opposite={true} when={!isOpen}>
                About
              </Fade>
            </View>
            <Fade duration={DURATION} right={true} cascade={true} opposite={true} when={isOpen}>
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
  root: {},
  nav: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
  },
})
