import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { HeaderTitleWithBalance, headerWithBackButton } from 'src/navigator/Headers'
import DisconnectBanner from 'src/shared/DisconnectBanner'

const { contentPadding } = variables

interface OwnProps<T> {
  dollarBalance: string | null
  listItemRenderer: (item: T, key: number) => JSX.Element
  items: T[]
}

type Props<T> = OwnProps<T>

export function NotificationList<T>(props: Props<T>) {
  return (
    <SafeAreaView style={styles.container}>
      <DisconnectBanner />
      {props.items.length > 0 ? (
        <ScrollView>
          <View style={styles.scrollArea}>{props.items.map(props.listItemRenderer)}</View>
        </ScrollView>
      ) : (
        <Text style={[fontStyles.bodySecondary, styles.empty]}>{i18n.t('global:emptyList')}</Text>
      )}
    </SafeAreaView>
  )
}

export function titleWithBalanceNavigationOptions(title: string) {
  return {
    ...headerWithBackButton,
    headerTitle: <HeaderTitleWithBalance title={title} token={CURRENCY_ENUM.DOLLAR} />,
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollArea: {
    margin: contentPadding,
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
  },
})
