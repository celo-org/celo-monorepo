import * as React from 'react'
import { Text, View } from 'react-native'

import Responsive from 'src/shared/Responsive'
import { TextStyles } from 'src/shared/Styles'

interface Props {
  style?: any
  children?: any
  tabIndex?: number
  accessibilityRole?: 'button' | 'label' | 'link' | 'heading' | 'listitem'
}

export const ResponsiveText = (props: Props) => {
  const { style, children } = props

  return (
    <Responsive medium={[TextStyles.main, style]}>
      <Text {...props} style={[TextStyles.smallMain, style]}>
        {children}
      </Text>
    </Responsive>
  )
}

export const ResponsiveH1 = ({ style, children }: Props) => {
  return (
    <Responsive medium={[TextStyles.largeHeader, style]}>
      <Text style={[TextStyles.mediumMain, style]}>{children}</Text>
    </Responsive>
  )
}

export const ResponsiveH2 = ({ style, children }: Props) => {
  return (
    <Responsive medium={[TextStyles.mediumHeader, style]}>
      <Text style={[TextStyles.mediumMain, style]}>{children}</Text>
    </Responsive>
  )
}

export const ResponsiveH3 = ({ style, children }: Props) => {
  return (
    <Responsive medium={[TextStyles.sectionHeader, style]}>
      <Text style={[TextStyles.mediumMain, style]}>{children}</Text>
    </Responsive>
  )
}
export const ResponsiveH4 = ({ style, children }: Props) => {
  return (
    <Responsive medium={[TextStyles.smallerSectionHeader, style]}>
      <Text style={[TextStyles.smallMain, style]}>{children}</Text>
    </Responsive>
  )
}

export const P = ({ style, children }: Props) => {
  return <Text style={[TextStyles.smallMain, TextStyles.p, style]}>{children}</Text>
}

export const UL = ({ style, children }: Props) => {
  return <View style={[TextStyles.ul, style]}>{children}</View>
}

export const LI = ({ style, children }: Props) => {
  return (
    <View style={TextStyles.li}>
      <Text style={TextStyles.smallMain}>{`\u2022`}</Text>
      <Text style={[TextStyles.smallMain, TextStyles.liText, style]}>{children}</Text>
    </View>
  )
}

export const B = ({ style, children }: Props) => {
  return <Text style={[TextStyles.smallMain, TextStyles.bold, style]}>{children}</Text>
}

export const TABLE = ({ style, children }: Props) => {
  return <View style={[TextStyles.table, style]}>{children}</View>
}

export const TR = ({ style, children }: Props) => {
  return <View style={[TextStyles.tr, style]}>{children}</View>
}

export const TH = ({ style, children }: Props) => {
  return <Text style={[TextStyles.smallMain, TextStyles.th, style]}>{children}</Text>
}

export const TD = ({ style, children }: Props) => {
  return <Text style={[TextStyles.smallMain, TextStyles.td, style]}>{children}</Text>
}
