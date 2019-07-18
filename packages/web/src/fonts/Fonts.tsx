import * as React from 'react'
import { StyleSheet, Text, TextProps, View, ViewProps } from 'react-native'
import Responsive from 'src/shared/Responsive'
import { fonts, standardStyles } from 'src/styles'
interface Props {
  style?: any
  children?: any
  tabIndex?: number
  id?: string
  accessibilityRole?: 'button' | 'label' | 'link' | 'heading' | 'listitem'
}

export const H1 = ({ style, children, tabIndex, accessibilityRole, id }: Props) => {
  return (
    <Responsive large={[styles.reset, fonts.h1, style]}>
      <Text
        id={id}
        tabIndex={tabIndex}
        accessibilityRole={accessibilityRole || 'heading'}
        style={[styles.reset, fonts.h1Mobile, style]}
      >
        {children}
      </Text>
    </Responsive>
  )
}

export const H2 = ({ style, children, tabIndex, accessibilityRole, id }: Props) => {
  return (
    <Responsive large={[styles.reset, fonts.h2, style]}>
      <Text
        id={id}
        accessibilityRole={accessibilityRole || 'heading'}
        tabIndex={tabIndex}
        aria-level="2"
        style={[styles.reset, fonts.h2Mobile, style]}
      >
        {children}
      </Text>
    </Responsive>
  )
}

export const H3 = ({ style, children, tabIndex, accessibilityRole, id }: Props) => {
  return (
    <Responsive large={[styles.reset, fonts.h3, style]}>
      <Text
        id={id}
        tabIndex={tabIndex}
        accessibilityRole={accessibilityRole || 'heading'}
        aria-level="3"
        style={[styles.reset, fonts.h3Mobile, style]}
      >
        {children}
      </Text>
    </Responsive>
  )
}

export const H4 = ({ style, children, tabIndex, accessibilityRole, id }: Props) => {
  return (
    <Responsive large={[styles.reset, fonts.h4, style]}>
      <Text
        id={id}
        tabIndex={tabIndex}
        accessibilityRole={accessibilityRole || 'heading'}
        aria-level="4"
        style={[styles.reset, fonts.h4Mobile, style]}
      >
        {children}
      </Text>
    </Responsive>
  )
}

interface ViewChildren {
  children: React.ReactNode
}
interface TextChildren {
  children: React.ReactNode | string
}

export function Ul(props: ViewProps & ViewChildren) {
  return (
    <View style={[styles.ul, props.style]} accessibilityRole={'list'}>
      {props.children}
    </View>
  )
}

export function Li(props: TextProps & TextChildren) {
  const style = StyleSheet.flatten([
    styles.bullet,
    fonts.p,
    standardStyles.elementalMarginBottom,
    props.style,
  ])
  return (
    <Text style={style} accessibilityRole={'listitem'}>
      {props.children}
    </Text>
  )
}

const styles = StyleSheet.create({
  reset: {
    textTransform: 'none',
  },
  bullet: {
    listStyle: 'disc',
    display: 'list-item',
  },
  ul: {
    marginTop: 20,
    paddingLeft: 20,
  },
})
