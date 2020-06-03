import colors from '@celo/react-components/styles/colors.v2'
import * as React from 'react'
import {
  Keyboard,
  NativeSyntheticEvent,
  StyleProp,
  TextInput,
  TextInputKeyPressEventData,
  TextStyle,
} from 'react-native'
import { MAX_COMMENT_LENGTH } from 'src/config'
import i18n, { Namespaces } from 'src/i18n'

interface Props {
  testID?: string
  comment: string
  style: StyleProp<TextStyle>
  onCommentChange: (comment: string) => void
  onBlur: () => void
}

export default function CommentTextInput({
  testID,
  onCommentChange,
  comment,
  onBlur,
  style,
}: Props) {
  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter') {
      Keyboard.dismiss()
    }
  }

  return (
    <TextInput
      testID={`commentInput/${testID}`}
      style={style}
      autoFocus={true}
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
