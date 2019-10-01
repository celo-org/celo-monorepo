// HOC to add a label (e.g. an icon or a currency code) to a text input

import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { StyleSheet, Text, TextInputProps, TextStyle, View } from 'react-native'

interface LabeledInputProps {
  value: string
  labelStyle?: TextStyle
  title?: string
  icon?: React.ReactNode
  // keyboardType: KeyboardType
  // numberOfDecimals?: number
  // placeholder: string
  // lng?: string
  // placeholderTextColor?: string
  // autoFocus?: boolean
  // maxLength?: number
}

// type Props = OwnProps & TextInputProps

// interface State {
//   active: boolean
// }

// const withLoading = <P extends object>(
//   Component: React.ComponentType<P>
// ): React.FC<P & WithLoadingProps> => ({
//   loading,
//   ...props
// }: WithLoadingProps) =>
//   loading ? <LoadingSpinner /> : <Component {...props as P} />;

// interface WithLoadingProps {
//   loading: boolean
// }

// const withLoading = <P extends object>(Component: React.ComponentType<P>) =>
//   class WithLoading extends React.Component<P & WithLoadingProps> {
//     render() {
//       const { loading, ...props } = this.props
//       return loading ? <LoadingSpinner /> : <Component {...props as P} />
//     }
//   }

export default function withTextInputLabeling<P extends TextInputProps>(
  WrappedTextInput: React.ComponentType<P>
) {
  return class WithTextInputLabeling extends React.Component<P & LabeledInputProps> {
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
      const { icon, title, labelStyle } = this.props
      const { active } = this.state

      if (!title && !icon) {
        throw new Error('Must provide either icon or title for labeled text input')
      }

      return (
        <View
          style={[
            componentStyles.inputRow,
            { borderColor: active ? colors.darkSecondary : colors.darkLightest },
          ]}
        >
          <View style={style.titleContainer}>
            {icon ? (
              icon
            ) : (
              <Text style={[fontStyles.bodySecondary, style.title, labelStyle]}>{title}</Text>
            )}
          </View>
          <View
            style={[
              style.divider,
              { backgroundColor: active ? colors.darkSecondary : colors.darkLightest },
            ]}
          />
          <WrappedTextInput
            placeholderTextColor={colors.gray}
            {...this.props} // would rather use passThroughProps here but TS doesn't like it
            onFocus={this.onFocus}
            onBlur={this.onBlur}
          />
        </View>
      )
    }
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
})
