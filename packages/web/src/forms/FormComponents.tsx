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
} from 'react-native'
import Fade from 'react-reveal/Fade'
import { Cell, Spans } from 'src/layout/GridRow'

import { colors, fonts, standardStyles, textStyles } from 'src/styles'

export function ErrorMessage({ allErrors, field, t }) {
  let key = 'generic'

  if (field === 'email' || key === 'unknownError') {
    key = field
  }

  return allErrors.includes(field) ? (
    <Fade>
      <Text style={[fonts.h5, textStyles.error]}>{t(`validationErrors.${key}`)}</Text>
    </Fade>
  ) : (
    <View style={styles.errorPlaceholder} />
  )
}

export function NameErrorArea({ t, formState, isMobile }) {
  return (
    <Cell
      span={Spans.fourth}
      tabletSpan={Spans.full}
      style={isMobile ? [styles.verticalSpace, styles.alignStart] : styles.validationMessage}
    >
      <ErrorMessage allErrors={formState.errors} field={'name'} t={t} />
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
        <ErrorMessage allErrors={errors} field={fieldName} t={t} />
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
  errorPlaceholder: {
    height: 18,
  },
  errorBorder: {
    borderColor: colors.error,
  },
  input: {
    marginVertical: 0,
  },
  label: {
    color: colors.secondary,
  },
  labelBox: {
    marginBottom: 5,
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
    const currentStyle = this.state.focused ? [style, focusStyle] : style
    return (
      <RNTextInput {...props} onFocus={this.onFocus} onBlur={this.onBlur} style={currentStyle} />
    )
  }
}

interface LabelProps {
  name: string
  multiline?: boolean
  hasError: boolean
  value: string
  label: string
  onInput: () => void
}

export function LabeledInput({ name, multiline, hasError, value, onInput, label }: LabelProps) {
  return (
    <>
      <View style={styles.labelBox}>
        <Text accessibilityRole={'label'} style={[fonts.a, textStyles.medium, styles.label]}>
          {label}
        </Text>
      </View>
      <TextInput
        multiline={multiline}
        numberOfLines={3}
        style={[
          standardStyles.input,
          fonts.p,
          styles.input,
          standardStyles.elementalMarginBottom,
          hasError && styles.errorBorder,
        ]}
        focusStyle={standardStyles.inputFocused}
        name={name}
        value={value}
        onChange={onInput}
      />
    </>
  )
}
