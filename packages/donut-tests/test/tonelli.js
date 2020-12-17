function modpow(base1, exponent, modulus) {
  let result = 1n
  base1 = base1 % modulus
  while (exponent > 0n) {
    if (exponent % 2n == 1n) result = (result * base1) % modulus
    exponent = exponent >> 1n
    base1 = (base1 * base1) % modulus
  }
  return result
}

function tonelli(n, p) {
  if (modpow(n, (p - 1n) / 2n, p) != 1n) {
    return [-1, -1, false]
  }

  let q = p - 1n
  let ss = 0n
  while (q % 2n == 0n) {
    ss = ss + 1n
    q = q >> 1n
  }

  if (ss == 1n) {
    let r1 = modpow(n, (p + 1n) / 4n, p)
    return [r1, p - r1, true]
  }

  let z = 2n
  while (modpow(z, (p - 1n) / 2n, p) != p - 1n) {
    z = z + 1n
  }
  let c = modpow(z, q, p)
  let r = modpow(n, (q + 1n) / 2n, p)
  let t = modpow(n, q, p)
  let m = ss

  while (true) {
    if (t == 1n) {
      return [r, p - r, true]
    }
    let i = 0n
    let zz = t
    while (zz != 1n && i < m - 1n) {
      zz = (zz * zz) % p
      i = i + 1n
    }
    let b = c
    let e = m - i - 1n
    while (e > 0n) {
      b = (b * b) % p
      e = e - 1n
    }
    r = (r * b) % p
    c = (b * b) % p
    t = (t * c) % p
    m = i
  }
}

module.exports = {
  tonelli,
}
