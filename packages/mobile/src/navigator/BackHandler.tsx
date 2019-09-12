import * as React from 'react'
import { BackHandler } from 'react-native'
import {
  NavigationEventSubscription,
  NavigationScreenProps,
  withNavigation,
} from 'react-navigation'

type Props = {
  onBack: () => void
} & NavigationScreenProps

class HandleBack extends React.Component<Props> {
  didFocus: NavigationEventSubscription
  willBlur: NavigationEventSubscription | undefined

  constructor(props: Props) {
    super(props)
    this.didFocus = props.navigation.addListener('didFocus', () =>
      BackHandler.addEventListener('hardwareBackPress', this.onBack)
    )
  }

  componentDidMount() {
    this.willBlur = this.props.navigation.addListener('willBlur', () =>
      BackHandler.removeEventListener('hardwareBackPress', this.onBack)
    )
  }

  goBack = () => {
    this.props.navigation.goBack()
  }

  onBack = () => {
    // this will be triggered when user hits back
    return this.props.onBack()
  }

  componentWillUnmount() {
    this.didFocus.remove()
    if (this.willBlur) {
      this.willBlur.remove()
    }
    BackHandler.removeEventListener('hardwareBackPress', this.onBack)
  }

  render() {
    return this.props.children
  }
}

export default withNavigation(HandleBack)
