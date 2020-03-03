import * as React from 'react'
import LazyFade from 'react-lazyload-fadein'
import { Image, StyleSheet, Text, View } from 'react-native'
import Ally from 'src/alliance/AllianceMember'
import { H2, H4 } from 'src/fonts/Fonts'
import { NameSpaces, Trans, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

async function gatherAllies(persistFunc: (data: []) => void) {
  const response = await fetch('api/alliance')
  const allies = await response.json()
  persistFunc(allies)
}

export default function Members() {
  const { t } = useTranslation(NameSpaces.alliance)
  const [allies, setAllies] = React.useState([])

  React.useEffect(() => {
    // sometimes it is nessessary to break a rule
    // https://github.com/facebook/react/issues/14326
    // tslint:disable-next-line: no-floating-promises
    gatherAllies(setAllies)
  }, [])

  return (
    <View nativeID={'members'}>
      <GridRow
        desktopStyle={[{ justifyContent: 'flex-end' }, standardStyles.sectionMargin]}
        tabletStyle={standardStyles.sectionMarginTablet}
        mobileStyle={standardStyles.sectionMarginMobile}
      >
        <Cell span={Spans.three4th}>
          <H2 style={{ marginBottom: 5 }}>{t('members.title')}</H2>
          <H4 style={standardStyles.blockMarginBottomMobile}>
            <Trans i18nKey={'members.subtitle'} ns={NameSpaces.alliance}>
              <Text style={textStyles.italic}>{}</Text>
            </Trans>
          </H4>
          {allies.map((category) => (
            <Category
              key={category.name}
              name={category.name.toLowerCase()}
              members={category.records}
            />
          ))}
        </Cell>
      </GridRow>
    </View>
  )
}

interface CategoryProps {
  name: string
  members: Ally[]
}

function Category({ name, members }: CategoryProps) {
  const { t } = useTranslation(NameSpaces.alliance)
  return (
    <View>
      <H4>{t(`members.categoryTitle.${name}`)}</H4>
      <View style={styles.grayLine} />
      <Text style={fonts.p}>{t(`members.categoryText.${name}`)}</Text>
      <View style={styles.categoryContainer}>
        {members.map(({ name: memberName, logo, url }) => (
          <Member key={memberName} name={memberName} logo={logo} url={url} />
        ))}
      </View>
    </View>
  )
}

const Member = React.memo(function _Member({ logo, name }: Ally) {
  return (
    <View style={styles.member}>
      {logo ? (
        <LazyFade>
          {(onLoad: () => void) => (
            <Image
              resizeMode="contain"
              onLoad={onLoad}
              source={{ uri: logo }}
              accessibilityLabel={name}
              style={styles.logo}
            />
          )}
        </LazyFade>
      ) : (
        <PlaceHolder text={name} />
      )}
    </View>
  )
})

function PlaceHolder({ text }) {
  return (
    <View style={standardStyles.centered}>
      <Text style={[fonts.legal, textStyles.center]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  grayLine: {
    marginTop: 2,
    borderBottomColor: colors.gray,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  categoryContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 50,
  },
  member: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    width: 170,
    height: 50,
  },
  logo: {
    backgroundColor: colors.white,
    marginHorizontal: 10,
    width: 150,
    height: 50,
  },
})
