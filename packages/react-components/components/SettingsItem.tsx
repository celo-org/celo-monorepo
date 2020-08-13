import ListItem from '@celo/react-components/components/ListItem'
import TextInput from '@celo/react-components/components/TextInput.v2'
import ForwardChevron from '@celo/react-components/icons/ForwardChevron'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'

interface WrapperProps {
  testID?: string
  onPress?: () => void
  children: React.ReactNode
}

function Wrapper({ testID, onPress, children }: WrapperProps) {
  return (
    <ListItem testID={testID} onPress={onPress}>
      {children}
    </ListItem>
  )
}

function Title({ value }: { value: string }) {
  return <View style={[styles.left]}>{<Text style={styles.title}>{value}</Text>}</View>
}

type BaseProps = {
  title: string
} & Omit<WrapperProps, 'children'>

type SettingsItemTextValueProps = {
  value?: string
  showChevron?: boolean
} & BaseProps

export function SettingsItemTextValue({
  testID,
  title,
  value,
  showChevron,
  onPress,
}: SettingsItemTextValueProps) {
  return (
    <Wrapper testID={testID} onPress={onPress}>
      <View style={styles.container}>
        <Title value={title} />
        <View style={styles.right}>
          {value && <Text style={styles.value}>{value}</Text>}
          {(value || showChevron) && <ForwardChevron />}
        </View>
      </View>
    </Wrapper>
  )
}

type SettingsItemSwitchProps = {
  value: boolean
  onValueChange: (value: boolean) => void
  details?: string
} & Omit<BaseProps, 'onPress'>

export function SettingsItemSwitch({
  testID,
  title,
  onValueChange,
  value,
  details,
}: SettingsItemSwitchProps) {
  return (
    <Wrapper>
      <View style={styles.container}>
        <Title value={title} />
        <Switch testID={testID} value={value} onValueChange={onValueChange} />
      </View>
      {details && (
        <View>
          <Text style={styles.details}>{details}</Text>
        </View>
      )}
    </Wrapper>
  )
}

type SettingsExpandedItemProps = {
  details?: string
} & BaseProps

export function SettingsExpandedItem({
  testID,
  title,
  details,
  onPress,
}: SettingsExpandedItemProps) {
  return (
    <Wrapper testID={testID} onPress={onPress}>
      <View style={styles.container}>
        <Title value={title} />
      </View>
      {details && (
        <View>
          <Text style={styles.details}>{details}</Text>
        </View>
      )}
    </Wrapper>
  )
}

type SettingsItemInputProps = {
  value: string
  placeholder?: string
  onValueChange: (value: string) => void
} & Omit<BaseProps, 'onPress'>

export function SettingsItemInput({
  testID,
  title,
  onValueChange,
  value,
  placeholder,
}: SettingsItemInputProps) {
  const onFocus = () => {
    setInputColor(colors.dark)
  }
  const onBlur = () => {
    setInputColor(colors.gray4)
  }

  const [inputColor, setInputColor] = React.useState(colors.gray4)
  return (
    <Wrapper>
      <View style={styles.container}>
        <Title value={title} />
        <TextInput
          testID={testID}
          style={styles.input}
          inputStyle={[styles.innerInput, { color: inputColor }]}
          onFocus={onFocus}
          onBlur={onBlur}
          value={value}
          placeholder={placeholder}
          onChangeText={onValueChange}
          showClearButton={false}
        />
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  left: {
    justifyContent: 'center',
  },
  title: {
    ...fontStyles.regular,
    color: colors.dark,
  },
  value: {
    ...fontStyles.regular,
    color: colors.gray4,
    marginRight: 8,
  },
  details: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 16,
    paddingRight: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    justifyContent: 'flex-end',
    paddingLeft: 16,
    flex: 0,
  },
  innerInput: {
    flex: 0,
    minWidth: 160,
    textAlign: 'right',
    paddingVertical: 0,
    color: colors.gray4,
  },
})
