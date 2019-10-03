import SelectionOption from '@celo/react-components/components/SelectionOption'
import React, { useCallback } from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import i18n from 'src/i18n'
import { selectPreferredCurrency } from 'src/localCurrency/actions'
import { LOCAL_CURRENCY_CODES, LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'

const DEFAULT_CURRENCY_CODE = LocalCurrencyCode.USD

const keyExtractor = (item: LocalCurrencyCode) => item

function SelectLocalCurrency() {
  const selectedCurrencyCode = useLocalCurrencyCode() || DEFAULT_CURRENCY_CODE
  const dispatch = useDispatch()

  const onSelect = useCallback(
    (code) => {
      dispatch(selectPreferredCurrency(code))

      // Wait for next frame before navigating back
      // so the user can see the changed selection briefly
      requestAnimationFrame(() => {
        navigateBack()
      })
    },
    [dispatch]
  )

  const renderItem = useCallback(
    ({ item: code }) => (
      <SelectionOption
        word={code}
        onSelectAnswer={onSelect}
        selected={code === selectedCurrencyCode}
        data={code}
      />
    ),
    [selectedCurrencyCode]
  )

  return (
    <FlatList
      style={styles.container}
      data={LOCAL_CURRENCY_CODES}
      extraData={selectedCurrencyCode}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
    />
  )
}

const styles = StyleSheet.create({
  container: {},
})

SelectLocalCurrency.navigationOptions = () => ({
  ...headerWithCancelButton,
  headerTitle: i18n.t('global:localCurrencyTitle'),
})

export default SelectLocalCurrency
