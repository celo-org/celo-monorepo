import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import componentWithAnalytics from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import FindUser from 'src/icons/FindUser'
import NuxLogo from 'src/icons/NuxLogo'
import ThreeChecks from 'src/icons/ThreeChecks'
import VerifyAddressBook from 'src/icons/VerifyAddressBook'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import DisconnectBanner from 'src/shared/DisconnectBanner'
export class Education extends React.Component<WithNamespaces> {
  static navigationOptions = {
    headerStyle: {
      elevation: 0,
    },
    header: null,
  }

  onSubmit = () => {
    navigate(Screens.VerifyVerifying)
  }

  render() {
    const { t } = this.props
    return (
      <View style={style.container}>
        <DevSkipButton nextScreen={Screens.WalletHome} />
        <ScrollView style={style.content}>
          <DisconnectBanner />
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
            standard={true}
            type={BtnTypes.PRIMARY}
            testID="VerifyContinueButton"
          />
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  firstBullet: {
    marginTop: 20,
  },
  bullet: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginTop: 30,
    alignItems: 'center',
  },
  bulletImage: {
    flex: 0,
    marginRight: 20,
  },
  bulletText: {
    flex: 1,
  },
})

export default componentWithAnalytics(withNamespaces('nuxVerification2')(Education))
