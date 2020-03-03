import { TFunction } from 'next-i18next'
import * as React from 'react'
import LazyFade from 'react-lazyload-fadein'
import { Image, StyleSheet, Text, View } from 'react-native'
import Ally from 'src/alliance/AllianceMember'
import { Category as CategoryEnum } from 'src/alliance/CategoryEnum'
import { H2, H4 } from 'src/fonts/Fonts'
import { NameSpaces, Trans, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ListItem } from 'src/shared/DropDown'
import DropDownGroup from 'src/shared/DropDownGroup'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

async function gatherAllies(persistFunc: (data: []) => void) {
  const response = await fetch('api/alliance')
  const alliesByCategory = await response.json()
  persistFunc(alliesByCategory)
}

function buildDropDownProps(t: TFunction, currentFilter: string): ListItem[] {
  return Object.keys(CategoryEnum).map((key) => {
    return {
      id: key,
      selected: key === currentFilter,
      label: t(`members.categoryTitle.${key.toLocaleLowerCase()}`),
    }
  })
}

function initialState() {
  return Object.keys(CategoryEnum).map((key: CategoryEnum) => {
    return {
      name: key,
      records: [],
    }
  })
}

const ALL = 'all'

export default function Members() {
  const { t } = useTranslation(NameSpaces.alliance)
  const [alliesByCategory, setAllies] = React.useState(initialState())
  const [selectedFilter, setFilter] = React.useState(ALL)

  React.useEffect(() => {
    // sometimes it is nessessary to break a rule
    // https://github.com/facebook/react/issues/14326
    // tslint:disable-next-line: no-floating-promises
    gatherAllies(setAllies)
  }, [])

  const onClear = React.useCallback(() => setFilter(ALL), [])

  const displayedCategories = React.useMemo(
    () =>
      selectedFilter === ALL
        ? alliesByCategory
        : alliesByCategory.filter(({ name }) => name === selectedFilter),
    [alliesByCategory, selectedFilter]
  )

  return (
    <View nativeID={'members'}>
      <GridRow
        allStyle={standardStyles.centered}
        desktopStyle={standardStyles.sectionMarginTop}
        tabletStyle={standardStyles.sectionMarginTopTablet}
        mobileStyle={standardStyles.sectionMarginTopMobile}
      >
        <Cell span={Spans.half}>
          <H2 style={[{ marginBottom: 5 }, textStyles.center]}>{t('members.title')}</H2>
          <H4 style={standardStyles.blockMarginBottomMobile}>
            <Trans i18nKey={'members.subtitle'} ns={NameSpaces.alliance}>
              <Text style={textStyles.italic}>{}</Text>
            </Trans>
          </H4>
        </Cell>
      </GridRow>
      <GridRow
        allStyle={{ minHeight: 600 }}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Cell span={Spans.fourth}>
          <View style={{ maxWidth: 220 }}>
            <Text style={[fonts.h6, styles.filterLabel]}>{t('filterLabel')}</Text>
            <DropDownGroup
              data={[
                {
                  name: t(`members.categoryTitle.all`),
                  list: React.useMemo(() => buildDropDownProps(t, selectedFilter), [
                    t,
                    selectedFilter,
                  ]),
                  onSelect: setFilter,
                  onClear,
                },
              ]}
            />
          </View>
        </Cell>
        <Cell span={Spans.three4th}>
          {displayedCategories.map((category) => (
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
  filterLabel: {
    marginBottom: 5,
  },
})
