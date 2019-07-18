import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Text, View } from 'react-native'
import { RestartAndroid } from 'react-native-restart-android'

interface OwnProps {
  errorMessage: string
}

type Props = OwnProps & WithNamespaces

class ErrorScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  render() {
    const { t, errorMessage } = this.props
    return (
      <FullscreenCTA
        CTAText={t('restartApp')}
        CTAHandler={RestartAndroid.restart}
        title={t('oops')}
        subtitle={t('somethingWrong')}
      >
        <View>
          <Text style={componentStyles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
            {errorMessage}
          </Text>
        </View>
      </FullscreenCTA>
    )
  }
}

export default withNamespaces('global')(ErrorScreen)
