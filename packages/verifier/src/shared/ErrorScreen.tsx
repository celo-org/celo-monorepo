import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import { Namespaces } from 'locales'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { RestartAndroid } from 'react-native-restart-android'
import { withTranslation } from 'src/i18n'

interface OwnProps {
  errorMessage: string
}

type Props = OwnProps & WithTranslation

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

export default withTranslation(Namespaces.common)(ErrorScreen)
