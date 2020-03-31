import * as React from 'react'
import { Text, View } from 'react-native'
import { brandStyles } from 'src/brandkit/common/constants'
import Page, { ROOT } from 'src/brandkit/common/Page'
import SectionTitle from 'src/brandkit/common/SectionTitle'
import { trackDownload, VOICE_DOC_TRACKING } from 'src/brandkit/tracking'
import { H1, H4, Li, Ul } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, Trans, useTranslation, withNamespaces } from 'src/i18n'
import InlineAnchor from 'src/shared/InlineAnchor'
import menuItems, { hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

export default React.memo(
  withNamespaces(NameSpaces.brand)(function Intro({ t }: I18nProps) {
    return (
      <>
        <Page
          title="Home"
          path={ROOT}
          metaDescription={t('home.introduction')}
          sections={[
            { id: hashNav.brandIntro.overview, children: <Overview /> },
            { id: hashNav.brandIntro.brandVoice, children: <BrandVoice /> },
          ]}
        />
      </>
    )
  })
)

const Overview = withNamespaces(NameSpaces.brand)(function _Overview({ t }: I18nProps) {
  return (
    <View style={brandStyles.gap}>
      <H1 style={standardStyles.elementalMarginBottom}>{t('home.title')}</H1>
      <H4 style={standardStyles.blockMarginBottom}>{t('home.introduction')}</H4>
      <Text style={[fonts.h5, standardStyles.elementalMarginBottom]}>{t('home.useageTitle')}</Text>
      <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
        <Trans ns={NameSpaces.brand} i18nKey="home.useageText">
          <InlineAnchor href={menuItems.CODE_OF_CONDUCT.link}>Code Of Conduct</InlineAnchor>
        </Trans>
      </Text>

      <Text style={[fonts.h5, standardStyles.elementalMargin]}>{t('home.importantRemember')}</Text>
      <Text style={fonts.p}>
        {t('home.celoOwner')}
        <Ul>
          <Trans ns={NameSpaces.brand} i18nKey={'home.celoOwnerBullets'}>
            <Li>{}</Li>
            <Li>{}</Li>
          </Trans>
        </Ul>
      </Text>
    </View>
  )
})

function BrandVoice() {
  const { t } = useTranslation(NameSpaces.brand)

  const onPressVoice = React.useCallback(async () => {
    await trackDownload(VOICE_DOC_TRACKING)
  }, [])

  return (
    <View style={brandStyles.gap}>
      <SectionTitle>{t('home.brandVoice')}</SectionTitle>
      <Text style={fonts.p}>
        <Trans ns={NameSpaces.brand} i18nKey="home.brandVoiceText">
          <InlineAnchor
            target="_blank"
            onPress={onPressVoice}
            href={
              'https://docs.google.com/document/d/1Y1mfpBGad_8ZxSuIqwX52MWGEMfoWGt5HXc7sZp9h70/edit?usp=sharing'
            }
          >
            {}
          </InlineAnchor>
        </Trans>
      </Text>
    </View>
  )
}
