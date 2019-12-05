import * as React from 'react'
import { H3 } from 'src/fonts/Fonts'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { standardStyles } from 'src/styles'

interface Props {
  label: React.ReactNode
  children: React.ReactNode
  nativeID?: string
  endBlock?: boolean
  startBlock?: boolean
  isWide?: boolean
}

function BookLayout({ label, children, nativeID, endBlock, startBlock, isWide }: Props) {
  const margins = {
    desktop: [
      standardStyles.blockMarginTop,
      startBlock && standardStyles.sectionMarginTop,
      endBlock && standardStyles.sectionMarginBottom,
    ],
    tablet: [
      standardStyles.blockMarginTopTablet,
      startBlock && standardStyles.sectionMarginTopTablet,
      endBlock && standardStyles.sectionMarginBottomTablet,
    ],
    mobile: [
      standardStyles.blockMarginTopMobile,
      startBlock && standardStyles.sectionMarginTopMobile,
      endBlock && standardStyles.sectionMarginBottomMobile,
    ],
  }

  return (
    <GridRow
      desktopStyle={margins.desktop}
      tabletStyle={margins.tablet}
      mobileStyle={margins.mobile}
      nativeID={nativeID}
    >
      <Cell span={Spans.fourth}>
        <H3>{label}</H3>
      </Cell>
      <Cell tabletSpan={Spans.three4th} span={isWide ? Spans.three4th : Spans.half}>
        {children}
      </Cell>
    </GridRow>
  )
}

export default React.memo(BookLayout)
