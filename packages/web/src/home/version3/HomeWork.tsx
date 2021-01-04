import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Fade from 'src/shared/AwesomeFade'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import menuItems from 'src/shared/menu-items'
import { standardStyles, textStyles } from 'src/styles'

type Props = I18nProps

class HomeWork extends React.PureComponent<Props> {
  render() {
    return (
      <GridRow
        allStyle={standardStyles.centered}
        mobileStyle={[standardStyles.sectionMarginMobile]}
        tabletStyle={[standardStyles.sectionMarginTablet]}
        desktopStyle={[standardStyles.sectionMargin]}
      >
        <Cell span={Spans.half} style={styles.alignCenter}>
          <Fade duration={750} distance="20px">
            <View>
              <H1 ariaLevel="2" accessibilityRole={'heading'} style={textStyles.center}>
                {this.props.t('workOnCelo')}
              </H1>
            </View>
            <View style={styles.spacer} />
            <Button
              kind={BTN.NAKED}
              size={SIZE.normal}
              href={menuItems.JOBS.link}
              text={this.props.t('viewRoles')}
            />
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
  alignCenter: { alignItems: 'center' },
})
