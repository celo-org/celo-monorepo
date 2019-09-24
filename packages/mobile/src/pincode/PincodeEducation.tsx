import Button, { BtnTypes } from '@celo/react-components/components/Button'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { setPincode } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import BackupIcon from 'src/icons/BackupIcon'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isPhoneAuthSupported } from 'src/pincode/PincodeUtils.android'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  isSettingPin: boolean
  pincodeType: PincodeType
}

interface DispatchProps {
  setPincode: typeof setPincode
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isSettingPin: state.account.isSettingPin,
    pincodeType: state.account.pincodeType,
  }
}
const mapDispatchToProps: DispatchProps = {
  setPincode,
}

class PincodeEducation extends React.Component<Props> {
  static navigationOptions = nuxNavigationOptions

  onPressUsePhoneAuth = async () => {
    this.props.setPincode(PincodeType.PhoneAuth)
  }

  onPressCreateNewPin = async () => {
    navigate(Screens.PincodeSet)
  }

  componentDidMount() {
    if (this.props.pincodeType !== PincodeType.Unset) {
      this.navigateToNextScreen()
    }
  }

  componentDidUpdate() {
    if (this.props.pincodeType !== PincodeType.Unset) {
      this.navigateToNextScreen()
    }
  }

  navigateToNextScreen() {
    navigate(Screens.EnterInviteCode)
  }

  render() {
    const { t, isSettingPin } = this.props
    const phoneAuth = isPhoneAuthSupported()

    return (
      <View style={style.container}>
        <DevSkipButton nextScreen={Screens.EnterInviteCode} />
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <View>
            <BackupIcon style={style.pincodeLogo} />
            <Text style={[fontStyles.h1, style.h1]} testID="SystemAuthTitle">
              {t('pincodeEducation.title')}
            </Text>
            <Text style={[fontStyles.bodyLarge, style.explanation]}>
              {t('pincodeEducation.intro')}
            </Text>
            {phoneAuth && (
              <Text style={[fontStyles.bodyLarge, style.explanation]}>
                {t('pincodeEducation.summary')}
              </Text>
            )}
          </View>
        </ScrollView>
        <View>
          {phoneAuth && (
            <>
              <Button
                text={t('pincodeEducation.usePhoneAuth')}
                onPress={this.onPressUsePhoneAuth}
                standard={false}
                type={BtnTypes.PRIMARY}
                disabled={isSettingPin}
                testID="SystemAuthContinue"
              />
              <Button
                text={t('pincodeEducation.createNewPin')}
                onPress={this.onPressCreateNewPin}
                standard={false}
                type={BtnTypes.SECONDARY}
                disabled={isSettingPin}
                testID="CustomPinContinue"
              />
            </>
          )}
          {!phoneAuth && (
            <Button
              text={t('pincodeEducation.createNewPin')}
              onPress={this.onPressCreateNewPin}
              standard={false}
              type={BtnTypes.PRIMARY}
              disabled={isSettingPin}
              testID="SystemAuthContinue"
            />
          )}
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pincodeLogo: {
    alignSelf: 'center',
  },
  explanation: {
    textAlign: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  h1: {
    marginTop: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(PincodeEducation))
)
