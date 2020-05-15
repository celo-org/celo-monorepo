import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import { RouteProp } from '@react-navigation/native'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { Namespaces, withTranslation } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { deleteChainDataAndRestartApp, RESTART_APP_I18N_KEY } from 'src/utils/AppRestart'

interface OwnProps {
  errorMessage?: string
  route?: RouteProp<StackParamList, Screens.ErrorScreen>
}

type Props = OwnProps & WithTranslation

class ErrorScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  getErrorMessage = () => {
    return this.props.errorMessage || this.props.route?.params.errorMessage || 'unknown'
  }

  render() {
    const { t } = this.props
    const errorMessage = this.getErrorMessage()
    return (
      <FullscreenCTA
        CTAText={t(RESTART_APP_I18N_KEY)}
        CTAHandler={deleteChainDataAndRestartApp}
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

export default withTranslation(Namespaces.global)(ErrorScreen)
