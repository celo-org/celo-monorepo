import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { filterCommitment, filterDept, filterLocation, LeverJob } from 'src/jobs/lever'
import JobsTable from 'src/jobs/version3/JobTable'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ListItem } from 'src/shared/DropDown'
import DropDownGroup from 'src/shared/DropDownGroup'
import { hashNav } from 'src/shared/menu-items'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

enum Filters {
  DEPT = 'deptFilter',
  LOCATION = 'locationFilter',
  COMMITMENT = 'commitmentFilter',
}

interface OwnProps {
  positions: LeverJob[]
}

type Props = I18nProps & OwnProps
interface State {
  [Filters.LOCATION]: Set<string>
  [Filters.COMMITMENT]: Set<string>
  [Filters.DEPT]: Set<string>
}

enum Locations {
  SF = 'San Francisco Bay Area, CA',
  BER = 'Berlin',
  BA = 'Buenos Aires',
  WW = 'worldWideRemote',
}

const MAIN_LOCATIONS = [
  Locations.SF.toString(),
  Locations.BER.toString(),
  Locations.BA.toString(),
  Locations.WW.toString(),
]

// TODO memoize
function getWorldWideLocations(jobs: LeverJob[]) {
  return jobs.reduce((collection, current) => {
    if (
      ![Locations.SF.toString(), Locations.BER.toString(), Locations.BA.toString()].includes(
        current.categories.location
      )
    ) {
      return collection.add(current.categories.location)
    } else {
      return collection
    }
  }, new Set([Locations.WW.toString()]))
}

function getDepartments(jobs: LeverJob[]): string[] {
  const departments = jobs.reduce((collection, current) => {
    return collection.add(current.categories.team)
  }, new Set<string>())
  return Array.from(departments)
}

function getCommitments(jobs: LeverJob[]): string[] {
  const set = jobs.reduce((collection, current) => {
    return collection.add(current.categories.commitment)
  }, new Set<string>())
  return Array.from(set)
}

class Jobs extends React.Component<Props, State> {
  state: State = {
    [Filters.LOCATION]: new Set(),
    [Filters.DEPT]: new Set(),
    [Filters.COMMITMENT]: new Set(),
  }

  otherLocations = () => {
    return getWorldWideLocations(this.props.positions)
  }

  setFilter = (key: string, filterType: string) => {
    if (filterType === Filters.LOCATION && key === Locations.WW) {
      this.setState((state: State) => ({
        ...state,
        [Filters.LOCATION]: this.otherLocations(),
      }))
    } else {
      this.setState((state: State) => ({ ...state, [filterType]: new Set([key]) }))
    }
  }

  clearFilter = (filterType: string) => {
    this.setState((state: State) => {
      return { ...state, [filterType]: new Set() }
    })
  }

  clearAll = () => {
    this.setState({
      [Filters.LOCATION]: new Set(),
      [Filters.DEPT]: new Set(),
      [Filters.COMMITMENT]: new Set(),
    })
  }

  clearDepartments = () => {
    this.clearFilter(Filters.DEPT)
  }
  clearLocations = () => {
    this.clearFilter(Filters.LOCATION)
  }

  clearCommitments = () => {
    this.clearFilter(Filters.COMMITMENT)
  }

  toggleFilter = (filterType: string) => (key: string) => {
    this.state[filterType].has(key) ? this.clearFilter(filterType) : this.setFilter(key, filterType)
  }

  visibleJobs() {
    const byLocations = filterLocation(this.props.positions, this.state.locationFilter)
    const byDepartments = filterDept(byLocations, this.state.deptFilter)
    return filterCommitment(byDepartments, this.state.commitmentFilter)
  }

  toDropdownList = (list: string[], filterType: Filters): ListItem[] => {
    return list.map((key) => ({
      id: key,
      label: this.props.t(key),
      selected: this.state[filterType].has(key),
    }))
  }

  render() {
    const { t } = this.props

    return (
      <>
        <View nativeID={hashNav.join.roles} style={styles.container}>
          <GridRow desktopStyle={[styles.work]} tabletStyle={[styles.work]}>
            <Cell span={Spans.three4th} style={standardStyles.blockMargin}>
              <H1 style={[standardStyles.elementalMargin, textStyles.center]}>{t('workOnCelo')}</H1>
            </Cell>
          </GridRow>
          <GridRow
            desktopStyle={[standardStyles.sectionMarginBottom]}
            tabletStyle={[standardStyles.sectionMarginBottomTablet]}
            mobileStyle={[standardStyles.sectionMarginBottomMobile]}
          >
            <Cell span={Spans.fourth}>
              <View>
                <Fade bottom={true} distance="40px" wait={200}>
                  <View>
                    <Text style={[fonts.h3Mobile, textStyles.heading]}>
                      {t('careerOpportunities')}
                    </Text>
                    <Text style={[fonts.h6, styles.optionsLabel]}>{t('filter')}</Text>
                    <DropDownGroup
                      data={[
                        {
                          onClear: this.clearLocations,
                          name: t('allLocations'),
                          onSelect: this.toggleFilter(Filters.LOCATION),
                          list: this.toDropdownList(MAIN_LOCATIONS, Filters.LOCATION),
                        },
                        {
                          onClear: this.clearDepartments,
                          name: t('allDepartments'),
                          onSelect: this.toggleFilter(Filters.DEPT),
                          list: this.toDropdownList(
                            getDepartments(this.props.positions),
                            Filters.DEPT
                          ),
                        },
                        {
                          onClear: this.clearCommitments,
                          name: t('allCommitments'),
                          onSelect: this.toggleFilter(Filters.COMMITMENT),
                          list: this.toDropdownList(
                            getCommitments(this.props.positions),
                            Filters.COMMITMENT
                          ),
                        },
                      ]}
                    />
                  </View>
                </Fade>
              </View>
            </Cell>
            <Cell span={Spans.three4th} style={styles.table}>
              <JobsTable positions={this.visibleJobs()} clearAll={this.clearAll} />
            </Cell>
          </GridRow>
        </View>
      </>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  table: {
    minHeight: 610,
    zIndex: -4,
  },
  work: {
    justifyContent: 'center',
  },
  optionsLabel: {
    marginBottom: 5,
  },
})

export default withNamespaces('jobs')(Jobs)
