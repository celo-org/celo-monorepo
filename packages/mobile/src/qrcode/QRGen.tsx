import _QRCode, { QRCodeErrorCorrectionLevel } from 'qrcode'
import React, { useMemo } from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import { SVG } from 'src/send/actions'

export function genMatrix(value: string, errorCorrectionLevel: QRCodeErrorCorrectionLevel) {
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
export function calculateMatrix(
  value: string,
  size: number,
  ecl: QRCodeErrorCorrectionLevel,
  onError: any
) {
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
  size?: number
  color?: string
  backgroundColor?: string
  svgRef: React.MutableRefObject<SVG>
  ecl?: QRCodeErrorCorrectionLevel
  onError?: any
}

/**
 * A simple component for displaying QR Code using svg
 */
function QRCode({
  value,
  size = 100,
  color = 'black',
  backgroundColor = 'white',
  svgRef,
  ecl = 'M',
  onError,
}: QRProps) {
  const { cellSize, path } = useMemo(() => calculateMatrix(value, size, ecl, onError), [
    value,
    size,
    ecl,
    onError,
  ])

  return (
    <Svg ref={svgRef} width={size} height={size}>
      <Rect width={size} height={size} fill={backgroundColor} />
      {path && cellSize && <Path d={path} stroke={color} strokeWidth={cellSize} />}
    </Svg>
  )
}

export default React.memo(QRCode)
