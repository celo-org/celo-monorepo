import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Chevron from 'src/icons/chevron'
import { colors, fonts, textStyles } from 'src/styles'
import Sentry from '../../fullstack/sentry'

interface Props {
  link: string
  children: React.ReactNode
  isVisible: boolean
}

export class BlueBanner extends React.PureComponent<Props> {
  render() {
    return (
      <View style={[styles.container, styles.slideDown, this.props.isVisible && styles.isVisible]}>
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

export const BANNER_HEIGHT = 50

export const styles = StyleSheet.create({
  container: {
    // @ts-ignore-next-line
    position: 'fixed',
    top: 0,
    backgroundColor: '#3C9BF4',
    width: '100%',
    maxWidth: '100vw',
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  slideDown: {
    transitionProperty: 'height, top',
    transitionDuration: '300ms',
  },
  isVisible: {
    height: BANNER_HEIGHT,
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

interface State {
  live: boolean
  text: string
  link: string
}

interface AnnouncementProps {
  onVisibilityChange: (visible: boolean) => void
}

export default class Announcement extends React.Component<AnnouncementProps, State> {
  state: State = {
    live: false,
    text: '',
    link: '',
  }
  componentDidMount = async () => {
    try {
      const response = await fetch('/announcement')
      const announcements = await response.json()
      const visible = announcements.length > 0

      if (visible) {
        this.setState(announcements[0])
      }

      this.props.onVisibilityChange(visible)
    } catch (e) {
      Sentry.captureException(e)
    }
  }

  render() {
    return (
      <BlueBanner isVisible={this.state.live} link={this.state.link}>
        {this.state.text}
      </BlueBanner>
    )
  }
}
