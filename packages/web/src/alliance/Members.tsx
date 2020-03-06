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
import Outbound, { externalizeURL } from 'src/shared/Outbound'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

async function gatherAllies(persistFunc: (data: []) => void, signal: { aborted: boolean }) {
  const response = await fetch('api/alliance')
  const alliesByCategory = await response.json()
  if (!signal.aborted) {
    persistFunc(alliesByCategory)
  }
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
    const signal = { aborted: false }
    // sometimes it is nessessary to break a rule
    // https://github.com/facebook/react/issues/14326
    // tslint:disable-next-line: no-floating-promises
    gatherAllies(setAllies, signal)

    return () => {
      signal.aborted = true
    }
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
        allStyle={styles.membersArea}
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Cell span={Spans.fourth}>
          <View style={styles.selectionArea}>
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

const Member = React.memo(function _Member({ logo, name, url }: Ally) {
  const divisor = logo.height / ROW_HEIGHT
  const href = url ? externalizeURL(url) : null
  return logo.uri ? (
    <LazyFade>
      {(onLoad: () => void) => (
        <View style={styles.member}>
          <a target={'_blank'} href={href}>
            <Image
              resizeMode="contain"
              resizeMethod="resize"
              onLoad={onLoad}
              source={{ uri: logo.uri }}
              accessibilityLabel={name}
              style={[styles.logo, { width: logo.width / divisor }]}
            />
          </a>
          {href && <Outbound url={href} />}
        </View>
      )}
    </LazyFade>
  ) : (
    <FallBack text={name} url={href} />
  )
})

function FallBack({ text, url }) {
  return (
    <View style={styles.member}>
      <View style={[standardStyles.centered, styles.logo]}>
        <Text href={url} target="_blank" style={[fonts.legal, textStyles.center]}>
          {text}
        </Text>
      </View>
    </View>
  )
}

const ROW_HEIGHT = 50

const styles = StyleSheet.create({
  selectionArea: { maxWidth: 220 },
  membersArea: { minHeight: 600 },
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
    minHeight: 90,
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    width: 180,
    height: ROW_HEIGHT,
  },
  logo: {
    backgroundColor: colors.white,
    marginHorizontal: 10,
    padding: 5,
    maxWidth: 150,
    height: ROW_HEIGHT,
  },
  filterLabel: {
    marginBottom: 5,
  },
})
