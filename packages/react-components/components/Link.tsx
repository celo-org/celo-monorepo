import Touchable, { Props as TouchableProps } from '@celo/react-components/components/Touchable'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Text, TextStyle } from 'react-native'

type Props = TouchableProps & {
  style?: TextStyle | TextStyle[]
  testID?: string
}

export default class Link extends React.PureComponent<Props> {
  render() {
    const { onPress, style: extraStyle, children, disabled, testID } = this.props
    return (
      <Touchable onPress={onPress} borderless={true} disabled={disabled} testID={testID}>
        <Text style={[fontStyles.bodySmall, fontStyles.link, extraStyle]}>{children}</Text>
      </Touchable>
    )
  }
}
