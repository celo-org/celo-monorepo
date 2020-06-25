import SearchInput from '@celo/react-components/components/SearchInput'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { Namespaces } from 'src/i18n'

interface SendSearchInputProps {
  onChangeText: (value: string) => void
}

// Input field for Send screen
export function SendSearchInput(props: SendSearchInputProps) {
  const handleChangeText = (value: string) => {
    setInput(value)
    onChangeText(value)
  }

  const { t } = useTranslation(Namespaces.sendFlow7)
  const { onChangeText } = props
  const [input, setInput] = React.useState('')

  return (
    <View style={styles.textInputContainer}>
      <SearchInput placeholder={t('global:search')} value={input} onChangeText={handleChangeText} />
    </View>
  )
}

const styles = StyleSheet.create({
  textInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
})
