import fetch from 'cross-fetch'
import { NextPage } from 'next'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import CCLicense from 'src/brandkit/common/CCLicense'
import { GAP } from 'src/brandkit/common/constants'
import Page, { ICONS_PATH } from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import { NameSpaces, useTranslation } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'
import { Explorer } from './Explorer'

export interface Props {
  icons: IconData[]
}

const IconPage: NextPage<Props> = React.memo(function IconsPage({ icons }: Props) {
  const { t } = useTranslation(NameSpaces.brand)
  return (
    <Page
      title={t('icons.title')}
      metaDescription={t('icons.headline')}
      path={ICONS_PATH}
      sections={[{ id: hashNav.brandIcons.overview, children: <Overview icons={icons} /> }]}
    />
  )
})

IconPage.getInitialProps = async ({ req }) => {
  let icons = []
  // req exists if and only if this is being run on serverside
  if (req) {
    const AssetBase = await import('src/../server/AssetBase')
    icons = await AssetBase.default(AssetBase.AssetSheet.Icons)
  } else {
    icons = await fetch('/api/experience/assets/icons').then((result) => result.json())
  }

  return { icons }
}

export default IconPage

export interface IconData {
  description: string
  name: string
  preview: string
  uri: string
  tags: string[]
  id: string
}

function Overview({ icons }) {
  const { t } = useTranslation(NameSpaces.brand)
  return (
    <View style={styles.container}>
      <PageHeadline title={t('icons.title')} headline={t('icons.headline')} />
      <CCLicense textI18nKey="icons.license" />
      <Explorer icons={icons} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: GAP },
})
