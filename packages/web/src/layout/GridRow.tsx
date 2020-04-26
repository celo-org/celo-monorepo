import * as React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import Responsive from 'src/shared/Responsive'

interface GridProps {
  nativeID?: string
  mobileStyle?: ViewStyle | ViewStyle[]
  tabletStyle?: ViewStyle | ViewStyle[]
  desktopStyle?: ViewStyle | ViewStyle[]
  allStyle?: ViewStyle | ViewStyle[]
  children: React.ReactNode
}

const gap = 20.0

export enum Spans {
  fourth = 'fourth',
  third = 'third',
  twoThird = 'twoThird',
  half = 'half',
  three4th = 'three4th',
  full = 'full',
}

export function GridRow(props: GridProps) {
  return (
    <Responsive
      large={[props.allStyle, styles.desktop, props.desktopStyle]}
      medium={[props.allStyle, styles.tablet, props.desktopStyle, props.tabletStyle]}
    >
      <View nativeID={props.nativeID} style={[props.allStyle, styles.mobile, props.mobileStyle]}>
        {props.children}
      </View>
    </Responsive>
  )
}

const styles = StyleSheet.create({
  mobile: {
    alignSelf: 'center',
    flexDirection: 'column',
    paddingHorizontal: gap / 2,
    width: '100%',
    maxWidth: '100vw',
  },
  tablet: {
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: gap,
    width: '100%',
    maxWidth: 958 + gap,
  },
  desktop: {
    alignSelf: 'center',
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1080 + gap,
  },
})

interface CellProps {
  children: React.ReactNode
  span: Spans
  tabletSpan?: Spans
  mobileSpan?: Spans
  style?: ViewStyle | ViewStyle[]
}

export function Cell(props: CellProps) {
  return (
    <Responsive
      large={[cellStyle.base, cellStyle[props.span], props.style]}
      medium={[cellStyle.base, cellStyle[props.span], cellStyle[props.tabletSpan], props.style]}
    >
      <View style={[cellStyle.base, cellStyle.mobile, cellStyle[props.mobileSpan], props.style]}>
        {props.children}
      </View>
    </Responsive>
  )
}

export const cellStyle = StyleSheet.create({
  base: { padding: gap / 2, flexGrow: 0, flexShrink: 0 },
  fourth: { width: '25%' },
  third: { width: '33.333%' },
  twoThird: { width: '66.666%' },
  half: { width: '50%' },
  three4th: { width: '75%' },
  full: { flexBasis: '100%', width: '100%' },
  mobile: { width: '100%' },
})
