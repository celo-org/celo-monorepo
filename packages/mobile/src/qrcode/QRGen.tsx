import _QRCode from 'qrcode'
import React, { PureComponent } from 'react'
import Svg, { Path, Rect } from 'react-native-svg'

export function genMatrix(value: any, errorCorrectionLevel: string) {
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
export function calculateMatrix(props: any) {
  const { value, size, ecl, onError } = props
  try {
    const reducedSize = size - 20
    const matrix = genMatrix(value, ecl)
    const cellSize = reducedSize / matrix.length
    return {
      cellSize,
      path: transformMatrixIntoPath(cellSize, matrix),
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
export function transformMatrixIntoPath(cellSize: number, matrix: any) {
  // adjust origin
  let d = ''
  matrix.forEach((row: any, i: number) => {
    let needDraw = false
    row.forEach((column: any, j: number) => {
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

interface QRProps {
  value: string
  size: number
  color: string
  backgroundColor: string
  getRef: any
  ecl: string
  onError: any
}

interface QRState {
  cellSize?: number | undefined
  path?: string | undefined
}

/**
 * A simple component for displaying QR Code using svg
 */
export default class QRCode extends PureComponent<QRProps, QRState> {
  static defaultProps = {
    value: 'This is a QR Code.',
    size: 100,
    color: 'black',
    backgroundColor: 'white',
    ecl: 'M',
    onError: undefined,
  }

  static getDerivedStateFromProps(props: any, state: any) {
    // if value has changed, re-calculateMatrix
    if (props.value !== state.value || props.size !== state.size) {
      return calculateMatrix(props)
    }
    return null
  }

  constructor(props: any) {
    super(props)
    this.state = calculateMatrix(props)
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
