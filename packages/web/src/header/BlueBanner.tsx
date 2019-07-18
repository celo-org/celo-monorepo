import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import Chevron from 'src/icons/chevron'
import { colors, fonts, textStyles } from 'src/styles'

interface Props {
  link: string
  children: React.ReactNode
}

export class BlueBanner extends React.PureComponent<Props> {
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.insideContainer}>
          <Text
            accessibilityRole="link"
            target="_blank"
            href={this.props.link}
            style={[fonts.navigation, textStyles.medium, styles.text]}
          >
            <Text style={styles.nowrap}>
              {this.props.children}
              <Text style={styles.icon}>
                <Chevron color={colors.white} opacity={1} />
              </Text>
            </Text>
          </Text>
        </View>
      </View>
    )
  }
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
  nowrap: {
    // @ts-ignore-next-line
    whiteSpace: 'nowrap',
  },
  icon: {
    paddingLeft: 5,
    position: 'relative',
    top: 3,
  },
})

export default withNamespaces('common')(({ t }: I18nProps) => (
  <BlueBanner link="https://insidelook.splashthat.com/">{t('blueBanner')}</BlueBanner>
))
