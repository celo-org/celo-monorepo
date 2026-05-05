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
  KNOWN_LABELS,
  getCachedData,
  setCachedData,
} from './config.js'
import { fetchNetworkData, compareNetworks, resetClient } from './rpc.js'

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

  // Add singleton addresses (with New/Old context labels)
  for (const [name, info] of Object.entries(data?.singletons || {})) {
    if (!info?.address) continue
    const isOld = name.endsWith('Old')
    const baseName = isOld ? name.replace(/Old$/, '') : name
    const suffix = isOld ? ' (Old)' : info.discovered ? ' (New)' : ''
    known[info.address.toLowerCase()] = baseName + suffix
  }

  // Add game template addresses (from DGF gameImpls)
  if (data?.games?.[1]?.address) {
    known[data.games[1].address.toLowerCase()] = 'PermissionedGame'
  }
  if (data?.games?.[42]?.address) {
    known[data.games[42].address.toLowerCase()] = 'OPSuccinctGame'
  }

  // Add discovered contract proxy addresses (New/Old context labels)
  for (const [key, contract] of Object.entries(data?.contracts || {})) {
    if (!contract?.proxy) continue
    const isOld = key.endsWith('Old')
    const baseName = isOld ? key.replace(/Old$/, '') : key
    const suffix = isOld ? ' (Old)' : contract.discovered ? ' (New)' : ''
    // Only add discovered/old contract proxies — originals are already in NETWORKS.addresses
    if (contract.discovered || isOld) {
      known[contract.proxy.toLowerCase()] = baseName + suffix
    }
  }

  // SP1 Verifier labels (known verifier contract addresses)
  const SP1_VERIFIERS = {
    '0x397a5f7f3dbd538f23de225b51f532c34448da9b': 'SP1VerifierGroth16',
    '0x3b6041173b80e77f038f3f2c0f9744f04837185e': 'SP1VerifierPlonk',
  }
  for (const [addr, label] of Object.entries(SP1_VERIFIERS)) {
    known[addr] = label
  }

  // AccessManager labels (from network config)
  if (addrs.ACCESS_MANAGER) {
    known[addrs.ACCESS_MANAGER.toLowerCase()] = 'AccessManager'
  }

  // Well-known Safe labels (cLabs, Council, etc.)
  const resolvedNet =
    networkId === 'localhost' ? NETWORKS.localhost.sourceNetwork || networkId : networkId
  const labels = KNOWN_LABELS[resolvedNet]
  if (labels) {
    for (const [addr, label] of Object.entries(labels)) {
      known[addr.toLowerCase()] = label
    }
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
 * Format property values for display.
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

// ── Theme Toggle ───────────────────────────────────────────

const THEME_KEY = 'xray-theme'

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const favicon = document.querySelector('link[rel="icon"]')
  if (favicon) {
    const bg = theme === 'light' ? '%23edeef4' : '%230a0a0f'
    favicon.href = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%2322d3ee'/%3E%3Cstop offset='100%25' stop-color='%233b82f6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='6' fill='${bg}'/%3E%3Cpath d='M7 7L16 16.5L7 26' stroke='url(%23g)' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3Cpath d='M25 7L16 16.5L25 26' stroke='url(%23g)' stroke-width='5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E`
  }
}

function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)

  // Apply on mount + sync system preference when no user override
  useEffect(() => {
    applyTheme(theme)

    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        const next = e.matches ? 'dark' : 'light'
        setTheme(next)
        applyTheme(next)
      }
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Apply whenever theme state changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
  }, [theme])

  return html`
    <button
      class="theme-toggle"
      onClick=${toggle}
      aria-label=${theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title=${theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      ${theme === 'dark' ? '\u263C' : '\u263E'}
    </button>
  `
}

// ── Prop Row Component ──────────────────────────────────────

function PropRow({ prop, networkId, knownAddrs }) {
  if (!prop) return null

  const isAddr = prop.type === 'address' || (prop.expect && !prop.type)
  const isBool = prop.type === 'bool'
  const invalid = prop.valid === false

  if (isAddr) {
    const addrVal = prop.value === ZERO_ADDR ? null : prop.value
    const addrStr = addrVal ? String(addrVal) : null
    const label = addrStr ? addressLabel(addrStr, knownAddrs) : null
    return html`
      <div class="chain-pointer ${invalid ? 'invalid' : ''}">
        <span class="chain-arrow">↳</span>
        <span class="prop-name">${prop.label}</span>
        <span class="prop-sep">→</span>
        <${AddressPill} addr=${addrVal || ZERO_ADDR} networkId=${networkId} />
        ${prop.valid === true && html`<span class="ref-valid">✓</span>`}
        ${prop.valid === false && html`<span class="ref-invalid">✗</span>`}
        <${AddressTag} label=${label} />
      </div>
    `
  }

  if (isBool) {
    const boolVal = prop.value === true || prop.value === 'true'
    return html`
      <div class="chain-pointer">
        <span class="chain-arrow">↳</span>
        <span class="prop-name">${prop.label}</span>
        <span class="prop-sep">→</span>
        <span class="prop-bool ${boolVal ? 'is-true' : 'is-false'}">${String(boolVal)}</span>
      </div>
    `
  }

  if (prop.type === 'string') {
    return html`
      <div class="chain-pointer">
        <span class="chain-arrow">↳</span>
        <span class="prop-name">${prop.label}</span>
        <span class="prop-sep">→</span>
        <span class="prop-str">${String(prop.value)}</span>
      </div>
    `
  }

  // Numbers, seconds, durations, bytes32, etc.
  return html`
    <div class="chain-pointer">
      <span class="chain-arrow">↳</span>
      <span class="prop-name">${prop.label}</span>
      <span class="prop-sep">→</span>
      <span class="prop-val">${formatValue(prop.value, prop.type)}</span>
    </div>
  `
}

function Props({ props, networkId, knownAddrs }) {
  if (!props?.length) return null
  return html`${props.map(
    (p) => html`<${PropRow} prop=${p} networkId=${networkId} knownAddrs=${knownAddrs} />`
  )}`
}

/**
 * Render a contract with automatic Old/New discovery.
 * If a contract has `discovered: true`, it was auto-discovered as the New version.
 * The original contract is stored as contractKey + 'Old' in data.contracts.
 */
function ContractWithDiscovery({ contractKey, data, networkId, knownAddrs, issues }) {
  const contract = data?.contracts?.[contractKey]
  const oldKey = contractKey + 'Old'
  const oldContract = data?.contracts?.[oldKey]
  const isDiscovered = contract?.discovered === true

  return html`
    <${ContractCard}
      contract=${contract}
      networkId=${networkId}
      subtitle=${isDiscovered ? '(New)' : null}
      knownAddrs=${knownAddrs}
      issues=${issues?.[contractKey]}
      discovered=${isDiscovered}
    />
    <${Props} props=${contract?.props} networkId=${networkId} knownAddrs=${knownAddrs} />
    ${oldContract &&
    html`
      <${ContractCard}
        contract=${{ ...oldContract, key: contractKey }}
        networkId=${networkId}
        subtitle="(Old)"
        knownAddrs=${knownAddrs}
        issues=${issues?.[oldKey]}
      />
      <${Props} props=${oldContract.props} networkId=${networkId} knownAddrs=${knownAddrs} />
    `}
  `
}

// ── Contract Card ──────────────────────────────────────────

function ContractCard({ contract, networkId, subtitle, knownAddrs, issues, discovered }) {
  if (!contract) return html`<div class="card"><div class="skeleton card-skeleton"></div></div>`

  return html`
    <div class="card ${discovered ? 'card-discovered' : ''}" data-contract=${contract.key}>
      <div class="card-header">
        <div>
          <span class="card-title">${contract.key}</span>
          ${subtitle && html`<span class="card-subtitle"> ${subtitle}</span>`}
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
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
        <div
          class="card-row ${issues?.includes('admin') ? 'issue-row issue-' + networkId : ''}"
          data-field="admin"
        >
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
        <div
          class="card-row ${issues?.includes('owner') ? 'issue-row issue-' + networkId : ''}"
          data-field="owner"
        >
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
    </div>
  `
}

// ── Admin Card ─────────────────────────────────────────────

function AdminCard({ label, info, networkId, knownAddrs, issues, ownerClassify }) {
  if (!info)
    return html`<div class="card">
      <div class="skeleton card-skeleton" style="height:80px"></div>
    </div>`

  return html`
    <div class="card" data-contract=${label.split(' ')[0]}>
      <div class="card-header">
        <span class="card-title">${label}</span>
        <${TypeBadge} classify=${info.classify} />
      </div>
      <div
        class="card-row ${issues?.includes('address') ? 'issue-row issue-' + networkId : ''}"
        data-field="address"
      >
        <span class="card-label">Address</span>
        <${AddressPill} addr=${info.address} networkId=${networkId} />
      </div>
      ${info.owner &&
      html`
        <div
          class="card-row ${issues?.includes('owner') ? 'issue-row issue-' + networkId : ''}"
          data-field="owner"
        >
          <span class="card-label">Owner</span>
          <${AddressPill} addr=${info.owner} networkId=${networkId} />
          <${AddressTag} label=${addressLabel(info.owner, knownAddrs)} />
          ${ownerClassify &&
          html`<span style="margin-left: 2px"><${TypeBadge} classify=${ownerClassify} /></span>`}
        </div>
      `}
      ${info.classify?.type === 'Safe' &&
      info.classify.details?.owners &&
      html`
        <div class="card-row" style="flex-direction: column; align-items: flex-start; gap: 2px;">
          <span class="card-label">Owners</span>
          ${info.classify.details.owners.map((o) => {
            const ownerCls = info.ownerDetails?.[o.toLowerCase()]
            return html`
              <div
                style="display: flex; align-items: center; gap: 6px; padding-left: 8px; margin-top: 2px;"
              >
                <${AddressPill} addr=${o} networkId=${networkId} />
                <${AddressTag} label=${addressLabel(o, knownAddrs)} />
                ${ownerCls && html`<${TypeBadge} classify=${ownerCls} />`}
              </div>
            `
          })}
        </div>
      `}
    </div>
  `
}

// ── Game Card ──────────────────────────────────────────────

function GameCard({ game, networkId, knownAddrs }) {
  if (!game) return null

  return html`
    <div class="card" data-contract=${game.label}>
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
    </div>
  `
}

// ── Singleton Card ─────────────────────────────────────────

function SingletonCard({ name, info, networkId, knownAddrs, subtitle }) {
  if (!info) return null

  return html`
    <div class="card ${info.discovered ? 'card-discovered' : ''}" data-contract=${name}>
      <div class="card-header">
        <div>
          <span class="card-title">${name}</span>
          ${subtitle
            ? html`<span class="card-subtitle"> ${subtitle}</span>`
            : html`<span class="card-subtitle"> (singleton)</span>`}
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
    </div>
  `
}

function SingletonWithDiscovery({ name, data, networkId, knownAddrs }) {
  const info = data?.singletons?.[name]
  const oldKey = name + 'Old'
  const oldInfo = data?.singletons?.[oldKey]
  const isDiscovered = info?.discovered === true

  return html`
    <${SingletonCard}
      name=${name}
      info=${info}
      networkId=${networkId}
      knownAddrs=${knownAddrs}
      subtitle=${isDiscovered ? '(New)' : null}
    />
    <${Props} props=${info?.props} networkId=${networkId} knownAddrs=${knownAddrs} />
    ${oldInfo &&
    html`
      <${SingletonCard}
        name=${name}
        info=${oldInfo}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        subtitle="(Old)"
      />
      <${Props} props=${oldInfo?.props} networkId=${networkId} knownAddrs=${knownAddrs} />
    `}
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
      const suffix = c.discovered ? ' (New)' : ''
      return { key: key + suffix, version: cleanVersion(c.version), tag: c.tag }
    })
    .filter(Boolean)

  // Add dynamically discovered Old contracts
  for (const [key, c] of Object.entries(data.contracts)) {
    if (key.endsWith('Old') && !allContracts.includes(key)) {
      const baseName = key.replace(/Old$/, '')
      rows.push({ key: baseName + ' (Old)', version: cleanVersion(c.version), tag: c.tag })
    }
  }

  // Add games
  for (const [gt, game] of Object.entries(data.games || {})) {
    rows.push({
      key: game.label + ' (type ' + gt + ')',
      version: cleanVersion(game.version),
      tag: null,
      gameTag: game.tag,
    })
  }

  // Add singletons (with Old/New discovery support)
  for (const [name, info] of Object.entries(data.singletons || {})) {
    if (name.endsWith('Old')) {
      const baseName = name.replace(/Old$/, '')
      rows.push({
        key: baseName + ' (Old)',
        version: cleanVersion(info.version),
        tag: info.tag,
      })
    } else {
      const suffix = info.discovered ? ' (New)' : ' (singleton)'
      rows.push({
        key: name + suffix,
        version: cleanVersion(info.version),
        tag: info.tag,
      })
    }
  }

  // Sort alphabetically by contract name
  rows.sort((a, b) => a.key.localeCompare(b.key))

  return html`<div class="matrix-wrap">
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
  </div>`
}

// ── Comparison Panel ───────────────────────────────────────

function ComparisonPanel({ alerts, onAlertClick }) {
  if (!alerts || alerts.length === 0) {
    return html`
      <div class="alert-panel" id="health-alerts">
        <${SectionHeader} icon="✓" title="NETWORK HEALTH" />
        <div class="card" style="text-align: center; padding: 24px; color: var(--color-green)">
          All networks healthy — no anomalies detected.
        </div>
      </div>
    `
  }

  return html`
    <div class="alert-panel" id="health-alerts">
      <${SectionHeader} icon="⚠" title="NETWORK HEALTH ALERTS" />
      ${alerts.map((a) => {
        const netCls = `net-${a.network}`
        const icon =
          a.network === 'mainnet'
            ? '🔴'
            : a.network === 'sepolia'
            ? '🟡'
            : a.network === 'localhost'
            ? '🔵'
            : '⚪'
        return html`
          <div
            class="alert ${netCls}"
            onClick=${() => onAlertClick && onAlertClick(a)}
            style="cursor: pointer; transition: transform 0.1s, box-shadow 0.2s;"
            onMouseEnter=${(e) => {
              e.currentTarget.style.transform = 'translateX(4px)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
            }}
            onMouseLeave=${(e) => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.boxShadow = ''
            }}
            role="button"
            tabindex="0"
            onKeyDown=${(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onAlertClick && onAlertClick(a)
              }
            }}
          >
            <span class="alert-icon">${icon}</span>
            <div class="alert-content">
              <div class="alert-title ${netCls}">${a.contract}</div>
              <div class="alert-detail">${a.message}</div>
              <div class="alert-network">
                ${a.network} · <span style="opacity: 0.6">click to navigate</span>
              </div>
            </div>
          </div>
        `
      })}
    </div>
  `
}

// ── Alert Banner ───────────────────────────────────────────────────

function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  const mainnetCount = alerts.filter((a) => a.network === 'mainnet').length
  const sepoliaCount = alerts.filter((a) => a.network === 'sepolia').length
  const chaosCount = alerts.filter((a) => a.network === 'chaos').length
  const localhostCount = alerts.filter((a) => a.network === 'localhost').length

  const scrollToAlerts = () => {
    const el = document.getElementById('health-alerts')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return html`
    <div
      class="alert-banner"
      onClick=${scrollToAlerts}
      role="button"
      tabindex="0"
      onKeyDown=${(e) => {
        if (e.key === 'Enter' || e.key === ' ') scrollToAlerts()
      }}
    >
      <span class="alert-banner-icon">⚠️</span>
      <div class="alert-banner-body">
        <div class="alert-banner-counts">
          ${mainnetCount > 0 &&
          html`
            <span class="alert-banner-chip mainnet">
              <span class="alert-banner-chip-dot"></span>
              Mainnet · ${mainnetCount}
            </span>
          `}
          ${sepoliaCount > 0 &&
          html`
            <span class="alert-banner-chip sepolia">
              <span class="alert-banner-chip-dot"></span>
              Sepolia · ${sepoliaCount}
            </span>
          `}
          ${chaosCount > 0 &&
          html`
            <span class="alert-banner-chip chaos">
              <span class="alert-banner-chip-dot"></span>
              Chaos · ${chaosCount}
            </span>
          `}
          ${localhostCount > 0 &&
          html`
            <span class="alert-banner-chip localhost">
              <span class="alert-banner-chip-dot"></span>
              Localhost · ${localhostCount}
            </span>
          `}
        </div>
        <span class="alert-banner-cta">
          Scroll down to see details
          <span class="alert-banner-cta-arrow">↓</span>
        </span>
      </div>
    </div>
  `
}

// ── Network View ───────────────────────────────────────────

function NetworkView({ data, networkId, status, issues }) {
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
        <${SectionHeader} icon="⛓️" title="CORE BRIDGE CONTRACTS" />
        ${[1, 2, 3, 4, 5].map(() => html`<div class="skeleton card-skeleton"></div>`)}
      </div>
    `
  }

  if (!data) return null

  const knownAddrs = buildKnownAddrs(networkId, data)

  return html`
    ${data.blockNumber != null &&
    html`
      <div class="block-info">
        <span class="block-info-item"
          ><span class="block-info-label">Block</span>
          <span class="block-info-val">${data.blockNumber.toLocaleString()}</span></span
        >
        <span class="block-info-sep">·</span>
        <span class="block-info-item"
          ><span class="block-info-label">Chain</span>
          <span class="block-info-val">${data.chainId || '—'}</span></span
        >
        <span class="block-info-sep">·</span>
        <span class="block-info-item"
          ><span class="block-info-label">RPC</span>
          <span class="block-info-val">${NETWORKS[networkId].rpcUrl}</span></span
        >
      </div>
    `}

    <!-- Admin & Ownership -->
    <div class="section">
      <${SectionHeader} icon="🔑" title="ADMIN & OWNERSHIP" />
      <${AdminCard}
        label="ProxyAdmin"
        info=${data.admin?.proxyAdmin}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues?.['ProxyAdmin']}
        ownerClassify=${data.admin?.proxyAdminOwner?.classify}
      />
      <${AdminCard}
        label="ProxyAdminOwner (SystemOwnerSafe)"
        info=${data.admin?.proxyAdminOwner}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues?.['ProxyAdminOwner']}
      />
    </div>

    <!-- Superchain Topology -->
    <div class="section">
      <${SectionHeader} icon="🔗" title="SUPERCHAIN TOPOLOGY" />
      <${ContractCard}
        contract=${data.contracts?.SystemConfig}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues?.['SystemConfig']}
      />
      <${Props}
        props=${data.contracts?.SystemConfig?.props}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractWithDiscovery}
        contractKey="CeloSuperchainConfig"
        data=${data}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues}
      />
      <${ContractCard}
        contract=${data.contracts?.SuperchainConfig}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues?.['SuperchainConfig']}
      />
      <${Props}
        props=${data.contracts?.SuperchainConfig?.props}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Core Bridge Contracts -->
    <div class="section">
      <${SectionHeader} icon="⛓️" title="CORE BRIDGE CONTRACTS" />
      <${ContractCard}
        contract=${data.contracts?.OptimismPortal}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues?.['OptimismPortal']}
      />
      <${Props}
        props=${data.contracts?.OptimismPortal?.props}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.L1StandardBridge}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues?.['L1StandardBridge']}
      />
      <${Props}
        props=${data.contracts?.L1StandardBridge?.props}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.L1CrossDomainMessenger}
        networkId=${networkId}
        subtitle="(ResolvedDelegateProxy)"
        knownAddrs=${knownAddrs}
        issues=${issues?.['L1CrossDomainMessenger']}
      />
      <${Props}
        props=${data.contracts?.L1CrossDomainMessenger?.props}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.L1ERC721Bridge}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues?.['L1ERC721Bridge']}
      />
      <${Props}
        props=${data.contracts?.L1ERC721Bridge?.props}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${ContractCard}
        contract=${data.contracts?.OptimismMintableERC20Factory}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues?.['OptimismMintableERC20Factory']}
      />
      <${Props}
        props=${data.contracts?.OptimismMintableERC20Factory?.props}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Dispute / Fault Proof -->
    <div class="section">
      <${SectionHeader} icon="⚖️" title="DISPUTE / FAULT PROOF" />
      <${ContractWithDiscovery}
        contractKey="DisputeGameFactory"
        data=${data}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues}
      />
      <${ContractWithDiscovery}
        contractKey="AnchorStateRegistry"
        data=${data}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues}
      />
      <${ContractWithDiscovery}
        contractKey="DelayedWETH"
        data=${data}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
        issues=${issues}
      />
    </div>

    <!-- Dispute Games -->
    <div class="section">
      <${SectionHeader} icon="🎲" title="DISPUTE GAMES" />
      ${data.games?.[1]
        ? html`<${GameCard} game=${data.games[1]} networkId=${networkId} knownAddrs=${knownAddrs} />
            <${Props}
              props=${data.games[1].immutables?.map((i) => ({
                label: i.label,
                value: i.value,
                type: i.type,
                expect: i.expect,
                valid: i.valid,
              }))}
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
            />
            <${Props}
              props=${data.games[42].immutables?.map((i) => ({
                label: i.label,
                value: i.value,
                type: i.type,
                expect: i.expect,
                valid: i.valid,
              }))}
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
        issues=${issues?.['ProtocolVersions']}
      />
      <${Props}
        props=${data.contracts?.ProtocolVersions?.props}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Singletons -->
    <div class="section">
      <${SectionHeader} icon="🧩" title="SINGLETONS (non-upgradeable)" />
      <${SingletonWithDiscovery}
        name="PreimageOracle"
        data=${data}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
      <${SingletonWithDiscovery}
        name="MIPS"
        data=${data}
        networkId=${networkId}
        knownAddrs=${knownAddrs}
      />
    </div>

    <!-- Upgrade Matrix -->
    <div class="section">
      <${SectionHeader} icon="🧬" title="UPGRADE STATUS MATRIX" />
      <${UpgradeMatrix} data=${data} networkId=${networkId} />
    </div>
  `
}

// ── Localhost Setup ────────────────────────────────────────

function LocalhostSetup({ onLoad }) {
  const [source, setSource] = useState('mainnet')
  const [rpc, setRpc] = useState('http://localhost:8545')
  const [loading, setLoading] = useState(false)

  const handleLoad = useCallback(async () => {
    setLoading(true)
    try {
      await onLoad(source, rpc)
    } finally {
      setLoading(false)
    }
  }, [onLoad, source, rpc])

  return html`
    <div class="localhost-setup">
      <div class="localhost-setup-header">
        <div class="localhost-setup-icon">🔗</div>
        <h3 class="localhost-setup-title">Connect to Local Fork</h3>
        <p class="localhost-setup-desc">
          Point to a running Anvil fork to inspect contract state against live networks.
        </p>
      </div>
      <div class="localhost-form">
        <div class="localhost-field">
          <label>Fork Source</label>
          <select value=${source} onChange=${(e) => setSource(e.target.value)}>
            <option value="mainnet">Celo Mainnet</option>
            <option value="sepolia">Celo Sepolia</option>
            <option value="chaos">Chaos (L2)</option>
          </select>
        </div>
        <div class="localhost-field">
          <label>RPC Endpoint</label>
          <input
            type="text"
            value=${rpc}
            onChange=${(e) => setRpc(e.target.value)}
            placeholder="http://localhost:8545"
          />
        </div>
        <button class="localhost-load-btn" onClick=${handleLoad} disabled=${loading}>
          ${loading ? 'Connecting…' : 'Load Fork Data'}
        </button>
      </div>
    </div>
  `
}

// ── Progress Bar ───────────────────────────────────────────

function ProgressBar({ phase, networks }) {
  const lh = networks.localhost
  const showLocalhost = lh && lh.status !== 'idle'

  const phases = [
    { id: 1, label: 'Mainnet' },
    { id: 2, label: 'Testnets' },
  ]
  if (showLocalhost) phases.push({ id: 'lh', label: 'Localhost' })

  // Calculate overall progress
  let pct = 0
  const m = networks.mainnet
  const s = networks.sepolia
  const c = networks.chaos

  if (showLocalhost) {
    // 3 phases: Mainnet 0-40%, Testnets 40-80%, Localhost 80-100%
    if (m.status === 'done') pct += 40
    else if (m.status === 'loading') pct += (m.progress / 100) * 40

    if (s.status === 'done' && c.status === 'done') pct += 40
    else {
      const sp = s.status === 'done' ? 100 : s.status === 'loading' ? s.progress : 0
      const cp = c.status === 'done' ? 100 : c.status === 'loading' ? c.progress : 0
      pct += ((sp + cp) / 200) * 40
    }

    if (lh.status === 'done') pct += 20
    else if (lh.status === 'loading') pct += (lh.progress / 100) * 20
  } else {
    // 2 phases: Mainnet 0-50%, Testnets 50-100%
    if (m.status === 'done') pct += 50
    else if (m.status === 'loading') pct += (m.progress / 100) * 50

    if (s.status === 'done' && c.status === 'done') pct += 50
    else {
      const sp = s.status === 'done' ? 100 : s.status === 'loading' ? s.progress : 0
      const cp = c.status === 'done' ? 100 : c.status === 'loading' ? c.progress : 0
      pct += ((sp + cp) / 200) * 50
    }
  }

  const isDone = phase >= 3 && (!showLocalhost || lh.status === 'done')
  if (isDone) pct = 100

  return html`
    <div class="progress-container">
      <div class="progress-phases">
        ${phases.map((p) => {
          let cls = 'progress-phase'
          let icon = ''
          if (p.id === 'lh') {
            if (lh.status === 'done') {
              cls += ' done'
              icon = '✓ '
            } else if (lh.status === 'loading') {
              cls += ' active'
              icon = '● '
            }
          } else if (p.id < phase) {
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

// ── Side Navigation ────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'ProxyAdmin', short: 'PA', section: 'admin' },
  { key: 'ProxyAdminOwner', short: 'PAO', section: 'admin' },
  { key: 'SystemConfig', short: 'SC', section: 'superchain' },
  { key: 'CeloSuperchainConfig', short: 'CSC', section: 'superchain' },
  { key: 'SuperchainConfig', short: 'SuC', section: 'superchain' },
  { key: 'OptimismPortal', short: 'OP', section: 'bridge' },
  { key: 'L1StandardBridge', short: 'SB', section: 'bridge' },
  { key: 'L1CrossDomainMessenger', short: 'CDM', section: 'bridge' },
  { key: 'L1ERC721Bridge', short: 'EB', section: 'bridge' },
  { key: 'OptimismMintableERC20Factory', short: 'MEF', section: 'bridge' },
  { key: 'DisputeGameFactory', short: 'DGF', section: 'dispute' },
  { key: 'AnchorStateRegistry', short: 'ASR', section: 'dispute' },
  { key: 'DelayedWETH', short: 'DW', section: 'dispute' },
  { key: 'PermissionedGame', short: 'PG', section: 'games' },
  { key: 'OPSuccinctGame', short: 'OSG', section: 'games' },
  { key: 'ProtocolVersions', short: 'PV', section: 'protocol' },
  { key: 'PreimageOracle', short: 'PO', section: 'singletons' },
  { key: 'MIPS', short: 'M', section: 'singletons' },
]

function SideNav({ visible, activeTab }) {
  const [activeKey, setActiveKey] = useState(null)

  useEffect(() => {
    if (!visible) return

    let observer = null

    // Small delay so new tab content DOM is rendered before we query it
    const timerId = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          let topEntry = null
          for (const entry of entries) {
            if (entry.isIntersecting) {
              if (!topEntry || entry.boundingClientRect.top < topEntry.boundingClientRect.top) {
                topEntry = entry
              }
            }
          }
          if (topEntry) {
            const key = topEntry.target.getAttribute('data-contract')
            if (key) setActiveKey(key)
          }
        },
        { rootMargin: '-10% 0px -60% 0px', threshold: 0 }
      )

      const cards = document.querySelectorAll('[data-contract]')
      cards.forEach((card) => observer.observe(card))
    }, 50)

    return () => {
      clearTimeout(timerId)
      if (observer) observer.disconnect()
    }
  }, [visible, activeTab])

  const handleClick = useCallback((key) => {
    const card = document.querySelector(`[data-contract="${key}"]`)
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  if (!visible) return null

  return html`
    <nav class="side-nav" aria-label="Contract navigation">
      <div class="side-nav-track">
        ${NAV_ITEMS.map(
          (item, i) => html`
            ${i > 0 && item.section !== NAV_ITEMS[i - 1].section
              ? html`<div class="side-nav-divider"></div>`
              : null}
            <button
              class="side-nav-item ${activeKey === item.key ? 'active' : ''}"
              onClick=${() => handleClick(item.key)}
              data-tooltip=${item.key}
              aria-label=${item.key}
            >
              ${item.short}
            </button>
          `
        )}
      </div>
    </nav>
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
    localhost: { status: 'idle', progress: 0, data: null, cached: false, timestamp: null },
  })
  const [localhostFork, setLocalhostFork] = useState({
    sourceNetwork: 'mainnet',
    rpcUrl: 'http://localhost:8545',
    loaded: false,
  })

  const dataRef = useRef({})
  const preserveScrollRef = useRef(false)

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
        if (netId !== 'localhost') setCachedData(netId, data)
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

    // Run comparison (instant, no separate phase)
    const mainData = dataRef.current.mainnet
    const testData = [
      dataRef.current.sepolia,
      dataRef.current.chaos,
      dataRef.current.localhost,
    ].filter(Boolean)
    const compAlerts = compareNetworks(mainData, testData)
    setAlerts(compAlerts)
    setPhase(3) // Done
  }, [loadNetwork])

  const loadLocalhost = useCallback(
    async (sourceNet, rpcUrl) => {
      // Configure localhost to use source network's addresses
      NETWORKS.localhost.sourceNetwork = sourceNet
      NETWORKS.localhost.addresses = { ...NETWORKS[sourceNet].addresses }
      NETWORKS.localhost.rpcUrl = rpcUrl
      NETWORKS.localhost.explorerUrl = NETWORKS[sourceNet].explorerUrl
      resetClient('localhost')

      setLocalhostFork({ sourceNetwork: sourceNet, rpcUrl, loaded: true })
      await loadNetwork('localhost')

      // Re-run comparison including localhost
      const mainData = dataRef.current.mainnet
      const testData = [
        dataRef.current.sepolia,
        dataRef.current.chaos,
        dataRef.current.localhost,
      ].filter(Boolean)
      if (mainData) {
        const compAlerts = compareNetworks(mainData, testData)
        setAlerts(compAlerts)
      }
    },
    [loadNetwork]
  )

  const resetLocalhost = useCallback(() => {
    setLocalhostFork({ sourceNetwork: 'mainnet', rpcUrl: 'http://localhost:8545', loaded: false })
    updateNetwork('localhost', {
      status: 'idle',
      progress: 0,
      data: null,
      cached: false,
      timestamp: null,
    })
    dataRef.current.localhost = null
    resetClient('localhost')
    // Re-run comparison without localhost
    const mainData = dataRef.current.mainnet
    const testData = [dataRef.current.sepolia, dataRef.current.chaos].filter(Boolean)
    if (mainData) {
      const compAlerts = compareNetworks(mainData, testData)
      setAlerts(compAlerts)
    }
  }, [updateNetwork])

  const handleAlertClick = useCallback((alert) => {
    // 1. Switch to the correct network tab
    setActiveTab(alert.network)

    // 2. After render, scroll to the contract card and highlight the field
    setTimeout(() => {
      // Remove any existing highlights first
      document.querySelectorAll('.hl-card, .hl-row').forEach((el) => {
        el.classList.remove(
          'hl-card',
          'hl-row',
          'hl-mainnet',
          'hl-sepolia',
          'hl-chaos',
          'hl-localhost'
        )
      })

      const card = document.querySelector(`[data-contract="${alert.contract}"]`)
      if (!card) return

      // Scroll card into view
      card.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Highlight the card
      const netHl = `hl-${alert.network}`
      card.classList.add('hl-card', netHl)

      // Highlight the specific field row within the card
      const fieldRow = card.querySelector(`[data-field="${alert.field}"]`)
      if (fieldRow) {
        fieldRow.classList.add('hl-row', netHl)
      }

      // Auto-remove highlights after animation completes
      setTimeout(() => {
        card.classList.remove('hl-card', netHl)
        if (fieldRow) fieldRow.classList.remove('hl-row', netHl)
      }, 3000)
    }, 150) // wait for tab switch re-render
  }, [])

  const activeData = networks[activeTab]

  // Build issues map for the active network tab: { contractName: ['field1', 'field2'] }
  const activeIssues = alerts
    ? alerts.reduce((map, a) => {
        if (a.network === activeTab) {
          if (!map[a.contract]) map[a.contract] = []
          if (!map[a.contract].includes(a.field)) map[a.contract].push(a.field)
        }
        return map
      }, {})
    : null

  const sideNavVisible =
    activeTab === 'localhost'
      ? localhostFork.loaded && activeData.data != null
      : activeData.data != null

  return html`
    <${SideNav} visible=${sideNavVisible} activeTab=${activeTab} />
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <h1><span>⬡</span> Celo OP Stack <span>X-Ray</span></h1>
          <${ThemeToggle} />
        </div>
        <div class="header-legend">
          <span class="legend-item"><span class="legend-dot amber"></span> v3 (Isthmus)</span>
          <span class="legend-item"><span class="legend-dot green"></span> v4.1 (pre-Jovian)</span>
          <span class="legend-item"><span class="legend-dot purple"></span> v5 (Jovian)</span>
        </div>
      </div>

      <!-- Progress -->
      <${ProgressBar} phase=${phase} networks=${networks} />

      <!-- Alert Summary Banner -->
      ${phase >= 3 && alerts && alerts.length > 0 && html`<${AlertBanner} alerts=${alerts} />`}

      <!-- Tabs -->
      <div class="tabs-sticky-wrapper">
        <div class="tabs">
          ${LOAD_ORDER.map((netId) => {
            const net = networks[netId]
            let statusCls = net.status
            if (net.cached && net.status !== 'loading') statusCls = 'cached'
            return html`
              <button
                class="tab ${activeTab === netId ? 'active' : ''}"
                onClick=${() => {
                  const scrollY = window.scrollY
                  preserveScrollRef.current = true
                  setActiveTab(netId)
                  requestAnimationFrame(() => {
                    window.scrollTo(0, scrollY)
                    preserveScrollRef.current = false
                  })
                }}
              >
                <span class="tab-status ${statusCls}"></span>
                ${NETWORKS[netId].shortLabel}
              </button>
            `
          })}
          <button
            class="tab ${activeTab === 'localhost' ? 'active' : ''}"
            onClick=${() => {
              const scrollY = window.scrollY
              preserveScrollRef.current = true
              setActiveTab('localhost')
              requestAnimationFrame(() => {
                window.scrollTo(0, scrollY)
                preserveScrollRef.current = false
              })
            }}
          >
            <span class="tab-status ${networks.localhost.status}"></span>
            Localhost
          </button>
        </div>
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
      ${activeTab === 'localhost'
        ? html`
            ${!localhostFork.loaded
              ? html` <${LocalhostSetup} onLoad=${loadLocalhost} /> `
              : html`
                  <div class="localhost-banner">
                    <span
                      >🔗 Fork of${' '}<strong
                        >${NETWORKS[localhostFork.sourceNetwork].shortLabel}</strong
                      ></span
                    >
                    <span class="localhost-rpc">${localhostFork.rpcUrl}</span>
                    <button class="localhost-reset-btn" onClick=${resetLocalhost}>Reset</button>
                  </div>
                  <${NetworkView}
                    data=${activeData.data}
                    networkId=${'localhost'}
                    status=${activeData.status}
                    issues=${activeIssues}
                  />
                `}
          `
        : html`
            <${NetworkView}
              data=${activeData.data}
              networkId=${activeTab}
              status=${activeData.status}
              issues=${activeIssues}
            />
          `}

      <!-- Cross-Network Comparison -->
      ${phase >= 3 &&
      html`<${ComparisonPanel} alerts=${alerts} onAlertClick=${handleAlertClick} />`}

      <!-- Footer -->
      <div class="footer">celo op stack x-ray · live from l1 rpcs · no server</div>
    </div>
  `
}

// ── Mount ──────────────────────────────────────────────────
render(html`<${App} />`, document.getElementById('app'))
