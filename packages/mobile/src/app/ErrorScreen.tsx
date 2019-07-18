import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Text, View } from 'react-native'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { restartApp } from 'src/utils/AppRestart'

interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

type Props = OwnProps & WithNamespaces

class ErrorScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  getErrorMessage() {
    return (
      this.props.errorMessage ||
      (this.props.navigation && this.props.navigation.getParam('errorMessage')) ||
      'unknown'
    )
  }

  render() {
    const { t } = this.props
    const errorMessage = this.getErrorMessage()
    return (
      <FullscreenCTA
        CTAText={t('restartApp')}
        CTAHandler={restartApp}
        title={t('oops')}
        subtitle={t('somethingWrong')}
      >
        <View>
          <Text style={componentStyles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
            {t(errorMessage)}
          </Text>
        </View>
      </FullscreenCTA>
    )
  }
}

export default withNamespaces('global')(ErrorScreen)
