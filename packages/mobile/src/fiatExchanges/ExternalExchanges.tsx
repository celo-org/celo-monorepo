import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AccountNumber from 'src/components/AccountNumber'
import BackButton from 'src/components/BackButton.v2'
import { EXCHANGE_PROVIDER_LINKS } from 'src/config'
import i18n from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import { emptyHeader } from 'src/navigator/Headers.v2'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

export const externalExchangesScreenOptions = () => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton />,
    headerTitle: i18n.t('fiatExchangeFlow:exchanges'),
  }
}

function ExternalExchanges() {
  const account = useSelector(currentAccountSelector)

  const goToProvider = (link: string) => {
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.external_exchange_link, {
        link,
      })
      navigateToURI(link)
    }
  }

  const { t } = useTranslation('fiatExchangeFlow')
  const providers = EXCHANGE_PROVIDER_LINKS // TODO Dynamically fetch exchange provider links so they can be updated between releases

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <Text style={styles.pleaseSelectProvider}>{t('youCanTransfer')}</Text>
        <View style={styles.accountNumberContainer}>
          <View style={styles.accountNoTextContainer}>
            <Text style={styles.accountNoText}>Account</Text>
            <Text style={styles.accountNoText}>No.</Text>
          </View>
          <AccountNumber address={account || ''} />
        </View>
        <View style={styles.providersContainer}>
          {providers.map((provider, idx) => {
            return (
              <ListItem key={idx} onPress={goToProvider(provider.link)}>
                <View style={styles.providerListItem}>
                  <Text style={styles.optionTitle}>{provider.name}</Text>
                  <LinkArrow />
                </View>
              </ListItem>
            )
          })}
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: variables.contentPadding,
  },
  pleaseSelectProvider: {
    ...fontStyles.regular,
    paddingHorizontal: variables.contentPadding,
    paddingBottom: variables.contentPadding,
  },
  accountNumberContainer: {
    marginHorizontal: variables.contentPadding,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flexDirection: 'row',
    backgroundColor: colors.gray2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountNoTextContainer: {
    flexDirection: 'column',
  },
  accountNoText: {
    marginRight: 25,
    ...fontStyles.small600,
    color: colors.gray5,
  },
  providerListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providersContainer: {
    paddingRight: variables.contentPadding,
  },
  optionTitle: {
    ...fontStyles.regular,
  },
})

export default ExternalExchanges
