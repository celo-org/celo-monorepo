import * as React from 'react'
import { TouchableWithoutFeedbackProps } from 'react-native'
import PlatformTouchable from 'react-native-platform-touchable'

export interface Props extends TouchableWithoutFeedbackProps {
  borderless?: boolean
  children: React.ReactNode // must only have one direct child. see https://github.com/react-native-community/react-native-platform-touchable#touchable
}

export default function Touchable({ borderless, ...passThroughProps }: Props) {
  const background = borderless
    ? PlatformTouchable.SelectableBackgroundBorderless()
    : PlatformTouchable.SelectableBackground()
  return <PlatformTouchable {...passThroughProps} background={background} />
}
