import Touchable from '@celo/react-components/components/Touchable'
import { navigate, navigateBack } from '@celo/react-components/services/NavigationService'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { Namespaces } from 'locales'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Screens } from 'src/navigator/Screens'

type Props = {
  onPress?: () => void
  backScreen?: Screens
  eventName?: CustomEventNames
} & WithNamespaces

class CancelButton extends React.PureComponent<Props> {
  handleOnPress = () => {
    if (this.props.onPress) {
      this.props.onPress()
    }
    if (this.props.eventName) {
      CeloAnalytics.track(this.props.eventName, {})
    }
    this.props.backScreen ? navigate(this.props.backScreen) : navigateBack()
  }

  render() {
    return (
      <View style={styles.container}>
        <Touchable borderless={true} onPress={this.handleOnPress} hitSlop={variables.iconHitslop}>
          <Text style={fontStyles.headerButton}>{this.props.t('cancel')}</Text>
        </Touchable>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: 'absolute',
    left: 10,
    top: 10,
    zIndex: 1000,
  },
})

export default withNamespaces(Namespaces.common)(CancelButton)
