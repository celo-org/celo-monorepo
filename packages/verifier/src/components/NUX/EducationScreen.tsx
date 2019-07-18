import Button, { BtnTypes } from '@celo/react-components/components/Button'
import { navigate } from '@celo/react-components/services/NavigationService'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { Namespaces } from 'locales'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { setEducationCompleted, showError } from 'src/app/actions'
import { errorMessages } from 'src/app/reducer'
import { Screens } from 'src/navigator/Screens'
import NuxLogo from 'src/shared/NuxLogo'
import { requestSendSmsPermission } from 'src/utils/androidPermissions'
interface DispatchProps {
  setEducationCompleted: typeof setEducationCompleted
  showError: typeof showError
}

type Props = DispatchProps & WithNamespaces

class EducationScreen extends React.Component<Props> {
  onSubmit = async () => {
    const granted = await requestSendSmsPermission()
    if (granted) {
      this.props.setEducationCompleted()
      CeloAnalytics.track(CustomEventNames.welcome_next)
      navigate(Screens.SetupAccount)
      return
    } else {
      this.props.showError(errorMessages.SMS_PERMISSION_IS_NEEDED, 5000)
    }
  }

  render() {
    const { t } = this.props

    return (
      <View style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <NuxLogo />
          <View>
            <Text style={[fontStyles.h1, styles.darkCenter]} testID="InviteWallTitle">
              {t('welcomeToCeloRewards')}
            </Text>
            <Text style={[fontStyles.paragraph, styles.body]}>{t('howToEarnCelo')}</Text>

            <Text style={[fontStyles.paragraph, styles.body]}>
              {t('toGetStarted')}
              {'\n'}
              {t('carrierCharges')}
            </Text>
          </View>
        </KeyboardAwareScrollView>
        <View style={styles.bottomContainer}>
          <Button
            standard={false}
            type={BtnTypes.PRIMARY}
            text={t('next')}
            onPress={this.onSubmit}
          />
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  darkCenter: {
    textAlign: 'center',
    color: colors.dark,
  },
  body: {
    color: colors.dark,
    paddingLeft: 10,
    paddingBottom: 15,
  },
  bottomContainer: {
    backgroundColor: colors.white,
    margin: 15,
  },
})

export default withNamespaces(Namespaces.education)(
  connect<null, DispatchProps>(
    null,
    { setEducationCompleted, showError }
  )(EducationScreen)
)
