import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProperties,
  TouchableOpacity,
  View,
} from 'react-native'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
interface FieldProps {
  label: string
  value?: string
  onChange?: (value: string) => void
  children?: any
  last?: boolean
  autoCapitalize?: TextInputProperties['autoCapitalize']
  returnKeyType?: TextInputProperties['returnKeyType']
  secureTextEntry?: TextInputProperties['secureTextEntry']
  onSubmitEditing?: TextInputProperties['onSubmitEditing']
  onBlur?: TextInputProperties['onBlur']
  defaultValue?: TextInputProperties['defaultValue']
  multiline?: boolean
  lineHeight?: number
  editable?: boolean
  keyboardType?: TextInputProperties['keyboardType']
  testID?: string
}

class Field extends React.Component<FieldProps> {
  comment: any

  focusComment = () => {
    if (this.comment) {
      this.comment.focus()
    }
  }

  recordFocus = () => {
    CeloAnalytics.track(DefaultEventNames.fieldFocused, this.props)
  }

  render() {
    const {
      label,
      last,
      value,
      onChange,
      autoCapitalize,
      returnKeyType,
      secureTextEntry,
      onSubmitEditing,
      onBlur,
      defaultValue,
      multiline,
      lineHeight,
      editable,
      keyboardType,
      testID,
    } = this.props
    return (
      <View
        style={[
          style.row,
          last ? { borderBottomWidth: 0 } : {},
          lineHeight ? { height: lineHeight } : { height: 62 },
        ]}
      >
        <TouchableOpacity onPress={this.focusComment} style={style.labelContainer}>
          <Text style={style.label}>{label}</Text>
        </TouchableOpacity>
        {React.Children.count(this.props.children) > 0 ? (
          this.props.children
        ) : (
          // TODO: Create CeloTextInput component that wraps TextInputs
          <TextInput
            ref={(r) => (this.comment = r)}
            onChangeText={onChange}
            onFocus={this.recordFocus}
            value={value}
            style={[style.input, { height: lineHeight }]}
            placeholderTextColor={colors.gray}
            underlineColorAndroid="transparent"
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            secureTextEntry={secureTextEntry}
            onSubmitEditing={onSubmitEditing}
            onBlur={onBlur}
            defaultValue={defaultValue}
            multiline={multiline}
            enablesReturnKeyAutomatically={true}
            editable={editable}
            keyboardType={keyboardType}
            testID={testID}
          />
        )}
      </View>
    )
  }
}

const style = StyleSheet.create({
  row: {
    borderBottomWidth: variables.borderWidth,
    borderColor: colors.listBorderColor,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  labelContainer: {
    backgroundColor: 'transparent',
  },
  label: {
    marginHorizontal: variables.contentPadding * 2,
    color: colors.inputLabelColor,
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: '#555',
    fontSize: 16,
  },
})

export default Field
