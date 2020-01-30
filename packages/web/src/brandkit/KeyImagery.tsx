import * as React from 'react'
import { Text } from 'react-native'
import Page, { IMAGERY_PATH } from 'src/brandkit/common/Page'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { hashNav } from 'src/shared/menu-items'

const { brandImagery } = hashNav

// TODO in v 1.1
const KeyImageryWrapped = withNamespaces(NameSpaces.brand)(
  React.memo(function KeyImagery({ t }: I18nProps) {
    return (
      <Page
        title={'keyImagery.title'}
        metaDescription={t('keyImagery.headline')}
        path={IMAGERY_PATH}
        sections={[
          {
            id: brandImagery.overview,
            children: <Text>overview</Text>,
          },
          {
            id: brandImagery.illustrations,
            children: <Text>illustrations</Text>,
          },
          { id: brandImagery.graphics, children: <Text>graphics</Text> },
        ]}
      />
    )
  })
)

export default KeyImageryWrapped

// const styles = StyleSheet.create({
//   container: { padding: 10 },
// })
