const bigInt = require('big-integer')

export const checkHash = (hash, difficulty) => {
  const maxDifficulty = bigInt(1)
    .shiftLeft(160)
    .minus(1)
  const hashInt = bigInt(hash, 16)
  const target = maxDifficulty.divide(difficulty)
  return hashInt.compare(target) <= 0
}
