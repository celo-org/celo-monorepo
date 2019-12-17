import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getMoneyDisplayValue } from 'src/utils/formatting'

export const noHeader = {
  headerLeft: <View />,
}

export const nuxNavigationOptions = {
  headerLeftContainerStyle: { paddingHorizontal: 10 },
  headerLeft: <BackButton />,
  headerRightContainerStyle: { paddingHorizontal: 10 },
  headerRight: <View />,
  headerTitle: <DisconnectBanner />,
  headerTitleContainerStyle: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
}

export const nuxNavigationOptionsNoBackButton = {
  ...nuxNavigationOptions,
  headerLeft: <View />,
}

export const headerWithBackButton = {
  headerTitle: '',
  headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
  headerLeftContainerStyle: { paddingHorizontal: 20 },
  headerLeft: <BackButton />,
  headerRight: <View />, // This helps vertically center the title
}

// TODO(Rossy) align designs to consistently use back button
export const headerWithCancelButton = {
  ...headerWithBackButton,
  headerLeftContainerStyle: { paddingHorizontal: 0 },
  headerLeft: <CancelButton />,
}

export const exchangeHeader = (makerToken: CURRENCY_ENUM, makerTokenBalance: string) => {
  const title =
    makerToken === CURRENCY_ENUM.DOLLAR
      ? i18n.t('exchangeFlow9:buyGold')
      : i18n.t('exchangeFlow9:sellGold')
  return {
    ...headerWithCancelButton,
    headerTitle: (
      <View style={styles.headerTextContainer}>
        <Text style={fontStyles.headerTitle}>{title}</Text>
        <View>
          <Text style={fontStyles.subSmall}>
            {i18n.t('exchangeFlow9:moneyAvailable', {
              moneyAmount: getMoneyDisplayValue(makerTokenBalance, makerToken, true),
            })}
          </Text>
        </View>
      </View>
    ),
  }
}

const styles = StyleSheet.create({
  headerTextContainer: { flex: 1, alignSelf: 'center', alignItems: 'center' },
})
