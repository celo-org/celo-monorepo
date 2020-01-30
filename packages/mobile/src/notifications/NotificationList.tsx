import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React, { useEffect } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import {
  NavigationParams,
  NavigationProp,
  NavigationScreenProp,
  NavigationState,
} from 'react-navigation'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getCentAwareMoneyDisplay } from 'src/utils/formatting'

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
  return ({ navigation }: { navigation: NavigationProp<NavigationState> }) => ({
    ...headerWithBackButton,
    headerTitle: (
      <View style={styles.header}>
        {title && <Text style={fontStyles.bodyBold}>{title}</Text>}
        <Text style={styles.balanceText}>
          {(navigation.state.params &&
            navigation.state.params.dollarBalance &&
            CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol +
              i18n.t('sendFlow7:celoDollarsAvailable', {
                CeloDollars: getCentAwareMoneyDisplay(navigation.state.params.dollarBalance || 0),
              })) ||
            i18n.t('global:loading')}
        </Text>
      </View>
    ),
  })
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollArea: {
    margin: contentPadding,
  },
  balanceText: {
    ...fontStyles.bodySmall,
    color: colors.inactiveDark,
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
  },
  header: {
    alignItems: 'center',
    flex: 1,
  },
})

// Should be used together with titleWithBalanceNavigationOptions.
// Call this hook inside a Screen and assign
// Screen.navigationOptions = titleWithBalanceNavigationOptions(title)
export function useBalanceInNavigationParam(
  dollarBalance: string | null,
  navigation: NavigationScreenProp<NavigationParams>
) {
  useEffect(() => {
    navigation.setParams({ dollarBalance })
  }, [dollarBalance])
}
