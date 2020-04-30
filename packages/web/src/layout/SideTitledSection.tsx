import * as React from 'react'
import { Text } from 'react-native'
import { H3 } from 'src/fonts/Fonts'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { fonts, standardStyles } from 'src/styles'

interface SectionProps {
  title: string
  text?: string | React.ReactNode
  children?: React.ReactNode
  span?: Spans
  nativeID?: string
}

function SideTitledSection({ title, text, children, span, nativeID }: SectionProps) {
  return (
    <GridRow allStyle={standardStyles.elementalMargin} nativeID={nativeID}>
      <Cell span={Spans.fourth}>
        <H3>{title}</H3>
      </Cell>
      <Cell span={span || Spans.half}>
        <Text style={fonts.p}>{text}</Text>
        {children}
      </Cell>
    </GridRow>
  )
}

export default React.memo(SideTitledSection)
