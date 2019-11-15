import TextInput from '@celo/react-components/components/TextInput'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

const CodeInput = withTextInputPasteAware(TextInput)

export enum CodeRowStatus {
  DISABLED, // input disabled
  INPUTTING, // input enabled
  PROCESSING, // is the inputted code being processed
  RECEIVED, // is the inputted code recieved but not yet confirmed
  ACCEPTED, // has the code been accepted and completed
}

export interface CodeRowProps {
  status: CodeRowStatus
  inputValue: string
  inputPlaceholder: string
  onInputChange: (value: string) => void
  shouldShowClipboard: (value: string) => boolean
}

function CodeRow({
  status,
  inputValue,
  inputPlaceholder,
  onInputChange,
  shouldShowClipboard,
}: CodeRowProps) {
  if (status === CodeRowStatus.DISABLED) {
    return (
      <View style={styles.codeInputDisabledContainer}>
        <Text style={styles.codeValue}>{inputPlaceholder}</Text>
      </View>
    )
  }

  if (status === CodeRowStatus.INPUTTING) {
    return (
      <CodeInput
        value={inputValue}
        placeholder={inputPlaceholder}
        shouldShowClipboard={shouldShowClipboard}
        onChangeText={onInputChange}
        style={styles.codeInput}
      />
    )
  }

  if (status === CodeRowStatus.PROCESSING) {
    return (
      <View style={styles.codeInputContainer}>
        <Text style={styles.codeInput}>{inputValue.substr(0, 15) + '...'}</Text>
        <ActivityIndicator size="small" color={colors.celoGreen} style={styles.codeInputSpinner} />
      </View>
    )
  }

  if (status >= CodeRowStatus.RECEIVED) {
    return (
      <View style={styles.codeContainer}>
        <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode={'tail'}>
          {inputValue}
        </Text>
        {status === CodeRowStatus.ACCEPTED && (
          <View style={styles.checkmarkContainer}>
            <Checkmark height={20} width={20} />
          </View>
        )}
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  codeContainer: {
    justifyContent: 'center',
    marginVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.darkLightest,
    borderRadius: 3,
    height: 50,
  },
  checkmarkContainer: {
    backgroundColor: colors.darkLightest,
    position: 'absolute',
    top: 3,
    right: 3,
    padding: 10,
  },
  codeInputContainer: {
    position: 'relative',
  },
  codeInput: {
    flex: 0,
    backgroundColor: '#FFF',
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    marginVertical: 5,
  },
  codeInputSpinner: {
    backgroundColor: '#FFF',
    position: 'absolute',
    top: 9,
    right: 3,
    padding: 10,
  },
  codeInputDisabledContainer: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginVertical: 5,
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    backgroundColor: '#F0F0F0',
  },
  codeValue: {
    ...fontStyles.body,
    fontSize: 15,
    color: colors.darkSecondary,
  },
})

export default CodeRow
