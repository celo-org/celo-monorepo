// ---------------------------------------------------------
// Source: https://github.com/awesomejerry/react-native-qrcode-svg
// ---------------------------------------------------------
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Svg, { Rect, Path } from 'react-native-svg'

const DEFAULT_SIZE = 100
const DEFAULT_BG_COLOR = 'white'

import _QRCode from 'qrcode'

const genMatrix = (value, errorCorrectionLevel) => {
  const arr = Array.prototype.slice.call(
    _QRCode.create(value, { errorCorrectionLevel }).modules.data,
    0
  )
  const sqrt = Math.sqrt(arr.length)
  return arr.reduce(
    (rows, key, index) =>
      (index % sqrt === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows,
    []
  )
}

/* calculate the size of the cell and draw the path */
function calculateMatrix(props) {
  const { value, size, ecl, onError } = props
  try {
    const reducedSize = size - 20
    const matrix = genMatrix(value, ecl)
    const cellSize = reducedSize / matrix.length
    return {
      cellSize,
      path: transformMatrixIntoPath(cellSize, matrix),
      reducedSize,
      value,
    }
  } catch (error) {
    if (onError && typeof onError === 'function') {
      onError(error)
    } else {
      // Pass the error when no handler presented
      throw error
    }
  }
  return {}
}

/* project the matrix into path draw */
function transformMatrixIntoPath(cellSize, matrix) {
  // adjust origin
  let d = ''
  matrix.forEach((row, i) => {
    let needDraw = false
    row.forEach((column, j) => {
      if (column) {
        if (!needDraw) {
          d += `M${cellSize * j + 10} ${cellSize / 2 + cellSize * i + 10} `
          needDraw = true
        }
        if (needDraw && j === matrix.length - 1) {
          d += `L${cellSize * (j + 1) + 10} ${cellSize / 2 + cellSize * i + 10} `
        }
      } else {
        if (needDraw) {
          d += `L${cellSize * j + 10} ${cellSize / 2 + cellSize * i + 10} `
          needDraw = false
        }
      }
    })
  })
  return d
}

/**
 * A simple component for displaying QR Code using svg
 */
export default class QRCode extends PureComponent {
  static propTypes = {
    /* what the qr code stands for */
    value: PropTypes.string,
    /* the whole component size */
    size: PropTypes.number,
    /* the color of the cell */
    color: PropTypes.string,
    /* the color of the background */
    backgroundColor: PropTypes.string,
    /* get svg ref for further usage */
    getRef: PropTypes.func,
    /* error correction level */
    ecl: PropTypes.oneOf(['L', 'M', 'Q', 'H']),
    /* Callback function that's called in case if any errors
     * appeared during the process of code generating.
     * Error object is passed to the callback.
     */
    onError: PropTypes.func,
  }

  static defaultProps = {
    value: 'This is a QR Code.',
    size: DEFAULT_SIZE,
    color: 'black',
    backgroundColor: DEFAULT_BG_COLOR,
    ecl: 'M',
    onError: undefined,
  }

  constructor(props) {
    super(props)
    this.state = calculateMatrix(props)
  }

  static getDerivedStateFromProps(props, state) {
    // if value has changed, re-calculateMatrix
    if (props.value !== state.value || props.size !== state.size) {
      return calculateMatrix(props)
    }
    return null
  }

  render() {
    const { getRef, size, color, backgroundColor } = this.props

    const { cellSize, path } = this.state

    return (
      <Svg ref={getRef} width={size} height={size}>
        <Rect width={size} height={size} fill={backgroundColor} />
        {path && cellSize && <Path d={path} stroke={color} strokeWidth={cellSize} />}
      </Svg>
    )
  }
}
