import * as React from 'react'
import { StyleSheet, Text, TextInputProps, View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import TextInput from 'src/forms/TextInput'
import { NameSpaces, useTranslation } from 'src/i18n'
import { fonts, standardStyles } from 'src/styles'

type Props = Pick<TextInputProps, 'value' | 'onChange'>

export default React.memo(function Search({ value, onChange }: Props) {
  const { t } = useTranslation(NameSpaces.brand)
  return (
    <View style={[brandStyles.gap, styles.root]}>
      <Text style={[fonts.h5, standardStyles.blockMarginTop, standardStyles.elementalMarginBottom]}>
        {t('icons.searchLabel')}
      </Text>
      <TextInput
        name={'search'}
        style={[standardStyles.input, fonts.p]}
        placeholder={t('icons.searchPlaceholder')}
        accessibilityLabel={'search'}
        value={value}
        onChange={onChange}
        focusStyle={standardStyles.inputFocused}
      />
    </View>
  )
})

export function useSearch() {
  const [query, setQuery] = React.useState('')

  const onQueryChange = React.useCallback(
    (event) => {
      setQuery(event.target.value)
    },
    [setQuery]
  )

  return { query, onQueryChange }
}

const styles = StyleSheet.create({
  root: {
    maxWidth: 500,
  },
})
