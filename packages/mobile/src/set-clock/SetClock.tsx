const moment = require('moment')

import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import * as AndroidOpenSettings from 'react-native-android-open-settings'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { Namespaces } from 'src/i18n'
import clockIcon from 'src/images/clock-icon.png'
import { getLocalTimezone, getRemoteTime } from 'src/utils/time'

export class SetClock extends React.Component<WithNamespaces> {
  static navigationOptions = { header: null }

  goToSettings = () => {
    return AndroidOpenSettings.dateSettings()
  }

  render() {
    const { t } = this.props

    return (
      <View style={style.backgroundContainer}>
        <View style={style.header}>
          <Image source={clockIcon} style={style.clockImage} resizeMode="contain" />
          <Text style={[fontStyles.h1, style.time]} testID="SetClockTitle">
            {moment(getRemoteTime()).format('l, LT')}
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

export default componentWithAnalytics(withNamespaces(Namespaces.global)(SetClock))
