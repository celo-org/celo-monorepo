import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Chevron from 'src/icons/chevron'
import { colors, fonts, textStyles } from 'src/styles'
import { getSentry } from 'src/utils/sentry'

interface Props {
  link: string
  children: React.ReactNode
  isVisible: boolean
  getRealHeight: (n: number) => void
}

export class BlueBanner extends React.PureComponent<Props> {
  ref = React.createRef<View>()
  componentDidUpdate = () => {
    this.ref.current.measure((_x, _y, _w, height) => {
      this.props.getRealHeight(height)
    })
  }
  render() {
    return (
      <View
        testID={'banner'}
        ref={this.ref}
        style={[styles.container, this.props.isVisible && styles.isVisible]}
      >
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
    position: 'fixed',
    top: 0,
    backgroundColor: colors.deepBlue,
    width: '100%',
    maxWidth: '100vw',
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  slideDown: {
    transitionProperty: 'top',
    transitionDuration: '300ms',
  },
  isVisible: {
    minHeight: BANNER_HEIGHT,
    height: 'contents',
  },
  insideContainer: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 5,
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
  getHeight: (n: number) => void
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
      const Sentry = await getSentry()
      Sentry.captureException(e)
    }
  }

  render() {
    return (
      <BlueBanner
        isVisible={this.state.live}
        link={this.state.link}
        getRealHeight={this.props.getHeight}
      >
        {this.state.text}
      </BlueBanner>
    )
  }
}
