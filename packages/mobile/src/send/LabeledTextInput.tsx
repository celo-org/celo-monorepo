/**
 * TextInput with label, such as an input for SendAmount with a dollar sign on
 * the left of the input.  Uses ValidatedTextInput to validate various kinds of
 * input.
 */

import ValidatedTextInput, {
  ValidatorProps,
} from '@celo/react-components/components/ValidatedTextInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { KeyboardType, StyleSheet, Text, TextStyle, View } from 'react-native'
import Search from 'src/icons/Search'

interface OwnProps {
  keyboardType: KeyboardType
  title?: string
  value: string
  numberOfDecimals?: number
  placeholder: string
  lng?: string
  labelStyle?: TextStyle
  placeholderTextColor?: string
  autoFocus?: boolean
  maxLength?: number
  onChangeText(value: string): void
}

type Props = OwnProps & ValidatorProps

interface State {
  active: boolean
}

export default class LabeledTextInput extends React.Component<Props, State> {
  state = {
    active: false,
  }

  onFocus = () => {
    this.setState({ active: true })
  }

  onBlur = () => {
    this.setState({ active: false })
  }

  render() {
    const { title, labelStyle } = this.props
    return (
      <View
        style={[
          componentStyles.inputRow,
          { borderColor: this.state.active ? colors.darkSecondary : colors.darkLightest },
        ]}
      >
        <View style={style.titleContainer}>
          {title ? (
            <Text style={[fontStyles.bodySecondary, style.title, labelStyle]}>{title}</Text>
          ) : (
            <Search />
          )}
        </View>
        <View
          style={[
            style.divider,
            { backgroundColor: this.state.active ? colors.darkSecondary : colors.darkLightest },
          ]}
        />
        <ValidatedTextInput
          placeholderTextColor={colors.gray}
          {...this.props}
          style={style.textInput}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        />
      </View>
    )
  }
}

const style = StyleSheet.create({
  titleContainer: {
    minWidth: 45,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  title: {
    color: colors.darkSecondary,
    alignSelf: 'center',
    lineHeight: 30,
  },
  divider: {
    width: 1,
    height: 35,
  },
  textInput: {
    flex: 1,
    height: 54,
    marginHorizontal: 8,
  },
})
