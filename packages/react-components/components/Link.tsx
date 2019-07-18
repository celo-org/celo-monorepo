import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Text, TextStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native'

type Props = TouchableOpacityProps & {
  style?: TextStyle | TextStyle[]
  testID?: string
}

export default class Link extends React.Component<Props> {
  render() {
    const { onPress, style: extraStyle, children, disabled, testID } = this.props
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID}>
        <Text style={[fontStyles.bodySmall, fontStyles.link, extraStyle]}>{children}</Text>
      </TouchableOpacity>
    )
  }
}
