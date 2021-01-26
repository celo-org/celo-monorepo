import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Dialog from 'src/components/Dialog'
import { openMoonpay, openSimplex } from 'src/fiatExchanges/utils'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import QuestionIcon from 'src/icons/QuestionIcon'
import { moonpayLogo, simplexLogo } from 'src/images/Images'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { currentAccountSelector } from 'src/web3/selectors'

type Props = StackScreenProps<StackParamList, Screens.ProviderOptionsScreen>

ProviderOptionsScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ProviderOptionsScreen>
}) => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
    headerTitle: i18n.t(`fiatExchangeFlow:${route.params?.isCashIn ? 'addFunds' : 'cashOut'}`),
  }
}

interface Provider {
  name: string
  enabled: boolean
  image: React.ReactNode
  onSelected: () => void
}

const FALLBACK_CURRENCY = LocalCurrencyCode.USD

function ProviderOptionsScreen({ route, navigation }: Props) {
  const [showingExplanation, setShowExplanation] = useState(false)
  const onDismissExplanation = () => setShowExplanation(false)

  const { t } = useTranslation(Namespaces.fiatExchangeFlow)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const isCashIn = route.params?.isCashIn ?? true
  const { MOONPAY_DISABLED } = useCountryFeatures()

  useLayoutEffect(() => {
    const showExplanation = () => setShowExplanation(true)

    navigation.setOptions({
      headerRightContainerStyle: { paddingRight: 16 },
      headerRight: () => (
        <TopBarIconButton
          icon={<QuestionIcon color={colors.greenUI} />}
          onPress={showExplanation}
        />
      ),
    })
  }, [])

  const providers: {
    cashOut: Provider[]
    cashIn: Provider[]
  } = {
    cashOut: [],
    cashIn: [
      {
        name: 'Moonpay',
        enabled: !MOONPAY_DISABLED,
        image: <Image source={moonpayLogo} style={styles.logo} resizeMode={'contain'} />,
        onSelected: () => openMoonpay(localCurrency || FALLBACK_CURRENCY, CURRENCY_ENUM.DOLLAR),
      },
      {
        name: 'Simplex',
        enabled: true,
        image: <Image source={simplexLogo} style={styles.logo} resizeMode={'contain'} />,
        onSelected: () => openSimplex(account),
      },
    ],
  }

  const providerOnPress = (provider: Provider) => () => {
    ValoraAnalytics.track(FiatExchangeEvents.provider_chosen, {
      isCashIn,
      provider: provider.name,
    })
    provider.onSelected()
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <Text style={styles.pleaseSelectProvider}>{t('pleaseSelectProvider')}</Text>
        <View style={styles.providersContainer}>
          {providers[isCashIn ? 'cashIn' : 'cashOut']
            .filter((provider) => provider.enabled)
            .map((provider) => {
              return (
                <>
                  <TouchableOpacity
                    key={provider.name}
                    onPress={providerOnPress(provider)}
                    style={styles.provider}
                    testID={`Provider/${provider.name}`}
                  >
                    {provider.image}
                  </TouchableOpacity>
                  <View style={styles.separator} />
                </>
              )
            })}
        </View>
        <Dialog
          title={t('explanationModal.title')}
          isVisible={showingExplanation}
          actionText={t('global:dismiss')}
          actionPress={onDismissExplanation}
        >
          {t('explanationModal.body')}
        </Dialog>
      </SafeAreaView>
    </ScrollView>
  )
}

export default ProviderOptionsScreen

const styles = StyleSheet.create({
  container: {
    paddingVertical: variables.contentPadding,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    marginHorizontal: variables.contentPadding,
  },
  pleaseSelectProvider: {
    ...fontStyles.regular,
    marginBottom: variables.contentPadding,
  },
  logo: {
    height: 30,
  },
  provider: {
    marginVertical: 24,
  },
  providersContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: colors.gray2,
  },
})
