import TextInput, { TextInputProps } from '@celo/react-components/components/TextInput'
import withTextInputLabeling from '@celo/react-components/components/WithTextInputLabeling'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import colors from '@celo/react-components/styles/colors'
import { isValidAddress } from '@celo/utils/src/address'
import { TranslationFunction } from 'i18next'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Search from 'src/icons/Search'

const RecipientSearchInput = withTextInputPasteAware(
  withTextInputLabeling<TextInputProps>(TextInput),
  { right: 22 }
)

interface SendSearchInputProps {
  isPhoneEnabled: boolean
  onInputChange: (value: string) => void
  t: TranslationFunction
}

// Input field for Send screen
export function SendSearchInput(props: SendSearchInputProps) {
  const { isPhoneEnabled, onInputChange, t } = props
  const [input, setInput] = React.useState('')

  const handleInputChanged = React.useCallback(
    (value: string) => {
      setInput(value)
      onInputChange(value)
    },
    [setInput]
  )

  return (
    <View style={styles.textInputContainer}>
      <RecipientSearchInput
        placeholder={isPhoneEnabled ? t('nameOrPhoneNumber') : t('walletAddress')}
        value={input}
        onChangeText={handleInputChanged}
        icon={isPhoneEnabled ? <Search /> : <Search />}
        style={styles.textInput}
        shouldShowClipboard={isValidAddress}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  textInputContainer: {
    paddingBottom: 5,
    borderBottomColor: colors.listBorder,
    borderBottomWidth: 1,
  },
  textInput: {
    alignSelf: 'center',
    color: colors.dark,
    height: 54,
    marginHorizontal: 8,
  },
})
