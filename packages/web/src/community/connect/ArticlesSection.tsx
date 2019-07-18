import * as React from 'react'

import Fade from 'react-reveal/Fade'
import Articles, { Props as ArticleProps } from 'src/community/Articles'

import { H2 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import MediumLogo from 'src/shared/MediumLogo'
import menuItems from 'src/shared/menu-items'
import { colors, standardStyles } from 'src/styles'

type Props = I18nProps & ArticleProps

class ArticlesSection extends React.PureComponent<Props> {
  render() {
    const { t, articles } = this.props
    return (
      <>
        <GridRow
          desktopStyle={[standardStyles.sectionMarginTop, standardStyles.blockMarginBottom]}
          tabletStyle={[standardStyles.sectionMarginTablet, standardStyles.blockMarginBottomTablet]}
          mobileStyle={[standardStyles.sectionMarginMobile, standardStyles.blockMarginBottomMobile]}
        >
          <Cell span={Spans.full} style={standardStyles.centered}>
            <Fade bottom={true} distance={'20px'}>
              <H2>{t('articles.title')}</H2>
            </Fade>
          </Cell>
        </GridRow>
        <Articles articles={articles} />
        <GridRow
          allStyle={standardStyles.elementalMarginTop}
          desktopStyle={standardStyles.sectionMarginBottom}
          tabletStyle={standardStyles.sectionMarginBottomTablet}
          mobileStyle={standardStyles.sectionMarginBottomMobile}
        >
          <Cell span={Spans.full} style={standardStyles.centered}>
            <Button
              text={t('readMoreFromOurBlog')}
              kind={BTN.DARKNAKED}
              href={menuItems.MEDIUM.link}
              target={'_blog'}
              iconRight={<MediumLogo height={16} color={colors.dark} wrapWithLink={false} />}
            />
          </Cell>
        </GridRow>
      </>
    )
  }
}

export default withNamespaces('community')(ArticlesSection)
