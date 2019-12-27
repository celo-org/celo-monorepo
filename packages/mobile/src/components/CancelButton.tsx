import Touchable from '@celo/react-components/components/Touchable'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigateBack } from 'src/navigator/NavigationService'

type Props = {
  eventName?: CustomEventNames
  onCancel?: () => void
} & WithTranslation

class CancelButton extends React.PureComponent<Props> {
  cancel = () => {
    if (this.props.eventName) {
      CeloAnalytics.track(this.props.eventName)
    }

    if (this.props.onCancel) {
      this.props.onCancel()
    } else {
      navigateBack()
    }
  }

  render() {
    return (
      <Touchable
        borderless={true}
        style={styles.container}
        onPress={this.cancel}
        testID="CancelButton"
      >
        <Text style={fontStyles.headerButton}>{this.props.t('cancel')}</Text>
      </Touchable>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
})

export default withTranslation(Namespaces.global)(CancelButton)
