import * as React from 'react'
import { View } from 'react-native'
import Fade from 'react-reveal/Fade'
import FellowshipForm from 'src/community/connect/FellowshipForm'
import FellowViewer from 'src/community/connect/FellowViewer'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { hashNav } from 'src/shared/menu-items'

import { standardStyles, textStyles } from 'src/styles'

class FellowSection extends React.PureComponent<I18nProps> {
  render() {
    const { t } = this.props
    return (
      <>
        <FellowViewer />
        <GridRow
          allStyle={standardStyles.centered}
          nativeID={hashNav.connect.fellowship}
          desktopStyle={[standardStyles.sectionMarginTop, standardStyles.blockMarginBottom]}
          tabletStyle={[standardStyles.sectionMarginTablet, standardStyles.blockMarginBottomTablet]}
          mobileStyle={[standardStyles.sectionMarginMobile, standardStyles.blockMarginBottomMobile]}
        >
          <Cell span={Spans.three4th} style={standardStyles.centered}>
            <Fade bottom={true} distance={'20px'}>
              <H2 style={[textStyles.center]}>{t('fellows.formTitle')}</H2>
            </Fade>
          </Cell>
        </GridRow>
        <Fade bottom={true} distance={'20px'}>
          <View>
            <FellowshipForm />
          </View>
        </Fade>
      </>
    )
  }
}

export default withNamespaces('community')(FellowSection)
