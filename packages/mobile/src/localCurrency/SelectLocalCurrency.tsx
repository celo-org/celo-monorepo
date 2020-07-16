import SelectionOption from '@celo/react-components/components/SelectionOption'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import i18n, { Namespaces } from 'src/i18n'
import { selectPreferredCurrency } from 'src/localCurrency/actions'
import { LOCAL_CURRENCY_CODES, LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'

const DEFAULT_CURRENCY_CODE = LocalCurrencyCode.USD

function keyExtractor(item: LocalCurrencyCode) {
  return item
}

function SelectLocalCurrency() {
  // tslint:disable-next-line: react-hooks-nesting
  const selectedCurrencyCode = useLocalCurrencyCode() || DEFAULT_CURRENCY_CODE
  const dispatch = useDispatch()
  const { t } = useTranslation(Namespaces.accountScreen10)

  const onSelect = (code: string) => {
    dispatch(selectPreferredCurrency(code as LocalCurrencyCode))

    // Wait for next frame before navigating back
    // so the user can see the changed selection briefly
    requestAnimationFrame(() => {
      navigateBack()
    })
  }

  const renderItem = ({ item: code }: ListRenderItemInfo<LocalCurrencyCode>) => {
    return (
      <SelectionOption
        key={code}
        text={code}
        onSelect={onSelect}
        isSelected={code === selectedCurrencyCode}
        data={code}
      />
    )
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <Text style={styles.title} testID={'ChooseLanguageTitle'}>
          {t('selectCurrency')}
        </Text>
        <FlatList
          style={styles.container}
          data={LOCAL_CURRENCY_CODES}
          extraData={selectedCurrencyCode}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
        />
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  title: {
    ...fontStyles.h2,
    margin: 16,
  },
})

SelectLocalCurrency.navigationOptions = () => ({
  ...headerWithBackButton,
  headerTitle: i18n.t('global:localCurrencyTitle'),
})

export default SelectLocalCurrency
