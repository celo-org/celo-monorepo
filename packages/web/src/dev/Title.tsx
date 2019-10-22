import * as React from 'react'
import { View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H1 } from 'src/fonts/Fonts'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { standardStyles, textStyles } from 'src/styles'

interface Props {
  title: string
  invert?: boolean
  nativeID?: string
  ariaLevel?: '2' | '3'
}

const TitleComponent = React.memo(function Title({ title, invert, nativeID, ariaLevel }: Props) {
  return (
    <GridRow
      nativeID={nativeID}
      desktopStyle={[standardStyles.blockMarginBottom, standardStyles.sectionMarginTop]}
      tabletStyle={[standardStyles.blockMarginBottomTablet, standardStyles.sectionMarginTopTablet]}
      mobileStyle={[standardStyles.blockMarginBottomMobile, standardStyles.sectionMarginMobile]}
    >
      <Cell span={Spans.full}>
        <Fade>
          <View>
            <H1 ariaLevel={ariaLevel} style={[textStyles.center, invert && textStyles.invert]}>
              {title}
            </H1>
          </View>
        </Fade>
      </Cell>
    </GridRow>
  )
})
export default TitleComponent
