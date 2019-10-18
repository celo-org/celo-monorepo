import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import componentWithAnalytics from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import FindUser from 'src/icons/FindUser'
import NuxLogo from 'src/icons/NuxLogo'
import ThreeChecks from 'src/icons/ThreeChecks'
import VerifyAddressBook from 'src/icons/VerifyAddressBook'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export class VerifyPhoneEducation extends React.Component<WithNamespaces> {
  static navigationOptions = nuxNavigationOptionsNoBackButton

  onSubmit = () => {
    navigate(Screens.VerifyVerifying)
  }

  render() {
    const { t } = this.props
    return (
      <SafeAreaView style={style.container}>
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <DevSkipButton nextScreen={Screens.WalletHome} />
          <NuxLogo testID="VerifyLogo" />
          <Text style={fontStyles.h1} testID="VerifyEducationHeader">
            {t('verifyPhone')}
          </Text>
          <View style={[style.bullet, style.firstBullet]}>
            <FindUser style={style.bulletImage} />
            <Text style={[fontStyles.body, style.bulletText]}>{t('otherCeloUsersFindYou')}</Text>
          </View>
          <View style={style.bullet}>
            <VerifyAddressBook style={style.bulletImage} />
            <Text style={[fontStyles.body, style.bulletText]}>{t('findOtherCeloUsers')}</Text>
          </View>
          <View style={style.bullet}>
            <ThreeChecks style={style.bulletImage} />
            <Text style={[fontStyles.body, style.bulletText]}>{t('verificationCodes')}</Text>
          </View>
        </ScrollView>
        <View>
          <Button
            onPress={this.onSubmit}
            text={t('continue')}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="VerifyContinueButton"
          />
        </View>
      </SafeAreaView>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstBullet: {
    marginTop: 10,
  },
  bullet: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginTop: 20,
    alignItems: 'center',
  },
  bulletImage: {
    flex: 0,
    marginRight: 20,
    marginLeft: 10,
  },
  bulletText: {
    flex: 1,
  },
})

export default componentWithAnalytics(withNamespaces('nuxVerification2')(VerifyPhoneEducation))
