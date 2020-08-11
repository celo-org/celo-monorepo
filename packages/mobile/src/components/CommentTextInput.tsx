import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import {
  Keyboard,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
} from 'react-native'
import { MAX_COMMENT_LENGTH } from 'src/config'
import i18n, { Namespaces } from 'src/i18n'

interface Props {
  testID?: string
  comment: string
  onCommentChange: (comment: string) => void
  onBlur: () => void
}

export default function CommentTextInput({ testID, onCommentChange, comment, onBlur }: Props) {
  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter') {
      Keyboard.dismiss()
    }
  }

  return (
    <TextInput
      testID={`commentInput/${testID}`}
      style={styles.inputContainer}
      autoFocus={false}
      multiline={true}
      numberOfLines={5}
      maxLength={MAX_COMMENT_LENGTH}
      onChangeText={onCommentChange}
      value={comment}
      placeholder={i18n.t('addDescription', { ns: Namespaces.sendFlow7 })}
      placeholderTextColor={colors.greenUI}
      returnKeyType={'done'}
      onKeyPress={onKeyPress}
      onBlur={onBlur}
    />
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    // Fixed height to increase surface area for input
    // to focus on press
    height: 100,
    textAlignVertical: 'top',
    alignSelf: 'stretch',
    ...fontStyles.large,
  },
})
