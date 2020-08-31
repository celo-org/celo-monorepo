import Card from '@celo/react-components/components/Card'
import TextInput from '@celo/react-components/components/TextInput.v2'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { Shadow, Spacing } from '@celo/react-components/styles/styles.v2'
import React, { useLayoutEffect } from 'react'
import {
  ActivityIndicator,
  LayoutAnimation,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import ClipboardAwarePasteButton from 'src/components/ClipboardAwarePasteButton'
import { useClipboard } from 'src/utils/useClipboard'

export enum CodeInputStatus {
  DISABLED, // input disabled
  INPUTTING, // input enabled
  PROCESSING, // is the inputted code being processed
  RECEIVED, // is the inputted code received but not yet confirmed
  ACCEPTED, // has the code been accepted and completed
}

export interface Props {
  label: string
  status: CodeInputStatus
  inputValue: string
  inputPlaceholder: string
  inputPlaceholderWithClipboardContent?: string
  onInputChange: (value: string) => void
  shouldShowClipboard: (value: string) => boolean
  multiline?: boolean
  testID?: string
  style?: StyleProp<ViewStyle>
}

export default function CodeInput({
  label,
  status,
  inputValue,
  inputPlaceholder,
  inputPlaceholderWithClipboardContent,
  onInputChange,
  shouldShowClipboard,
  multiline,
  testID,
  style,
}: Props) {
  const clipboardContent = useClipboard()

  // LayoutAnimation when switching to/from input
  useLayoutEffect(() => {
    LayoutAnimation.easeInEaseOut()
  }, [status === CodeInputStatus.INPUTTING])

  function shouldShowClipboardInternal(clipboard: string) {
    return (
      !inputValue.toLowerCase().startsWith(clipboard.toLowerCase()) &&
      shouldShowClipboard(clipboard)
    )
  }

  const showInput = status === CodeInputStatus.INPUTTING
  const showSpinner = status === CodeInputStatus.PROCESSING || status === CodeInputStatus.RECEIVED
  const showCheckmark = status === CodeInputStatus.ACCEPTED
  const showStatus = showCheckmark || showSpinner

  return (
    <Card
      rounded={true}
      shadow={showInput ? Shadow.SoftLight : null}
      style={[showInput ? styles.containerActive : styles.container, style]}
    >
      {/* These views cannot be combined as it will cause the shadow to be clipped on iOS */}
      <View style={styles.containRadius}>
        <View style={showInput ? styles.contentActive : styles.content}>
          <View style={styles.innerContent}>
            <Text style={showInput ? styles.labelActive : styles.label}>{label}</Text>
            {showInput ? (
              <TextInput
                value={inputValue}
                placeholder={
                  inputPlaceholderWithClipboardContent &&
                  shouldShowClipboardInternal(clipboardContent)
                    ? inputPlaceholderWithClipboardContent
                    : inputPlaceholder
                }
                onChangeText={onInputChange}
                multiline={multiline}
                testID={testID}
              />
            ) : (
              <Text style={styles.codeValue} numberOfLines={1}>
                {inputValue || ' '}
              </Text>
            )}
          </View>
          {showStatus && (
            <View style={styles.statusContainer}>
              {showSpinner && <ActivityIndicator size="small" color={colors.greenUI} />}
              {showCheckmark && <Checkmark />}
            </View>
          )}
        </View>
        {showInput && (
          <ClipboardAwarePasteButton
            clipboardContent={clipboardContent}
            shouldShow={shouldShowClipboardInternal}
            onPress={onInputChange}
          />
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    backgroundColor: 'rgba(103, 99, 86, 0.1)',
  },
  containerActive: {
    padding: 0,
  },
  // Applying overflow 'hidden' to `Card` also hides its shadow
  // that's why we're using a separate container
  containRadius: {
    borderRadius: Spacing.Smallest8,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
    paddingVertical: Spacing.Small12,
  },
  contentActive: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.Regular16,
    paddingBottom: 4,
  },
  innerContent: {
    flex: 1,
  },
  label: {
    ...fontStyles.label,
    color: colors.onboardingBrownLight,
    opacity: 0.5,
    marginBottom: 4,
  },
  labelActive: {
    ...fontStyles.label,
  },
  codeValue: {
    ...fontStyles.regular,
    color: colors.onboardingBrownLight,
  },
  statusContainer: {
    width: 32,
    marginLeft: 4,
  },
})
