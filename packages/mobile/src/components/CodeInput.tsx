import Card from '@celo/react-components/components/Card'
import TextInput, { LINE_HEIGHT } from '@celo/react-components/components/TextInput'
import Checkmark from '@celo/react-components/icons/Checkmark'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Shadow, Spacing } from '@celo/react-components/styles/styles'
import React, { useLayoutEffect } from 'react'
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
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
  numberOfLines?: number
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
  numberOfLines,
  testID,
  style,
}: Props) {
  const [forceShowingPasteIcon, clipboardContent, getFreshClipboardContent] = useClipboard()

  // LayoutAnimation when switching to/from input
  useLayoutEffect(() => {
    LayoutAnimation.easeInEaseOut()
  }, [status === CodeInputStatus.INPUTTING])

  function shouldShowClipboardInternal() {
    if (forceShowingPasteIcon) {
      return true
    }
    return (
      !inputValue.toLowerCase().startsWith(clipboardContent.toLowerCase()) &&
      shouldShowClipboard(clipboardContent)
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
                  inputPlaceholderWithClipboardContent && shouldShowClipboardInternal()
                    ? inputPlaceholderWithClipboardContent
                    : inputPlaceholder
                }
                onChangeText={onInputChange}
                multiline={multiline}
                // This disables keyboard suggestions on iOS, but unfortunately NOT on Android
                // Though `InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS` is correctly set on the native input,
                // most Android keyboards ignore it :/
                autoCorrect={false}
                // On Android, the only known hack for now to disable keyboard suggestions
                // is to set the keyboard type to 'visible-password' which sets `InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD`
                // on the native input. Though it doesn't work in all cases (see https://stackoverflow.com/a/33227237/158525)
                // and has the unfortunate drawback of breaking multiline autosize.
                // We use numberOfLines to workaround this last problem.
                keyboardType={Platform.OS === 'android' ? 'visible-password' : undefined}
                // numberOfLines is currently Android only on TextInput
                // workaround is to set the minHeight on iOS :/
                numberOfLines={Platform.OS === 'ios' ? undefined : numberOfLines}
                inputStyle={
                  Platform.OS === 'ios' && numberOfLines
                    ? {
                        minHeight: LINE_HEIGHT * numberOfLines,
                      }
                    : undefined
                }
                autoCapitalize="none"
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
            getClipboardContent={getFreshClipboardContent}
            shouldShow={shouldShowClipboardInternal()}
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
