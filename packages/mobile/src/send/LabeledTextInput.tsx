import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { parseInputAmount } from '@celo/utils/src/parsing'
import * as React from 'react'
import { KeyboardType, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native'
import Search from 'src/icons/Search'

interface Props {
  keyboardType: KeyboardType
  title?: string
  placeholder: string
  value: string
  labelStyle?: TextStyle
  placeholderColor?: string
  autoFocus?: boolean
  numberOfDecimals?: number
  onValueChanged(value: string): void
}

type PropsWithRef = {
  innerRef: React.RefObject<TextInput>
} & Props

interface State {
  active: boolean
}
export class LabeledTextInput extends React.Component<PropsWithRef, State> {
  state = {
    active: false,
  }

  onFocus = () => {
    this.setState({ active: true })
  }

  onBlur = () => {
    this.setState({ active: false })

    let value = this.props.value
    if (this.props.keyboardType === 'numeric' && this.props.numberOfDecimals) {
      value = parseInputAmount(value)
        .toFixed(this.props.numberOfDecimals)
        .toString()
    }
    this.props.onValueChanged(value)
  }

  render() {
    const props = this.props
    return (
      <View
        style={[
          componentStyles.inputRow,
          { borderColor: this.state.active ? colors.darkSecondary : colors.darkLightest },
        ]}
      >
        <View style={style.titleContainer}>
          {props.title ? (
            <Text style={[fontStyles.bodySecondary, style.title, props.labelStyle]}>
              {props.title}
            </Text>
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
        <TextInput
          ref={this.props.innerRef}
          style={style.textInput}
          keyboardType={props.keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={props.placeholder}
          underlineColorAndroid="transparent"
          placeholderTextColor={props.placeholderColor || colors.gray}
          multiline={false}
          spellCheck={false}
          value={props.value}
          onChangeText={props.onValueChanged}
          autoFocus={props.autoFocus || false}
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

export default React.forwardRef((props: Props, ref: React.Ref<TextInput>) => (
  <LabeledTextInput innerRef={ref as React.RefObject<TextInput>} {...props} />
))
