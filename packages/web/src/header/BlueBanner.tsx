import getConfig from 'next/config'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Chevron from 'src/icons/chevron'
import { colors, fonts, textStyles } from 'src/styles'

interface Props {
  link: string
  children: React.ReactNode
  isVisible: boolean
}

export class BlueBanner extends React.PureComponent<Props> {
  render() {
    if (!this.props.isVisible) {
      return null
    }
    return (
      <View style={styles.container}>
        <View style={styles.insideContainer}>
          <Text
            accessibilityRole="link"
            target="_blank"
            href={this.props.link}
            style={[fonts.navigation, textStyles.medium, styles.text]}
          >
            {this.props.children}
            <Text style={styles.icon}>
              <Chevron color={colors.white} opacity={1} />
            </Text>
          </Text>
        </View>
      </View>
    )
  }
}

export function bannerVisible() {
  return getConfig().publicRuntimeConfig.FLAGS.SDK
}

export const BANNER_HEIGHT = 50

const styles = StyleSheet.create({
  container: {
    // @ts-ignore-next-line
    position: 'fixed',
    top: 0,
    backgroundColor: '#3C9BF4',
    width: '100%',
    maxWidth: '100vw',
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  insideContainer: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  text: {
    color: colors.white,
    lineHeight: 20,
  },
  icon: {
    paddingLeft: 5,
    position: 'relative',
    top: 3,
  },
})

// MAX length 75 characters
export const TEXT = 'Introducing the Celo SDK: build mobile-first DeFi apps'

const LINK = 'https://medium.com/@celo.org/e6f85f2fe18c'

export default function() {
  return (
    <BlueBanner isVisible={bannerVisible()} link={LINK}>
      {TEXT}
    </BlueBanner>
  )
}
