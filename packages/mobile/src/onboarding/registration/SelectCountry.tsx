import fontStyles from '@celo/react-components/styles/fonts.v2'
import { LocalizedCountry } from '@celo/utils/src/countries'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, Text } from 'react-native'
import { useSafeArea } from 'react-native-safe-area-view'
import { useDispatch } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import SelectCountryItem from 'src/onboarding/registration/SelectCountryItem'

const DEFAULT_CURRENCY_CODE = LocalCurrencyCode.USD

const keyExtractor = (item: LocalizedCountry) => item.alpha2

type Props = StackScreenProps<StackParamList, Screens.SelectCountry>

export default function SelectCountry({ navigation, route }: Props) {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const countries = route.params.countries
  // tslint:disable-next-line: react-hooks-nesting
  const selectedCurrencyCode = useLocalCurrencyCode() || DEFAULT_CURRENCY_CODE
  const dispatch = useDispatch()

  const onSelect = useCallback(
    (country: LocalizedCountry) => {
      navigation.navigate(Screens.JoinCelo, { selectedCountryCodeAlpha2: country.alpha2 })

      // Wait for next frame before navigating back
      // so the user can see the changed selection briefly
      // requestAnimationFrame(() => {
      //   navigateBack()
      // })
    },
    [dispatch]
  )

  const renderItem = useCallback(
    ({ item: country }: { item: LocalizedCountry }) => (
      <SelectCountryItem
        country={country}
        onSelect={onSelect}
        isSelected={false}
        // isSelected={code === selectedCurrencyCode}
      />
    ),
    [selectedCurrencyCode]
  )

  const inset = useSafeArea()

  return (
    <FlatList
      contentContainerStyle={{ paddingTop: inset.top, paddingBottom: inset.bottom }}
      // contentInsetAdjustmentBehavior="automatic"
      stickyHeaderIndices={[0]}
      style={styles.container}
      data={countries.localizedCountries}
      extraData={selectedCurrencyCode}
      ListHeaderComponent={
        <Text style={styles.title} testID={'ChooseLanguageTitle'}>
          {t('selectCountryCode')}
        </Text>
      }
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  )
}

const styles = StyleSheet.create({
  container: {},
  title: {
    ...fontStyles.h2,
    marginHorizontal: 16,
    paddingTop: 80,
    marginBottom: 16,
  },
})
