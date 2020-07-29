import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { NavigationProp, RouteProp } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton.v2'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import { MOONPAY_RATE_API } from 'src/config'
import { features } from 'src/flags'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import QuestionIcon from 'src/icons/QuestionIcon'
import { moonpayLogo } from 'src/images/Images'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithSubtitle } from 'src/navigator/Headers.v2'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import Logger from 'src/utils/Logger'

const FALLBACK_CURRENCY = LocalCurrencyCode.USD

const TAG = 'fiatExchange/FiatExchangeOptions'

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
      amount={{
        value: route.params.amount,
        currencyCode: features.CUSD_MOONPAY_ENABLED
          ? CURRENCIES[CURRENCY_ENUM.DOLLAR].code
          : CURRENCIES[CURRENCY_ENUM.GOLD].code,
      }}
    />
  )
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
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

const fetchMoonpayRates = async () => (await fetch(MOONPAY_RATE_API)).json()

function FiatExchangeOptions({ route, navigation }: Props) {
  const [providerLocalAmount, setProviderLocalAmount] = useState<BigNumber>()
  const [providerlocalCurrency, setProviderLocalCurrency] = useState<LocalCurrencyCode>()
  // All currency exchange calculations handled here as
  // different providers may provide different fiat, CELO and cUSD rates

  const localCurrency = useSelector(getLocalCurrencyCode)
  const { amount } = route.params

  const goToProvider = (screen: keyof StackParamList) => {
    return () =>
      navigation.navigate(screen, {
        localAmount: features.CUSD_MOONPAY_ENABLED
          ? amount
          : providerLocalAmount || new BigNumber(0),
        currencyCode: providerlocalCurrency || FALLBACK_CURRENCY,
      })
  }
  const onDismiss = () => {
    navigation.setParams({ isExplanationOpen: false })
  }

  const dispatch = useDispatch()
  useEffect(() => {
    async function getMoonpayRates() {
      const moonpayRates = await fetchMoonpayRates()
      const localMoonpayRate = moonpayRates[localCurrency]

      if (localMoonpayRate) {
        const localMoonpayAmount = amount.times(localMoonpayRate)
        setProviderLocalCurrency(localCurrency)
        setProviderLocalAmount(localMoonpayAmount)
      } else if (moonpayRates[FALLBACK_CURRENCY]) {
        // Local currency not available, use fallback currency
        setProviderLocalCurrency(FALLBACK_CURRENCY)
        setProviderLocalAmount(moonpayRates[FALLBACK_CURRENCY])
      } else {
        throw new Error('Unable to fetch Moonpay rates')
      }
    }
    // TODO: Get rates from other providers when they are added
    getMoonpayRates().catch((error) => {
      Logger.error(TAG, `Failed to fetch Moonpay rate for ${localCurrency} at ${amount}`, error)
      dispatch(showError(ErrorMessages.PROVIDER_RATE_FETCH_FAILED))
    })
  }, [localCurrency, amount])

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
