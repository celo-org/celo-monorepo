import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H1 } from 'src/fonts/Fonts'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import menuItems from 'src/shared/menu-items'
import { standardStyles, textStyles } from 'src/styles'

type Props = WithNamespaces

class HomeWork extends React.PureComponent<Props> {
  render() {
    return (
      <GridRow
        allStyle={standardStyles.centered}
        mobileStyle={[standardStyles.sectionMarginMobile]}
        tabletStyle={[standardStyles.sectionMarginTablet]}
        desktopStyle={[standardStyles.sectionMargin]}
      >
        <Cell span={Spans.half} style={{ alignItems: 'center' }}>
          <Fade bottom={true} duration={750} distance="20px">
            <View>
              <H1 accessibilityRole={'heading'} style={textStyles.center}>
                {this.props.t('workOnCelo')}
              </H1>
            </View>
            <View style={styles.spacer} />
            <Button kind={BTN.NAKED} href={menuItems.JOBS.link} text={this.props.t('viewRoles')} />
          </Fade>
        </Cell>
      </GridRow>
    )
  }
}

export default withNamespaces('home')(HomeWork)

const styles = StyleSheet.create({
  spacer: {
    height: 30,
  },
})
