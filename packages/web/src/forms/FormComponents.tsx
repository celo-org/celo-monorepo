import * as React from 'react'
import {
  createElement,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native'
import { Cell, Spans } from 'src/layout/GridRow'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import { ErrorMessage } from './ErrorDisplay'

export function NameErrorArea({ formState, isMobile }) {
  return (
    <Cell
      span={Spans.fourth}
      tabletSpan={Spans.full}
      style={isMobile ? [styles.verticalSpace, styles.alignStart] : styles.validationMessage}
    >
      <ErrorMessage allErrors={formState.errors} field={'name'} />
    </Cell>
  )
}

export function Form(props: ViewProps & { children: React.ReactNode }) {
  return createElement('form', props)
}

interface FieldProps {
  fieldName: string
  onChange: (x?: any) => unknown
  errors: string[]
  t: (string: string) => string
  value: string
  multiline?: boolean
  isMobile: boolean
}

export function HolisticField({
  fieldName,
  onChange,
  errors,
  t,
  value,
  multiline,
  isMobile,
}: FieldProps) {
  const borderStyle = errors.includes(fieldName) && styles.errorBorder
  return (
    <>
      <Cell
        span={Spans.fourth}
        tabletSpan={Spans.full}
        style={isMobile ? [styles.verticalSpace, styles.alignStart] : styles.validationMessage}
      >
        <ErrorMessage allErrors={errors} field={fieldName} />
      </Cell>
      <Cell
        span={Spans.half}
        tabletSpan={Spans.full}
        style={isMobile ? styles.zeroVertical : styles.verticalSpace}
      >
        <TextInput
          focusStyle={standardStyles.inputFocused}
          multiline={multiline}
          numberOfLines={3}
          style={[standardStyles.input, fonts.p, styles.input, borderStyle]}
          placeholder={t(`form.${fieldName}`)}
          placeholderTextColor={colors.placeholderGray}
          name={fieldName}
          value={value}
          onChange={onChange}
          required={true}
        />
      </Cell>
    </>
  )
}

export const styles = StyleSheet.create({
  alignStart: {
    alignItems: 'flex-start',
  },
  validationMessage: {
    alignItems: 'flex-end',
  },
  verticalSpace: {
    paddingTop: 1,
  },
  zeroVertical: {
    paddingVertical: 1,
  },
  errorBorder: {
    borderColor: colors.error,
  },
  input: {
    marginVertical: 0,
  },
  label: {
    color: colors.secondary,
    lineHeight: 20,
  },
})

interface TextInputState {
  focused: boolean
}

interface TextInputAuxProps {
  focusStyle: TextStyle
}

type FocusEvent = NativeSyntheticEvent<TextInputFocusEventData>

export class TextInput extends React.Component<TextInputProps & TextInputAuxProps, TextInputState> {
  state = { focused: false }

  onFocus = (e: FocusEvent) => {
    this.setState({ focused: true })
    if (this.props.onFocus) {
      this.props.onFocus(e)
    }
  }

  onBlur = (e: FocusEvent) => {
    this.setState({ focused: false })
    if (this.props.onBlur) {
      this.props.onBlur(e)
    }
  }

  render() {
    const { style, focusStyle, ...props } = this.props
    const currentStyle = this.state.focused ? StyleSheet.flatten([style, focusStyle]) : style
    return (
      <RNTextInput {...props} onFocus={this.onFocus} onBlur={this.onBlur} style={currentStyle} />
    )
  }
}

interface CheckboxProps {
  checked: boolean
  name: string
  onPress: (x: any) => void
}

export function Checkbox({ checked, onPress, name }: CheckboxProps) {
  return (
    <View style={checkBoxStyles.border}>
      <Text
        style={[
          checkBoxStyles.checkMark,
          checked ? checkBoxStyles.checkMarkChecked : checkBoxStyles.hidden,
        ]}
      >
        ✓
      </Text>
      {createElement('input', {
        type: 'checkbox',
        name,
        checked,
        onClick: onPress,
        style: checkBoxStyles.hidden,
      })}
    </View>
  )
}

interface NativeLabelProps {
  children: React.ReactNode
  for: string
  onPress: (x: any) => void
  style?: ViewStyle
}

export function Label({ children, for: htmlFor, onPress, style }: NativeLabelProps) {
  return createElement('label', { for: htmlFor, name: htmlFor, children, onClick: onPress, style })
}

export function CheckboxWithLabel({
  checked,
  onPress,
  name,
  label,
}: CheckboxProps & { label: string }) {
  return (
    <View style={standardStyles.row}>
      <Checkbox checked={checked} onPress={onPress} name={name} />

      <Text style={[fonts.a, textStyles.medium, styles.label]}>
        <Label for={name} onPress={onPress} style={checkBoxStyles.label}>
          {label}
        </Label>
      </Text>
    </View>
  )
}

const checkBoxStyles = StyleSheet.create({
  border: {
    paddingHorizontal: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  checkMark: {
    color: colors.gray,
    position: 'absolute',
    transform: [{ translateY: -2 }, { translateX: 1 }],
    transitionProperty: 'opacity',
    transitionDuration: '100ms',
  },
  checkMarkChecked: {
    opacity: 1,
  },
  hidden: { opacity: 0 },
  label: { paddingHorizontal: 10 },
})
