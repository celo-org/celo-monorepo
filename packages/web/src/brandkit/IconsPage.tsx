import * as React from 'react'
import { withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import { brandStyles, GAP } from 'src/brandkit/common/constants'
import Page from 'src/brandkit/common/Page'
import PageHeadline from 'src/brandkit/common/PageHeadline'
import { I18nProps } from 'src/i18n'

import Fetch from 'src/brandkit/common/Fetch'
import IconShowcase from 'src/brandkit/common/Showcase'

export default React.memo(function IconsPage() {
  return (
    <Page
      sections={[
        {
          id: 'overview',
          children: <Overview />,
        },
      ]}
    />
  )
})

interface IconData {
  description: string
  name: string
  preview: string
  uri: string
}

const LOADING = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const Overview = withNamespaces()(function _Overview({ t }: I18nProps) {
  return (
    <View style={styles.container}>
      <PageHeadline title={t('icons.title')} headline={t('icons.headline')} />
      <View style={brandStyles.tiling}>
        <Fetch query="/brand/api/assets/icons">
          {({ loading, data }: { loading: boolean; data: IconData[] }) => {
            if (loading) {
              return LOADING.map((x) => {
                return (
                  <IconShowcase
                    size={166}
                    key={x}
                    loading={true}
                    name={'Celo Icon'}
                    description="..."
                  />
                )
              })
            }

            return data.map((icon) => (
              <IconShowcase
                key={icon.name}
                description={icon.description}
                name={icon.name}
                preview={{ uri: icon.preview }}
                uri={icon.uri}
                loading={false}
                size={166}
              />
            ))
          }}
        </Fetch>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: { paddingHorizontal: GAP },
})
