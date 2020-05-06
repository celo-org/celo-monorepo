import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { format } from 'date-fns'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, Platform, StyleSheet, Text, View } from 'react-native'
import * as AndroidOpenSettings from 'react-native-android-open-settings'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { Namespaces, withTranslation } from 'src/i18n'
import clockIcon from 'src/images/clock-icon.png'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getLocalTimezone, getRemoteTime } from 'src/utils/time'

export class SetClock extends React.Component<WithTranslation> {
  static navigationOptions = { header: null }

  goToSettings = () => {
    if (Platform.OS === 'android') {
      return AndroidOpenSettings.dateSettings()
    } else {
      // TODO: Implement Date Setting on iOS
      navigate(Screens.WalletHome)
    }
  }

  render() {
    const { t } = this.props

    return (
      <View style={style.backgroundContainer}>
        <View style={style.header}>
          <Image source={clockIcon} style={style.clockImage} resizeMode="contain" />
          <Text style={[fontStyles.h1, style.time]} testID="SetClockTitle">
            {format(getRemoteTime(), 'Pp')}
          </Text>
          <Text style={fontStyles.body} testID="SetClockTitle">
            ({getLocalTimezone()})
          </Text>
        </View>
        <View>
          <Text style={[fontStyles.h1, style.bodyText]} testID="SetClockTitle">
            {t('yourClockIsBroke')}
          </Text>
        </View>
        <View>
          <Text style={[fontStyles.bodySmall, style.instructions]}>{t('adjustYourClock')}</Text>
          <Button
            onPress={this.goToSettings}
            text={t('adjustDate')}
            standard={true}
            type={BtnTypes.PRIMARY}
          />
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  backgroundContainer: {
    backgroundColor: 'white',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  clockImage: {
    height: 75,
    marginBottom: 10,
  },
  time: {
    color: colors.dark,
    paddingBottom: 10,
  },
  bodyText: {
    color: colors.darkSecondary,
  },
  instructions: {
    textAlign: 'center',
    color: colors.dark,
  },
})

export default componentWithAnalytics(withTranslation(Namespaces.global)(SetClock))
