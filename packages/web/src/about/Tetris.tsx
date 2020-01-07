import * as React from 'react'
import Svg, { Path } from 'svgs'

export default function Tetris() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 421 301" fill="none">
      {PATHS.map((path) => (
        <Path key={path} d={path} stroke="#81868B" strokeMiterlimit="10" />
      ))}
      <Path
        d="M335.738 42.236C326.939 65.5568 306.233 83.2383 289.516 81.6523C272.799 80.0662 265.233 61.1511 272.682 39.4163C280.073 17.6228 298.96 0 317.085 0C335.21 0 344.595 18.9151 335.738 42.236Z"
        fill="#35D07F"
      />
    </Svg>
  )
}

const PATHS = [
  'M386.82 147.078C368.481 147.078 353.615 161.966 353.615 180.332C353.615 198.697 368.481 213.585 386.82 213.585C405.158 213.585 420.025 198.697 420.025 180.332C420.025 161.966 405.158 147.078 386.82 147.078Z',
  'M299.25 147.078C280.912 147.078 266.045 161.966 266.045 180.332C266.045 198.697 280.912 213.585 299.25 213.585C317.589 213.585 332.455 198.697 332.455 180.332C332.455 161.966 317.589 147.078 299.25 147.078Z',
  'M210.512 147.078C192.174 147.078 177.308 161.966 177.308 180.332C177.308 198.697 192.174 213.585 210.512 213.585C228.851 213.585 243.717 198.697 243.717 180.332C243.717 161.966 228.851 147.078 210.512 147.078Z',
  'M122.943 147.078C104.604 147.078 89.7378 161.966 89.7378 180.332C89.7378 198.697 104.604 213.585 122.943 213.585C141.281 213.585 156.147 198.697 156.147 180.332C156.147 161.966 141.281 147.078 122.943 147.078Z',
  'M34.2048 147.078C15.8663 147.078 0.999997 161.966 0.999995 180.332C0.999994 198.697 15.8663 213.585 34.2048 213.585C52.5433 213.585 67.4096 198.697 67.4096 180.332C67.4096 161.966 52.5433 147.078 34.2048 147.078Z',
  'M386.82 59.149C368.481 59.149 353.615 74.0372 353.615 92.4027C353.615 110.768 368.481 125.657 386.82 125.657C405.158 125.657 420.025 110.768 420.025 92.4028C420.025 74.0372 405.158 59.149 386.82 59.149Z',
  'M210.323 59.1489C191.984 59.1489 177.118 74.0371 177.118 92.4026C177.118 110.768 191.984 125.656 210.323 125.656C228.661 125.656 243.527 110.768 243.527 92.4026C243.527 74.0371 228.661 59.1489 210.323 59.1489Z',
  'M122.943 59.1489C104.604 59.1489 89.7378 74.0371 89.7378 92.4026C89.7378 110.768 104.604 125.656 122.943 125.656C141.281 125.656 156.147 110.768 156.147 92.4026C156.147 74.0371 141.281 59.1489 122.943 59.1489Z',
  'M34.2048 59.1489C15.8663 59.1489 0.999997 74.0371 0.999995 92.4026C0.999994 110.768 15.8663 125.656 34.2048 125.656C52.5433 125.656 67.4096 110.768 67.4096 92.4026C67.4096 74.0371 52.5433 59.1489 34.2048 59.1489Z',
  'M386.82 233.121C368.481 233.121 353.615 248.01 353.615 266.375C353.615 284.741 368.481 299.629 386.82 299.629C405.158 299.629 420.025 284.741 420.025 266.375C420.025 248.01 405.158 233.121 386.82 233.121Z',
  'M299.25 233.121C280.912 233.121 266.045 248.01 266.045 266.375C266.045 284.741 280.912 299.629 299.25 299.629C317.589 299.629 332.455 284.741 332.455 266.375C332.455 248.01 317.589 233.121 299.25 233.121Z',
  'M210.512 233.121C192.174 233.121 177.308 248.01 177.308 266.375C177.308 284.741 192.174 299.629 210.512 299.629C228.851 299.629 243.717 284.741 243.717 266.375C243.717 248.01 228.851 233.121 210.512 233.121Z',
  'M122.943 233.121C104.604 233.121 89.7378 248.01 89.7378 266.375C89.7378 284.741 104.604 299.629 122.943 299.629C141.281 299.629 156.147 284.741 156.147 266.375C156.147 248.01 141.281 233.121 122.943 233.121Z',
  'M34.2048 233.121C15.8663 233.121 0.999997 248.01 0.999995 266.375C0.999994 284.741 15.8663 299.629 34.2048 299.629C52.5433 299.629 67.4096 284.741 67.4096 266.375C67.4096 248.01 52.5433 233.121 34.2048 233.121Z',
]
