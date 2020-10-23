import Head from 'next/head'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Body from 'src/flower/Body'
import preview from 'src/flower/open-graph.jpg'
import SideBar from 'src/flower/SideBar'
import OpenGraph from 'src/header/OpenGraph'
import { useBooleanToggle } from 'src/hooks/useBooleanToggle'
import menuItems from 'src/shared/menu-items'
import { fonts, textStyles } from 'src/styles'
const DURATION = 600

export default function Canvas() {
  const [isOpen, toggleSidebar] = useBooleanToggle()
  return (
    <>
      <Head>
        <script async={true} src="https://platform.twitter.com/widgets.js" />
        <link key="favicon" rel="shortcut icon" href="/flowers-favicon.png" type="image/png" />
      </Head>
      <OpenGraph
        title="For Value Flowers"
        description="This art form is a testament to the creative trinity of code, poetry, and illustration. As a work centered around channelling the Celo story, For Value Flowers is a gift of optimism. It gives shape to a spirit of collective prosperity, and celebrates it when brought to life. Our intention for this gift is to ground a space for a special, expressive tone of togetherness, our 'Kuneco'. Here, we gather — for the intimate connection that forms the heart of communal interdependence, dedicated to making the conditions for prosperity to flower throughout the world."
        path={menuItems.FLOWERS.link}
        image={preview}
      />
      <View style={styles.root}>
        <View style={styles.nav}>
          <Text onPress={toggleSidebar} style={[fonts.p, textStyles.heavy, styles.navText]}>
            <Text
              style={[
                styles.about,
                styles.transition,
                isOpen ? styles.transitionOut : styles.transitionIn,
              ]}
            >
              About
            </Text>
            <Text style={[styles.transition, isOpen ? styles.transitionIn : styles.transitionOut]}>
              Close
            </Text>
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
    zIndex: 10,
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
  transition: {
    transitionDuration: `${DURATION}ms`,
    transitionProperty: 'opacity',
  },
  transitionOut: {
    opacity: 0,
  },
  transitionIn: {
    opacity: 1,
    transitionDelay: `${DURATION / 3}ms`,
  },
})
