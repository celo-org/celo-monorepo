import TextInput, { TextInputProps } from '@celo/react-components/components/TextInput'
import withTextInputLabeling from '@celo/react-components/components/WithTextInputLabeling'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import colors from '@celo/react-components/styles/colors'
import { isValidAddress } from '@celo/utils/src/address'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import Search from 'src/icons/Search'

const RecipientSearchInput = withTextInputPasteAware(
  withTextInputLabeling<TextInputProps>(TextInput),
  { right: 22 }
)

interface SendSearchInputProps {
  isPhoneEnabled: boolean
  onChangeText: (value: string) => void
}

// Input field for Send screen
export function SendSearchInput(props: SendSearchInputProps) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const { isPhoneEnabled, onChangeText } = props
  const [input, setInput] = React.useState('')

  const handleChangeText = React.useCallback(
    (value: string) => {
      setInput(value)
      onChangeText(value)
    },
    [setInput]
  )

  return (
    <View style={styles.textInputContainer}>
      <RecipientSearchInput
        placeholder={isPhoneEnabled ? t('nameOrPhoneNumber') : t('walletAddress')}
        value={input}
        onChangeText={handleChangeText}
        icon={isPhoneEnabled ? <Search /> : undefined}
        title={isPhoneEnabled ? undefined : t('global:to')}
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
