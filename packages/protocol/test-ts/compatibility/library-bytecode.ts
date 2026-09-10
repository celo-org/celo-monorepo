import { deployedLibraryMatchesArtifact } from '@celo/protocol/lib/bytecode-foundry'
import { assert } from 'chai'

// solc 0.8.19 metadata trailer: cbor length-prefixed ipfs hash + solc version
const metadata = (marker: string) =>
  `a264697066735822${marker.repeat(68)}64736f6c6343000813${'0033'}`
const ZERO_ADDRESS = '0'.repeat(40)
const LIBRARY_ADDRESS = 'abcdefabcdefabcdefabcdefabcdefabcdefabcd'
const PLACEHOLDER = `__$${'1'.repeat(34)}$__`

const libraryCode = (address: string, body: string, marker = 'a') =>
  `0x73${address}3014${body}${metadata(marker)}`

describe('#deployedLibraryMatchesArtifact()', () => {
  const body = '6080604052600080fdfe'

  it('matches when only the stamped address and the metadata differ', () => {
    const artifact = libraryCode(ZERO_ADDRESS, body, 'a')
    const onchain = libraryCode(LIBRARY_ADDRESS, body, 'b')
    assert.isTrue(deployedLibraryMatchesArtifact(onchain, artifact, `0x${LIBRARY_ADDRESS}`))
  })

  it('ignores link placeholders the artifact still carries', () => {
    const artifact = libraryCode(ZERO_ADDRESS, `${body}73${PLACEHOLDER}${body}`)
    const onchain = libraryCode(LIBRARY_ADDRESS, `${body}73${'2'.repeat(40)}${body}`)
    assert.isTrue(deployedLibraryMatchesArtifact(onchain, artifact, `0x${LIBRARY_ADDRESS}`))
  })

  it('rejects code compiled from different source', () => {
    const artifact = libraryCode(ZERO_ADDRESS, body)
    const onchain = libraryCode(LIBRARY_ADDRESS, '6080604052600160005500')
    assert.isFalse(deployedLibraryMatchesArtifact(onchain, artifact, `0x${LIBRARY_ADDRESS}`))
  })

  it('rejects code of the same length that differs in an opcode', () => {
    const artifact = libraryCode(ZERO_ADDRESS, body)
    const onchain = libraryCode(LIBRARY_ADDRESS, body.replace('fdfe', 'fefd'))
    assert.isFalse(deployedLibraryMatchesArtifact(onchain, artifact, `0x${LIBRARY_ADDRESS}`))
  })

  it('rejects a library deployed at another address', () => {
    const artifact = libraryCode(ZERO_ADDRESS, body)
    const onchain = libraryCode(LIBRARY_ADDRESS, body)
    assert.isFalse(deployedLibraryMatchesArtifact(onchain, artifact, `0x${'9'.repeat(40)}`))
  })
})
