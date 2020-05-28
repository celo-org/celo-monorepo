import * as React from 'react'
import { Text, View } from 'react-native'
import { brandStyles } from 'src/experienceKits/common/constants'
import Page, { ROOT } from 'src/experienceKits/eventkit/Page'
import { H1, Li, Ul } from 'src/fonts/Fonts'
import { NameSpaces, useTranslation } from 'src/i18n'
import InlineAnchor from 'src/shared/InlineAnchor'
import { hashNav } from 'src/shared/menu-items'
import { fonts, standardStyles } from 'src/styles'

export default function Flavor() {
  const { t } = useTranslation(NameSpaces.eventskit)
  return (
    <>
      <Page
        title="Home"
        path={ROOT}
        metaDescription={t('flavor.introduction')}
        sections={[{ id: hashNav.eventsIntro.overview, children: <Overview /> }]}
      />
    </>
  )
}

const BULLETS = [
  <Text key="tenet">
    Focus on at least 1 of the 4 <InlineAnchor href={'/tenets'}>Community Tenets:</InlineAnchor>
  </Text>,
  ['Designing for all', 'Innovating on money', 'Striving for beauty ', 'Embodying humility '],
  <Text key="conduct">
    Follow the <InlineAnchor href={'/tenets'}>Celo Community Code of Conduct</InlineAnchor>
  </Text>,
  'Foster learning & growing',
  'Encourage the sharing of unique gifts',
  'Opening & closing rituals',
]

function Overview() {
  const { t } = useTranslation(NameSpaces.eventskit)

  return (
    <View style={brandStyles.gap}>
      <H1 style={standardStyles.elementalMarginBottom}>{t('flavor.title')}</H1>

      <Text style={fonts.p}>{t('flavor.introduction')}</Text>
      <Text style={fonts.p}>{t('flavor.introductionP2')}</Text>
      <Text style={standardStyles.elementalMargin}>
        <List bullets={BULLETS} />
      </Text>
      <Text style={fonts.p}>{t('flavor.sparkCelo')}</Text>
    </View>
  )
}

function List({ bullets }) {
  return (
    <Ul style={{ marginLeft: 20, marginTop: 5 }}>
      {bullets.map((bullet: React.ReactNode) => {
        if (Array.isArray(bullet)) {
          return <List bullets={bullet} />
        } else {
          return <Li>{bullet}</Li>
        }
      })}
    </Ul>
  )
}
