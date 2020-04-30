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
  tightTop?: boolean
}

function BookLayout({ label, children, nativeID, endBlock, startBlock, isWide, tightTop }: Props) {
  const margins = {
    desktop: [
      !tightTop && standardStyles.blockMarginTop,
      startBlock && standardStyles.sectionMarginTop,
      endBlock && standardStyles.sectionMarginBottom,
    ],
    tablet: [
      !tightTop && standardStyles.blockMarginTopTablet,
      startBlock && standardStyles.sectionMarginTopTablet,
      endBlock && standardStyles.sectionMarginBottomTablet,
    ],
    mobile: [
      !tightTop && standardStyles.blockMarginTopMobile,
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
