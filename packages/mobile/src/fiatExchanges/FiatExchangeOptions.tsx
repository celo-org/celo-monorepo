import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Dialog from 'src/components/Dialog'
import ListItem from 'src/fiatExchanges/ListItem'
import { moonpayLogo } from 'src/images/Images'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeOptions>
type Props = RouteProps

interface Provider {
  image: React.ReactNode
  screen: keyof StackParamList
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
