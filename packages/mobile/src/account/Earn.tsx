import { RootState } from '@celo/mobile/src/redux/reducers'
import LanguageSelectUI from '@celo/react-components/components/LanguageSelectUI'
import TextButton from '@celo/react-components/components/TextButton'
import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { setFigureEightAccount } from 'src/app/actions'
import { AVAILABLE_LANGUAGES } from 'src/config'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import logo from 'src/images/celo-logo.png'
import { Screens } from 'src/navigator/Screens'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Logger from 'src/utils/Logger'

interface State {
  userId: string | null
}

interface DispatchProps {
  setFigureEightAccount: typeof setFigureEightAccount
  showError: typeof showError
}

type Props = DispatchProps & WithTranslation

export class Earn extends React.Component<Props, State> {
  state = {
    userId: '',
  }

  onSubmitUserId = () => {
    if (this.state.userId) {
      Logger.debug(`Setting userId: ${this.state.userId}`)
      this.props.setFigureEightAccount(this.state.userId)
    } else {
      this.props.showError(ErrorMessages.INCORRECT_PIN) // TODO right error
    }
  }

  onChangeInput = (userId: string) => {
    this.setState({ userId })
  }

  render() {
    // const { t } = this.props
    return (
      <ScrollView style={style.scrollView} keyboardShouldPersistTaps="handled">
        <TextInput
          onChangeText={this.onChangeInput}
          value={this.state.userId}
          // style={styles.nameInputField}
          // placeholderTextColor={colors.inactive}
          // underlineColorAndroid="transparent"
          // enablesReturnKeyAutomatically={true}
          // placeholder={t('fullName')}
          // testID={'NameEntry'}
        />
        <TextButton onPress={this.onSubmitUserId}>{'Submit'}</TextButton>
        <Text style={fontStyles.body}>{this.state.userId}</Text>
      </ScrollView>
    )
  }
}

export default componentWithAnalytics(
  connect<any, DispatchProps, {}, RootState>(null, { setFigureEightAccount, showError })(
    withTranslation(Namespaces.accountScreen10)(Earn)
  )
)

const style = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
