import Button, { BtnTypes } from '@celo/react-components/components/Button'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { setPincode } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces, withTranslation } from 'src/i18n'
import LockedPhoneIcon from 'src/icons/LockedPhoneIcon'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  isSettingPin: boolean
  pincodeType: PincodeType
}

interface DispatchProps {
  setPincode: typeof setPincode
}

type Props = StateProps & DispatchProps & WithTranslation

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
    // we want to disable PhoneAuth during onboarding only for now
    const phoneAuth = false

    return (
      <SafeAreaView style={style.container}>
        <DevSkipButton nextScreen={Screens.EnterInviteCode} />
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <View>
            <LockedPhoneIcon style={style.logo} height={150} width={150} />
            <Text style={style.h1} testID="SystemAuthTitle">
              {t('pincodeEducation.title')}
            </Text>
            <Text style={style.body}>{t('pincodeEducation.intro')}</Text>
            {phoneAuth && <Text style={style.body}>{t('pincodeEducation.summary')}</Text>}
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
      </SafeAreaView>
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
  logo: {
    alignSelf: 'center',
  },
  body: {
    ...fontStyles.bodyLarge,
    textAlign: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.nuxNamePin1)(PincodeEducation))
)
