import { render } from 'preact'
import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { html } from 'htm/preact'
import {
  NETWORKS,
  LOAD_ORDER,
  VERSION_TAGS,
  ZERO_ADDR,
  PROXIED_CONTRACTS,
  RESOLVED_CONTRACTS,
  getCachedData,
  setCachedData,
} from './config.js'
import { fetchNetworkData, compareNetworks } from './rpc.js'

// ── Utility ────────────────────────────────────────────────

function truncAddr(addr) {
  if (!addr) return '—'
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

function cleanVersion(v) {
  if (!v) return '—'
  return v.replace(/^"|"$/g, '')
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function explorerLink(networkId, addr) {
  const cfg = NETWORKS[networkId]
  return `${cfg.explorerUrl}/address/${addr}`
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

/**
 * Build a flat map of lowercased address → friendly label from network config.
 */
function buildKnownAddrs(networkId, data) {
  const known = {}
  const addrs = NETWORKS[networkId].addresses
  for (const [key, addr] of Object.entries(addrs)) {
    // Convert SYSTEM_CONFIG_PROXY → SystemConfig, ADDRESS_MANAGER → AddressManager, etc.
    const friendly = key
      .replace(/_PROXY$/, '')
      .split('_')
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join('')
    known[addr.toLowerCase()] = friendly
  }
  // Override with specific admin labels
  if (data?.admin?.proxyAdmin?.address) {
    known[data.admin.proxyAdmin.address.toLowerCase()] = 'ProxyAdmin'
  }
  if (data?.admin?.proxyAdminOwner?.address) {
    known[data.admin.proxyAdminOwner.address.toLowerCase()] = 'ProxyAdminOwner'
  }
  return known
}

function addressLabel(addr, knownAddrs) {
  if (!addr || !knownAddrs) return null
  const lower = addr.toLowerCase()
  return knownAddrs[lower] || null
}

function AddressTag({ label }) {
  if (!label) return null
  return html`<span class="addr-tag">← ${label}</span>`
}

/**
 * Format immutable/ref values for display.
 */
function formatValue(value, type) {
  if (value === null || value === undefined) return '—'
  if (type === 'seconds') {
    const n = Number(value)
    if (n >= 86400)
      return `${n.toLocaleString()}s (${Math.floor(n / 86400)}d ${Math.floor((n % 86400) / 3600)}h)`
    if (n >= 3600)
      return `${n.toLocaleString()}s (${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m)`
    if (n >= 60) return `${n.toLocaleString()}s (${Math.floor(n / 60)}m)`
    return `${n}s`
  }
  if (type === 'duration') {
    // Duration is stored as uint64 seconds
    const n = Number(value)
    if (n >= 3600)
      return `${n.toLocaleString()}s (${Math.floor(n / 3600)}h ${Math.floor((n % 3600) / 60)}m)`
    if (n >= 60) return `${n.toLocaleString()}s (${Math.floor(n / 60)}m)`
    return `${n}s`
  }
  if (type === 'bytes32') {
    const s = String(value)
    if (s.length > 18) return s.slice(0, 10) + '…' + s.slice(-8)
    return s
  }
  if (type === 'uint256' || type === 'uint32' || type === 'uint64') {
    return Number(value).toLocaleString()
  }
  return String(value)
}

// ── Small Components ───────────────────────────────────────

function AddressPill({ addr, networkId }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(
    async (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (await copyToClipboard(addr)) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    },
    [addr]
  )

  if (!addr || addr === ZERO_ADDR) return html`<span class="card-value">—</span>`

  return html`
    <span class="card-value">
      <a class="addr" href=${explorerLink(networkId, addr)} target="_blank" rel="noopener">
        ${truncAddr(addr)}
      </a>
      <button class="addr-copy ${copied ? 'copied' : ''}" onClick=${handleCopy}>
        ${copied ? '✓' : '⧉'}
      </button>
    </span>
  `
}

function VersionBadge({ tag }) {
  if (!tag) return null
  const info = VERSION_TAGS[tag]
  if (!info) return null
  return html`<span class="badge ${info.color}">${info.label}</span>`
}

function GameBadge({ tagInfo }) {
  if (!tagInfo) return null
  return html`<span class="badge ${tagInfo.color}">${tagInfo.tag}</span>`
}

function TypeBadge({ classify }) {
  if (!classify) return null
  const { type, details } = classify
  if (type === 'Safe') {
    return html`<span class="type-badge safe"
      >Safe ${details?.threshold}/${details?.owners?.length || '?'}</span
    >`
  }
  if (type === 'EOA') return html`<span class="type-badge eoa">EOA</span>`
  if (type === 'Contract') return html`<span class="type-badge contract">Contract</span>`
  return null
}

function Skeleton({ width }) {
  const cls =
    width === 'wide' ? 'skeleton wide' : width === 'medium' ? 'skeleton medium' : 'skeleton narrow'
  return html`<div class=${cls}></div>`
}

function PausedBadge({ paused }) {
  if (paused === null || paused === undefined) return null
  return html`<span class="paused-badge ${paused ? 'active' : 'ok'}"
    >${paused ? '⏸ PAUSED' : '▶ Active'}</span
  >`
}

// ── Ref Row Component ──────────────────────────────────────

function RefRow({ ref, networkId, knownAddrs }) {
  if (!ref) return null

  if (
    ref.type === 'address' ||
    (!ref.type &&
      typeof ref.value === 'string' &&
      ref.value.startsWith('0x') &&
      ref.value.length === 42)
  ) {
    const addrVal = ref.value === ZERO_ADDR ? null : ref.value
    const label = addrVal ? addressLabel(addrVal, knownAddrs) : null
    return html`
      <div class="ref-row">
        <span class="ref-label">${ref.label}</span>
        <${AddressPill} addr=${addrVal || ZERO_ADDR} networkId=${networkId} />
        ${ref.valid === true && html`<span class="ref-valid">✓</span>`}
        ${ref.valid === false && html`<span class="ref-invalid">✗</span>`}
        <${AddressTag} label=${label} />
      </div>
    `
  }

  // Non-address value (uint32, uint256, etc.)
  return html`
    <div class="ref-row">
      <span class="ref-label">${ref.label}</span>
      <span class="ref-value">${formatValue(ref.value, ref.type)}</span>
    </div>
  `
}

// ── Immutable Row Component ────────────────────────────────

function ImmutableRow({ item, networkId, knownAddrs }) {
  if (!item) return null

  if (item.type === 'address') {
    const addrVal = item.value === ZERO_ADDR ? null : item.value
    const label = addrVal ? addressLabel(String(addrVal), knownAddrs) : null
    let valid = null
    if (item.expect && addrVal && knownAddrs) {
      const expectedAddr = Object.entries(NETWORKS).length > 0 ? null : null // validated in rpc.js
      // Simple: if the address has a known label, it's likely valid
    }
    return html`
      <div class="immutable-row">
        <span class="immutable-label">${item.label}</span>
        <${AddressPill} addr=${addrVal || ZERO_ADDR} networkId=${networkId} />
        <${AddressTag} label=${label} />
      </div>
    `
  }

  return html`
    <div class="immutable-row">
      <span class="immutable-label">${item.label}</span>
      <span class="immutable-value">${formatValue(item.value, item.type)}</span>
    </div>
  `
}

// ── Contract Card ──────────────────────────────────────────

function ContractCard({ contract, networkId, subtitle, knownAddrs }) {
  if (!contract) return html`<div class="card"><div class="skeleton card-skeleton"></div></div>`

  const hasRefs = contract.refs && contract.refs.length > 0
  const hasImmutables = contract.immutables && contract.immutables.length > 0

  return html`
    <div class="card">
      <div class="card-header">
        <div>
          <span class="card-title">${contract.key}</span>
          ${subtitle && html`<span class="card-subtitle"> ${subtitle}</span>`}
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <${PausedBadge} paused=${contract.paused} />
          <${VersionBadge} tag=${contract.tag} />
        </div>
      </div>
      <div class="card-row">
        <span class="card-label">Proxy</span>
        <${AddressPill} addr=${contract.proxy} networkId=${networkId} />
      </div>
      <div class="card-row">
        <span class="card-label">Impl</span>
        <${AddressPill} addr=${contract.impl} networkId=${networkId} />
      </div>
      <div class="card-row">
        <span class="card-label">Version</span>
        <span class="card-value" style="font-family: var(--font-mono); font-size: 0.8rem;">
          ${cleanVersion(contract.version) || '—'}
        </span>
      </div>
      ${contract.admin &&
      contract.admin !== ZERO_ADDR &&
      html`
        <div class="card-row">
          <span class="card-label">Admin</span>
          <${AddressPill} addr=${contract.admin} networkId=${networkId} />
          <${AddressTag} label=${addressLabel(contract.admin, knownAddrs)} />
          ${contract.adminClassify &&
          html`<span style="margin-left: 6px"
            ><${TypeBadge} classify=${contract.adminClassify}
          /></span>`}
        </div>
      `}
      ${contract.owner &&
      html`
        <div class="card-row">
          <span class="card-label">Owner</span>
          <${AddressPill} addr=${contract.owner} networkId=${networkId} />
          <${AddressTag} label=${addressLabel(contract.owner, knownAddrs)} />
          ${contract.ownerClassify &&
          html`<span style="margin-left: 6px"
            ><${TypeBadge} classify=${contract.ownerClassify}
          /></span>`}
        </div>
      `}
      ${contract.resolvedVia &&
      html`
        <div class="card-row">
          <span class="card-label">Resolved via</span>
          <span class="card-value" style="font-size: 0.78rem; color: var(--text-dim)">
            AddressManager (${contract.resolveName})
          </span>
        </div>
      `}
      ${hasRefs &&
      html`
        <div class="ref-section-label">References</div>
        ${contract.refs.map(
          (r) => html`<${RefRow} ref=${r} networkId=${networkId} knownAddrs=${knownAddrs} />`
        )}
      `}
      ${hasImmutables &&
      html`
        <div class="ref-section-label">Immutables (impl)</div>
        ${contract.immutables.map(
          (item) =>
            html`<${ImmutableRow} item=${item} networkId=${networkId} knownAddrs=${knownAddrs} />`
        )}
      `}
    </div>
  `
}

// ── Admin Card ─────────────────────────────────────────────

function AdminCard({ label, info, networkId }) {
  if (!info)
    return html`<div class="card">
      <div class="skeleton card-skeleton" style="height:80px"></div>
    </div>`

  return html`
    <div class="card">
      <div class="card-header">
        <span class="card-title">${label}</span>
        <${TypeBadge} classify=${info.classify} />
      </div>
      <div class="card-row">
        <span class="card-label">Address</span>
        <${AddressPill} addr=${info.address} networkId=${networkId} />
      </div>
      ${info.owner &&
      html`
        <div class="card-row">
          <span class="card-label">Owner</span>
          <${AddressPill} addr=${info.owner} networkId=${networkId} />
        </div>
      `}
      ${info.classify?.type === 'Safe' &&
      info.classify.details?.owners &&
      html`
        <div class="card-row">
          <span class="card-label">Owners</span>
          <span class="card-value" style="font-size: 0.75rem; color: var(--text-dim)">
            ${info.classify.details.owners.map((o) => truncAddr(o)).join(', ')}
          </span>
        </div>
      `}
    </div>
  `
}

// ── Game Card ──────────────────────────────────────────────

function GameCard({ game, networkId, knownAddrs }) {
  if (!game) return null

  const hasImmutables = game.immutables && game.immutables.length > 0

  return html`
    <div class="card">
      <div class="card-header">
        <div>
          <span class="card-title">${game.label}</span>
          <span class="card-subtitle"> (singleton)</span>
        </div>
        <${GameBadge} tagInfo=${game.tag} />
      </div>
      <div class="card-row">
        <span class="card-label">Address</span>
        <${AddressPill} addr=${game.address} networkId=${networkId} />
      </div>
      <div class="card-row">
        <span class="card-label">Version</span>
        <span class="card-value" style="font-family: var(--font-mono); font-size: 0.8rem;">
          ${cleanVersion(game.version) || '—'}
        </span>
      </div>
      <div class="card-row">
        <span class="card-label">Type</span>
        <${TypeBadge} classify=${game.classify} />
      </div>
      ${hasImmutables &&
      html`
        <div class="ref-section-label">Immutables</div>
        ${game.immutables.map(
          (item) =>
            html`<${ImmutableRow} item=${item} networkId=${networkId} knownAddrs=${knownAddrs} />`
        )}
      `}
    </div>
  `
}

// ── Singleton Card ─────────────────────────────────────────

function SingletonCard({ name, info, networkId, knownAddrs }) {
  if (!info) return null

  const hasImmutables = info.immutables && info.immutables.length > 0

  return html`
    <div class="card">
      <div class="card-header">
        <div>
          <span class="card-title">${name}</span>
          <span class="card-subtitle"> (singleton)</span>
        </div>
        <${VersionBadge} tag=${info.tag} />
      </div>
      <div class="card-row">
        <span class="card-label">Address</span>
        <${AddressPill} addr=${info.address} networkId=${networkId} />
      </div>
      <div class="card-row">
        <span class="card-label">Version</span>
        <span class="card-value" style="font-family: var(--font-mono); font-size: 0.8rem;">
          ${cleanVersion(info.version) || '—'}
        </span>
      </div>
      ${hasImmutables &&
      html`
        <div class="ref-section-label">Immutables</div>
        ${info.immutables.map(
          (item) =>
            html`<${ImmutableRow} item=${item} networkId=${networkId} knownAddrs=${knownAddrs} />`
        )}
      `}
    </div>
  `
}

// ── Section Header ─────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return html`
    <div class="section-header">
      <span class="section-icon">${icon}</span>
      ${title}
    </div>
  `
}

// ── Upgrade Matrix ─────────────────────────────────────────

function UpgradeMatrix({ data, networkId }) {
  if (!data) return null

  const allContracts = [
    ...PROXIED_CONTRACTS.map((c) => c.key),
    ...RESOLVED_CONTRACTS.map((c) => c.key),
  ]

  const rows = allContracts
    .map((key) => {
      const c = data.contracts[key]
      if (!c) return null
      return { key, version: cleanVersion(c.version), tag: c.tag }
    })
    .filter(Boolean)

  // Add games
  for (const [gt, game] of Object.entries(data.games || {})) {
    rows.push({
      key: game.label + ' (type ' + gt + ')',
      version: cleanVersion(game.version),
      tag: null,
      gameTag: game.tag,
    })
  }

  // Add singletons
  for (const [name, info] of Object.entries(data.singletons || {})) {
    rows.push({
      key: name + ' (singleton)',
      version: cleanVersion(info.version),
      tag: info.tag,
    })
  }

  return html`
    <table class="matrix">
      <thead>
        <tr>
          <th>Contract</th>
          <th>Version</th>
          <th>Release</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(
          (r) => html`
            <tr>
              <td class="contract-name">${r.key}</td>
              <td class="version-cell">${r.version}</td>
              <td>
                ${r.tag ? html`<${VersionBadge} tag=${r.tag} />` : null}
                ${r.gameTag ? html`<${GameBadge} tagInfo=${r.gameTag} />` : null}
              </td>
            </tr>
          `
        )}
      </tbody>
    </table>
  `
}

// ── Comparison Panel ───────────────────────────────────────

function ComparisonPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return html`
      <div class="alert-panel">
        <${SectionHeader} icon="✓" title="CROSS-NETWORK HEALTH" />
        <div class="card" style="text-align: center; padding: 24px; color: var(--color-green)">
          All networks consistent — no discrepancies found.
        </div>
      </div>
    `
  }

  return html`
    <div class="alert-panel">
      <${SectionHeader} icon="⚠" title="CROSS-NETWORK DISCREPANCIES" />
      ${alerts.map(
        (a) => html`
          <div class="alert ${a.severity}">
            <span class="alert-icon">${a.severity === 'critical' ? '🔴' : '🟡'}</span>
            <div class="alert-content">
              <div class="alert-title ${a.severity}">${a.contract}</div>
              <div class="alert-detail">${a.message}</div>
              <div class="alert-network">${a.network}</div>
            </div>
          </div>
        `
      )}
    </div>
  `
}

// ── Network View ───────────────────────────────────────────

function NetworkView({ data, networkId, status }) {
  if (status === 'idle') {
    return html`
      <div style="text-align: center; padding: 48px 0; color: var(--text-dim)">
        Waiting to load…
      </div>
    `
  }

  if (status === 'loading' && !data) {
    return html`
      <div class="section">
        <${SectionHeader} icon="🔑" title="ADMIN & OWNERSHIP" />
        <div class="skeleton card-skeleton"></div>
        <div class="skeleton card-skeleton"></div>
      </div>
      <div class="section">
        <${SectionHeader} icon="🔗" title="SUPERCHAIN TOPOLOGY" />
        <div class="skeleton card-skeleton"></div>
        <div class="skeleton card-skeleton"></div>
        <div class="skeleton card-skeleton"></div>
      </div>
      <div class="section">
        <${SectionHeader} icon="🌉" title="CORE BRIDGE CONTRACTS" />
        ${[1, 2, 3, 4, 5].map(() => html`<div class="skeleton card-skeleton"></div>`)}
      </div>
    `
  }

  if (!data) return null

  const knownAddrs = buildKnownAddrs(networkId, data)

  return html`
    ${data.blockNumber &&
    html`
      <div style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 16px;">
        Block:
        <span style="font-family: var(--font-mono)">${data.blockNumber.toLocaleString()}</span> ·
        RPC: <span style="font-family: var(--font-mono)">${NETWORKS[networkId].rpcUrl}</span>
      </div>
    `}

    <!-- Admin & Ownership -->
    <div class="section">
      <${SectionHeader} icon="🔑" title="ADMIN & OWNERSHIP" />
      <${AdminCard} label="ProxyAdmin" info=${data.admin?.proxyAdmin} networkId=${networkId} />
      <${AdminCard}
        label="ProxyAdminOwner (SystemOwnerSafe)"
        info=${data.admin?.proxyAdminOwner}
        networkId=${networkId}
      />
    </div>

    <!-- Superchain Topology -->
    <div class="section">
      <${SectionHeader} icon="🔗" title="SUPERCHAIN TOPOLOGY" />
      <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 8px; padding: 0 4px;">
        SystemConfig → CeloSuperchainConfig → SuperchainConfig
      </div>
      <${ContractCard}
        contract=${data.contracts?.SystemConfig}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      ${data.superchain?.systemConfigTarget &&
      html`
        <div class="chain-pointer">
          <span class="chain-arrow">↳</span>
          superchainConfig() →
          <span class="addr" style="font-size: 0.75rem"
            >${truncAddr(data.superchain.systemConfigTarget)}</span
          >
        </div>
      `}
      <${ContractCard}
        contract=${data.contracts?.CeloSuperchainConfig}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      ${data.superchain?.celoSuperchainConfigTarget &&
      html`
        <div class="chain-pointer">
          <span class="chain-arrow">↳</span>
          superchainConfig() →
          <span class="addr" style="font-size: 0.75rem"
            >${truncAddr(data.superchain.celoSuperchainConfigTarget)}</span
          >
        </div>
      `}
      <${ContractCard}
        contract=${data.contracts?.SuperchainConfig}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Core Bridge Contracts -->
    <div class="section">
      <${SectionHeader} icon="🌉" title="CORE BRIDGE CONTRACTS" />
      <${ContractCard}
        contract=${data.contracts?.OptimismPortal}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      ${data.guardian &&
      html`
        <div class="chain-pointer">
          <span class="chain-arrow">↳</span>
          guardian() →
          <span class="addr" style="font-size: 0.75rem">${truncAddr(data.guardian.address)}</span>
          <span style="margin-left: 4px"><${TypeBadge} classify=${data.guardian.classify} /></span>
        </div>
      `}
      <${ContractCard}
        contract=${data.contracts?.L1StandardBridge}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.L1CrossDomainMessenger}
        networkId=${networkId}
        subtitle="(ResolvedDelegateProxy)"
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.L1ERC721Bridge}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.OptimismMintableERC20Factory}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Dispute / Fault Proof -->
    <div class="section">
      <${SectionHeader} icon="⚔" title="DISPUTE / FAULT PROOF" />
      <${ContractCard}
        contract=${data.contracts?.DisputeGameFactory}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.AnchorStateRegistry}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.DelayedWETH}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Dispute Games -->
    <div class="section">
      <${SectionHeader} icon="🎲" title="DISPUTE GAMES" />
      ${data.games?.[1]
        ? html`<${GameCard}
            game=${data.games[1]}
            networkId=${networkId}
            knownAddrs=${knownAddrs}
          />`
        : html`<div
            class="card"
            style="color: var(--text-dim); font-size: 0.82rem; text-align: center; padding: 16px;"
          >
            PermissionedGame (type 1) — not set
          </div>`}
      ${data.games?.[42]
        ? html`<${GameCard}
            game=${data.games[42]}
            networkId=${networkId}
            knownAddrs=${knownAddrs}
          />`
        : html`<div
            class="card"
            style="color: var(--text-dim); font-size: 0.82rem; text-align: center; padding: 16px;"
          >
            OPSuccinctGame (type 42) — not set
          </div>`}
    </div>

    <!-- Protocol -->
    <div class="section">
      <${SectionHeader} icon="📡" title="PROTOCOL" />
      <${ContractCard}
        contract=${data.contracts?.ProtocolVersions}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Singletons -->
    <div class="section">
      <${SectionHeader} icon="🧩" title="SINGLETONS (non-upgradeable)" />
      <${SingletonCard}
        name="PreimageOracle"
        info=${data.singletons?.PreimageOracle}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${SingletonCard}
        name="MIPS"
        info=${data.singletons?.MIPS}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Upgrade Matrix -->
    <div class="section">
      <${SectionHeader} icon="📊" title="UPGRADE STATUS MATRIX" />
      <${UpgradeMatrix} data=${data} networkId=${networkId} />
    </div>
  `
}

// ── Progress Bar ───────────────────────────────────────────

function ProgressBar({ phase, networks }) {
  const phases = [
    { id: 1, label: 'Mainnet', network: 'mainnet' },
    { id: 2, label: 'Testnets', networks: ['sepolia', 'chaos'] },
    { id: 3, label: 'Comparison' },
  ]

  // Calculate overall progress
  let pct = 0
  const m = networks.mainnet
  const s = networks.sepolia
  const c = networks.chaos

  // Phase 1: 0-40%
  if (m.status === 'done') pct += 40
  else if (m.status === 'loading') pct += (m.progress / 100) * 40

  // Phase 2: 40-80%
  if (s.status === 'done' && c.status === 'done') pct += 40
  else {
    const sp = s.status === 'done' ? 100 : s.status === 'loading' ? s.progress : 0
    const cp = c.status === 'done' ? 100 : c.status === 'loading' ? c.progress : 0
    pct += ((sp + cp) / 200) * 40
  }

  // Phase 3: 80-100%
  if (phase === 3) pct += 10 // comparison in progress
  if (phase >= 4) pct = 100

  const isDone = phase >= 4

  return html`
    <div class="progress-container">
      <div class="progress-phases">
        ${phases.map((p) => {
          let cls = 'progress-phase'
          let icon = ''
          if (p.id < phase) {
            cls += ' done'
            icon = '✓ '
          } else if (p.id === phase) {
            cls += ' active'
            icon = '● '
          }
          return html`<span class=${cls}><span class="phase-check">${icon}</span>${p.label}</span>`
        })}
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: ${Math.round(pct)}%"></div>
      </div>
      <div class="progress-label">
        ${isDone ? 'All networks loaded' : `${Math.round(pct)}% complete`}
      </div>
    </div>
  `
}

// ── Main App ───────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('mainnet')
  const [phase, setPhase] = useState(0)
  const [alerts, setAlerts] = useState(null)
  const [networks, setNetworks] = useState({
    mainnet: { status: 'idle', progress: 0, data: null, cached: false, timestamp: null },
    sepolia: { status: 'idle', progress: 0, data: null, cached: false, timestamp: null },
    chaos: { status: 'idle', progress: 0, data: null, cached: false, timestamp: null },
  })

  const dataRef = useRef({})

  // Load cached data on mount
  useEffect(() => {
    for (const netId of LOAD_ORDER) {
      const cached = getCachedData(netId)
      if (cached) {
        setNetworks((prev) => ({
          ...prev,
          [netId]: {
            ...prev[netId],
            data: cached.data,
            cached: true,
            timestamp: cached.timestamp,
            status: cached.stale ? 'idle' : 'done',
          },
        }))
        dataRef.current[netId] = cached.data
      }
    }
    // Start loading
    loadAll()
  }, [])

  const updateNetwork = useCallback((netId, updates) => {
    setNetworks((prev) => ({ ...prev, [netId]: { ...prev[netId], ...updates } }))
  }, [])

  const loadNetwork = useCallback(
    async (netId) => {
      updateNetwork(netId, { status: 'loading', progress: 0 })

      try {
        const data = await fetchNetworkData(netId, (completed, total) => {
          const pct = Math.round((completed / total) * 100)
          updateNetwork(netId, { progress: pct })
        })

        dataRef.current[netId] = data
        setCachedData(netId, data)
        updateNetwork(netId, {
          status: 'done',
          progress: 100,
          data,
          cached: false,
          timestamp: Date.now(),
        })
        return data
      } catch (err) {
        console.error(`Failed to load ${netId}:`, err)
        updateNetwork(netId, { status: 'error', progress: 0 })
        return null
      }
    },
    [updateNetwork]
  )

  const loadAll = useCallback(async () => {
    // Phase 1: Mainnet
    setPhase(1)
    await loadNetwork('mainnet')

    // Phase 2: Testnets (parallel)
    setPhase(2)
    await Promise.all([loadNetwork('sepolia'), loadNetwork('chaos')])

    // Phase 3: Comparison
    setPhase(3)
    const mainData = dataRef.current.mainnet
    const testData = [dataRef.current.sepolia, dataRef.current.chaos].filter(Boolean)
    const compAlerts = compareNetworks(mainData, testData)
    setAlerts(compAlerts)
    setPhase(4) // Mark comparison as done
  }, [loadNetwork])

  const activeData = networks[activeTab]

  return html`
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <h1><span>⬡</span> Celo OP Stack <span>X-Ray</span></h1>
          <span class="header-meta"> Live contract state inspection </span>
        </div>
        <div class="header-legend">
          <span class="legend-item"><span class="legend-dot amber"></span> v3 (Isthmus)</span>
          <span class="legend-item"
            ><span class="legend-dot green"></span> v4.1.0 (pre-Jovian)</span
          >
          <span class="legend-item"><span class="legend-dot purple"></span> v5.0.0 (Jovian)</span>
        </div>
      </div>

      <!-- Progress -->
      <${ProgressBar} phase=${phase} networks=${networks} />

      <!-- Tabs -->
      <div class="tabs">
        ${LOAD_ORDER.map((netId) => {
          const net = networks[netId]
          let statusCls = net.status
          if (net.cached && net.status !== 'loading') statusCls = 'cached'
          return html`
            <button
              class="tab ${activeTab === netId ? 'active' : ''}"
              onClick=${() => setActiveTab(netId)}
            >
              <span class="tab-status ${statusCls}"></span>
              ${NETWORKS[netId].shortLabel}
            </button>
          `
        })}
      </div>

      <!-- Cached Banner -->
      ${activeData.cached &&
      html`
        <div class="cached-banner">
          ⏱ Showing cached data from ${timeAgo(activeData.timestamp)}
          ${activeData.status === 'loading' && html`<span class="refreshing">Refreshing…</span>`}
        </div>
      `}

      <!-- Network View -->
      <${NetworkView} data=${activeData.data} networkId=${activeTab} status=${activeData.status} />

      <!-- Cross-Network Comparison -->
      ${phase >= 3 && html`<${ComparisonPanel} alerts=${alerts} />`}

      <!-- Footer -->
      <div class="footer">
        Celo OP Stack X-Ray · Data fetched live from L1 RPCs · No server required
      </div>
    </div>
  `
}

// ── Mount ──────────────────────────────────────────────────
render(html`<${App} />`, document.getElementById('app'))
