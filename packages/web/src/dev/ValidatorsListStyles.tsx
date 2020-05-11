import { StyleSheet } from 'react-native'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { colors, typeFaces } from 'src/styles'

export const styles = StyleSheet.create({
  pStatic: {
    position: 'static',
    zIndex: 'initial',
  } as any,
  content: {
    paddingBottom: 10,
  },
  cover: {
    marginTop: HEADER_HEIGHT,
    backgroundColor: colors.dark,
    minWidth: '100vw',
    width: '100%',
  },
  defaultText: {
    fontFamily: typeFaces.futura,
    color: colors.white,
  },
  address: {
    color: colors.grayHeavy,
  },

  tooltipOn: {
    zIndex: 2,
  },

  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkWrapper: {
    display: 'inline-flex',
    margin: 'auto',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginHorizontal: 0,
    marginBottom: 40,
  },
  linkWrapperInactive: {
    opacity: 0.6,
  },
  activeTab: {
    position: 'absolute',
    height: 8,
    width: 7,
    bottom: -16,
  },

  // Table
  table: {
    width: 1252,
    margin: 'auto',
    marginBottom: 100,
    backgroundColor: colors.dark,
  },
  tableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  tableRowCont: {
    paddingTop: 10,
  },
  tableHeaderRow: {
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 2,
    top: 0,
    backgroundColor: colors.dark,
    ...({
      position: 'sticky',
      boxShadow: `960px 0 ${colors.dark}, -960px 0 ${colors.dark}`,
    } as any),
  },
  tableHeaderCell: {
    fontSize: 16,
    lineHeight: 20,
    paddingHorizontal: 10,
    paddingVertical: 24,
    textAlign: 'center',
    flexGrow: 0,
    cursor: 'pointer',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderCellPadding: {
    textAlign: 'left',
    paddingLeft: 20 + 24,
    flexGrow: 1,
  },
  tableHeaderCellLeft: {
    textAlign: 'left',
  },
  tableHeaderCellArrow: {
    opacity: 0,
    paddingLeft: 6,
  },
  tableHeaderCellArrowVisible: {
    opacity: 0.6,
  },
  tableCell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    flexGrow: 0,
  },
  tableCellTitle: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    width: 226,
  },
  tableCellTitleRows: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableCellTitleFirstRowWrapper: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tableCellTitleFirstRow: {
    textDecorationLine: 'underline',
    fontWeight: '500',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    maxWidth: 140,
  },
  tableCellTitleSecRow: {
    display: 'flex',
    flexDirection: 'row',
    color: colors.grayHeavy,
    fontSize: 14,
    paddingTop: 10,
    fontWeight: 'normal',
  },
  tableCellTitleSecondarySecRow: {
    paddingTop: 2,
  },
  tableCellTitleArrow: {
    marginLeft: 15,
    marginRight: 20,
    width: 20,
    textAlign: 'center',
  },
  tableCellTitleNumber: {
    marginLeft: 20 + 20,
    marginRight: 24,
    width: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  tableCellHighlight: {
    color: colors.primary,
  },
  tableCellHighlightError: {
    color: colors.error,
  },
  tableCellCenter: {
    textAlign: 'center',
  },
  tableSecondaryCell: {
    fontSize: 14,
  },
  tableCellBars: {
    display: 'flex',
    flexDirection: 'row',
  },
  tableCellBarsValue: {
    paddingRight: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  tableCellBarsRows: {},
  tableCellBarsRowValues: {
    fontSize: 14,
    fontWeight: '500',
    paddingBottom: 2,
    display: 'flex',
    color: colors.grayHeavy,
  },

  // Column sizes
  sizeXS: { minWidth: 64 + 6, maxWidth: 64 + 6 },
  sizeS: { minWidth: 74 + 6, maxWidth: 74 + 6 },
  sizeM: { minWidth: 110 + 6, maxWidth: 110 + 6 },
  sizeL: { minWidth: 154 + 6, maxWidth: 154 + 6 },
  sizeXL: { minWidth: 170, maxWidth: 170 },

  // Circle
  circle: {
    display: 'block',
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 'auto',
  },
  circleOk: {
    backgroundColor: colors.gold,
  },
  circleError: {
    backgroundColor: 'transprent',
  },

  // Number block
  numberBlockContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  numberBlock: {
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: colors.grayHeavy,
    borderRightWidth: 0,
  },
  numberBlockFirst: {
    borderLeftWidth: 0,
  },

  // Bar
  barContainer: {
    width: 35,
    height: 20,
    display: 'inline-flex',
    marginLeft: 8,
    position: 'relative',
    top: 4,
  },
  bar: {
    height: 20,
    display: 'inline-flex',
    borderRadius: 2,
  },
  barOk: {
    backgroundColor: colors.primary,
  },
  barWarn: {
    backgroundColor: colors.gold,
  },
  barKo: {
    backgroundColor: colors.red,
  },

  // Checkmark
  checkmark: {
    display: 'inline-block',
    width: 14,
    height: 14,
    lineHeight: 14,
    backgroundColor: colors.white,
    borderRadius: '50%',
    textAlign: 'center',
    marginLeft: 6,
    position: 'relative',
  } as any,

  // Tooltip
  tooltip: {
    fontWeight: '300',
    fontSize: 14,
    backgroundColor: '#585c60',
    paddingVertical: 4,
    paddingHorizontal: 14,
    position: 'absolute',
    top: '100%',
    marginTop: 10,
    left: '50%',
    transform: [{ translateX: '-50%' as any }],
    textAlign: 'left',
    whiteSpace: 'nowrap',
    borderRadius: 3,
    zIndex: 5,
  },
  tooltipRow: {
    lineHeight: 34,
    display: 'flex' as any,
    alignItems: 'center',
  },
  tooltipText: {
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
    marginRight: 6,
    marginLeft: 4,
  },
})
