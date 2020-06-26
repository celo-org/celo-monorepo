import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { NavigationProp, RouteProp } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CustomEventNames } from 'src/analytics/constants'
import BackButton from 'src/components/BackButton.v2'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import QuestionIcon from 'src/icons/QuestionIcon'
import { moonpayLogo } from 'src/images/Images'
import { emptyHeader, HeaderTitleWithSubtitle } from 'src/navigator/Headers.v2'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeOptions>
type Props = RouteProps

interface Provider {
  image: React.ReactNode
  screen: keyof StackParamList
}

export const fiatExchangesOptionsScreenOptions = ({
  route,
  navigation,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeOptions>
  navigation: NavigationProp<StackParamList, Screens.FiatExchangeOptions>
}) => {
  function showExplanation() {
    navigation.setParams({ isExplanationOpen: true })
  }
  const amount = (
    <CurrencyDisplay
      amount={{ value: route.params.amount, currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code }}
    />
  )
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={CustomEventNames.send_amount_back} />,
    headerTitle: () => (
      <HeaderTitleWithSubtitle
        title={amount}
        subTitle={i18n.t(`fiatExchangeFlow:${route.params?.isAddFunds ? 'addFunds' : 'cashOut'}`)}
      />
    ),
    headerRight: () => (
      <TopBarIconButton icon={<QuestionIcon color={colors.greenUI} />} onPress={showExplanation} />
    ),
    headerRightContainerStyle: { paddingRight: 16 },
  }
}

function FiatExchangeOptions({ route, navigation }: Props) {
  function goToProvider(screen: keyof StackParamList) {
    return () => navigation.navigate(screen)
  }
  function onDismiss() {
    navigation.setParams({ isExplanationOpen: false })
  }

  const providers: {
    cashOut: Provider[]
    addFunds: Provider[]
  } = {
    cashOut: [
      {
        image: <Image source={moonpayLogo} style={styles.moonpayLogo} resizeMode={'contain'} />,
        screen: Screens.MoonPay,
      },
    ],
    addFunds: [
      {
        image: <Image source={moonpayLogo} style={styles.moonpayLogo} resizeMode={'contain'} />,
        screen: Screens.MoonPay,
      },
    ],
  }

  const { isAddFunds } = route.params
  const { t } = useTranslation('fiatExchangeFlow')
  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <Text style={styles.pleaseSelectProvider}>{t('pleaseSelectProvider')}</Text>
        <View>
          {providers[isAddFunds ? 'addFunds' : 'cashOut'].map((value, idx) => {
            return (
              <ListItem key={idx} onPress={goToProvider(value.screen)}>
                {value.image}
              </ListItem>
            )
          })}
        </View>
        <Dialog
          title={t('explanationModal.title')}
          isVisible={route.params.isExplanationOpen ?? false}
          actionText={t('global:dismiss')}
          actionPress={onDismiss}
        >
          {t('explanationModal.body')}
        </Dialog>
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: variables.contentPadding,
  },
  optionTitle: {
    ...fontStyles.regular,
    paddingLeft: variables.contentPadding,
  },
  pleaseSelectProvider: {
    ...fontStyles.regular,
    paddingHorizontal: variables.contentPadding,
    paddingBottom: variables.contentPadding,
  },
  moonpayLogo: {
    height: 30,
    width: 104,
  },
})

export default FiatExchangeOptions
