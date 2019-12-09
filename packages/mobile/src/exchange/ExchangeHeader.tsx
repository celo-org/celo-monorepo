import { fontStyles } from '@celo/react-components/styles/fonts'
import { CURRENCY_ENUM } from '@celo/utils'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { getMoneyDisplayValue } from 'src/utils/formatting'

export const ExchangeHeader = (makerToken: CURRENCY_ENUM, makerTokenBalance: string) => {
  const title =
    makerToken === CURRENCY_ENUM.DOLLAR
      ? i18n.t(`${Namespaces.exchangeFlow9}:buyGold`)
      : i18n.t(`${Namespaces.exchangeFlow9}:sellGold`)
  return {
    ...headerWithCancelButton,
    headerTitle: (
      <View style={styles.headerTextContainer}>
        <Text style={fontStyles.headerBoldTitle}>{title}</Text>
        <View>
          <Text style={fontStyles.subSmall}>
            {getMoneyDisplayValue(makerTokenBalance, makerToken, true) +
              ' ' +
              i18n.t(`${Namespaces.exchangeFlow9}:lowerCaseAvailable`)}
          </Text>
        </View>
      </View>
    ),
  }
}

const styles = StyleSheet.create({
  headerTextContainer: { flex: 1, alignSelf: 'center', alignItems: 'center' },
})
