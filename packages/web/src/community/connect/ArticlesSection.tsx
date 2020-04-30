import { Articles as ArticleProps } from 'fullstack/ArticleProps'
import * as React from 'react'
import { View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Articles from 'src/community/Articles'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import MediumLogo from 'src/icons/MediumLogo'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { CeloLinks, hashNav } from 'src/shared/menu-items'
import { colors, standardStyles } from 'src/styles'

interface OwnProps {
  loading: boolean
  title: string
}

type Props = I18nProps & ArticleProps & OwnProps

class ArticlesSection extends React.PureComponent<Props> {
  render() {
    const { t, articles, loading, title } = this.props
    return (
      <View nativeID={hashNav.connect.blog}>
        <GridRow
          desktopStyle={[standardStyles.sectionMarginTop, standardStyles.blockMarginBottom]}
          tabletStyle={[standardStyles.sectionMarginTablet, standardStyles.blockMarginBottomTablet]}
          mobileStyle={[standardStyles.sectionMarginMobile, standardStyles.blockMarginBottomMobile]}
        >
          <Cell span={Spans.full} style={standardStyles.centered}>
            <Fade bottom={true} distance={'20px'}>
              <H2>{title}</H2>
            </Fade>
          </Cell>
        </GridRow>
        <Articles articles={articles} loading={loading} />
        <GridRow
          allStyle={standardStyles.elementalMarginTop}
          desktopStyle={standardStyles.sectionMarginBottom}
          tabletStyle={standardStyles.sectionMarginBottomTablet}
          mobileStyle={standardStyles.sectionMarginBottomMobile}
        >
          <Cell span={Spans.full} style={standardStyles.centered}>
            <Button
              text={t('common:readMoreFromOurBlog')}
              kind={BTN.DARKNAKED}
              size={SIZE.normal}
              href={CeloLinks.mediumPublication}
              target={'_blog'}
              iconRight={<MediumLogo height={16} color={colors.dark} wrapWithLink={false} />}
            />
          </Cell>
        </GridRow>
      </View>
    )
  }
}

export default withNamespaces('community')(ArticlesSection)
