import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Namespaces, withTranslation } from 'src/i18n'
import { deleteChainDataAndRestartApp, RESTART_APP_I18N_KEY } from 'src/utils/AppRestart'

const SHOW_RESTART_BUTTON_TIMEOUT = 10000

interface State {
  showRestartButton: boolean
}

type Props = {} & WithTranslation
export class AppLoading extends React.Component<Props, State> {
  showRestartButtonTimer: number | null = null

  state = {
    showRestartButton: false,
  }

  componentDidMount() {
    this.showRestartButtonTimer = window.setTimeout(
      this.showRestartButton,
      SHOW_RESTART_BUTTON_TIMEOUT
    )
  }

  componentWillUnmount() {
    if (this.showRestartButtonTimer) {
      clearTimeout(this.showRestartButtonTimer)
    }
  }

  showRestartButton = () => {
    this.setState({ showRestartButton: true })
  }

  render() {
    const { t } = this.props

    return (
      <SafeAreaView style={styles.content}>
        <View style={styles.button}>
          {this.state.showRestartButton && (
            <Button
              onPress={deleteChainDataAndRestartApp}
              text={t(RESTART_APP_I18N_KEY)}
              standard={false}
              type={BtnTypes.PRIMARY}
              testID="RestartButton"
            />
          )}
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    backgroundColor: colors.celoGreen,
  },

  button: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 20,
    paddingRight: 20,
    flex: 1,
  },
})

export default withTranslation<Props>(Namespaces.global)(AppLoading)
