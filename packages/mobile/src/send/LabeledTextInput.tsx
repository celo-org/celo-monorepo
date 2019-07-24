import ValidatedTextInput, {
  ValidatorProps,
} from '@celo/react-components/components/ValidatedTextInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { KeyboardType, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native'
import Search from 'src/icons/Search'

interface OwnProps {
  autocorrect?: boolean
  keyboardType: KeyboardType
  title?: string
  placeholder: string
  value: string
  labelStyle?: TextStyle
  placeholderTextColor?: string
  autoFocus?: boolean
  numberOfDecimals?: number
  onChangeText(value: string): void
}

interface RefProps {
  innerRef?: React.RefObject<TextInput>
}

type Props = OwnProps & RefProps & ValidatorProps
interface State {
  active: boolean
}
export class LabeledTextInput extends React.Component<Props, State> {
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
        <ValidatedTextInput
          placeholderTextColor={colors.gray}
          {...this.props}
          ref={this.props.innerRef}
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

export default React.forwardRef((props: Props, ref: React.Ref<TextInput>) => (
  <LabeledTextInput innerRef={ref as React.RefObject<TextInput>} {...props} />
))
