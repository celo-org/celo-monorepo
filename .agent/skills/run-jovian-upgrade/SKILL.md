---
name: run-jovian-upgrade
description: >
  Execute the complete Jovian upgrade pipeline locally (v4 + v5 + Succinct v2) on an Anvil fork.
  Use when: upgrading Celo OP Stack, testing Jovian, running v4/v5/succ-v2 upgrades,
  local fork testing, op-deployer bootstrap, superchain-ops simulation, contract state comparison,
  or when user mentions Jovian, v4.1.0, v5.0.0, succinct, OPSuccinct, upgrade pipeline.
---

# Jovian Upgrade Pipeline

Execute the complete Jovian upgrade (v4.1.0 + v5.0.0 + Succinct v2) on a local Anvil fork of Ethereum. This skill walks you through the entire process interactively, validating prerequisites at each step and performing health checks between upgrades.

## SAFETY RULES

> **CRITICAL**: This skill MUST ONLY execute commands against a local Anvil fork (localhost:8545, or a user-specified local port).
> If the user asks to run against a real network (mainnet, sepolia, or any non-localhost RPC):
>
> 1. **REFUSE** to execute any commands
> 2. **PRINT** all commands step-by-step for the user to review and run manually
> 3. **EXPLAIN** why automated execution on real networks is dangerous

---

## MODE OF EXECUTION

> **Determine your execution mode as the FIRST action of every run, before any bash commands or reads.** The rest of this skill behaves differently based on which mode you are in.

### Interactive Mode (DEFAULT)

Use this mode when:

- You are the **main/orchestrator agent** talking directly to a human user via a terminal or chat UI
- You can call `mcp_question` or emit prompts and wait for user responses
- The user expects to be involved in decisions (mode choice, block selection, confirmation at checkpoints)

**In interactive mode you MUST:**

1. Run the **full Phase 0 prerequisites interview** (ask the user for repo paths, mode A/B, network, block, RPC URL, config files, etc.)
2. At every checkpoint (CP0, CP1, CP2, CP3, CP4): **offer the x-ray dashboard** and **wait for explicit confirmation** before proceeding
3. **Ask clarifying questions** whenever scope is unclear or multiple reasonable choices exist
4. **Pause for user approval** before destructive operations (starting anvil, bootstrap, execution)
5. Use `mcp_question` or inline questions liberally — the user WANTS to be involved

### Autonomous Mode (opt-in, sub-agent only)

Use this mode when:

- You are a **sub-agent** invoked by another agent, CI system, or test harness
- Your invoking prompt explicitly says one or more of: `non-interactive`, `background task`, `autonomous`, `headless`, `no questions`, `do not ask`
- You **cannot** call `mcp_question` or wait for human responses — there is no user on the other end

**In autonomous mode you MUST:**

1. **Validate all required details upfront** (see "Required Details" below)
2. If ANY required detail is missing → **QUIT IMMEDIATELY** with a clear error listing what's missing. Do NOT guess. Do NOT use defaults. Do NOT partially execute.
3. **Skip the Phase 0 interactive interview** — use the details passed by the orchestrator instead
4. At every checkpoint: **acknowledge x-ray offer in your output** using the headless template (see [Mandatory Checkpoint Review Protocol](#mandatory-checkpoint-review-protocol)) but do NOT wait for a response
5. **Document every decision** you make (mode choice, block choice, etc.) in your final output
6. **Cleanup at the end is mandatory** (see [Cleanup Discipline](#cleanup-discipline))
7. **Never call `mcp_question`** — there is no human to respond

### Required Details for Autonomous Mode

Before starting ANY bash commands, confirm the invoking prompt contains **ALL** of the required details below. Validation is **conditional on the chosen mode** — some details are only required in Mode A, others only in Mode B. Missing any required detail (after applying the mode-conditional rules) is a fatal error.

#### Phase 1: Detect mode first

Required for BOTH modes (validate these first):

| #   | Detail                       | Example                                                                                                                                                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Execution mode**           | `Mode A (mocked)` or `Mode B (real sigs)`                                                                                                              | Must be explicit; do NOT infer from other details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2   | **Working directory**        | `/Users/mc01/Documents/Celo-test-1`                                                                                                                    | Path to the Celo monorepo or worktree. Do not assume the current working directory — the orchestrator MUST pass it explicitly                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 3   | **Anvil listen port**        | `8545` (recommended default, can be overridden)                                                                                                        | Numeric port for the local fork. `8545` is the canonical default and should be preferred unless the operator explicitly requests a different port (e.g., to avoid a conflict with another anvil or to run parallel test pipelines).                                                                                                                                                                                                                                                                                                              |
| 4   | **Fork block number**        | network-specific — see table below                                                                                                                     | Numeric or semantic alias. Example mainnet values: `24699169` (Mode A pre-impls) / `24742240` (Mode B post-impls). Sepolia, chaos, and any other target network have different block numbers — see "Fork block normalization" below.                                                                                                                                                                                                                                                                                                             |
| 5   | **Upstream archive RPC URL** | network-specific — Tenderly gateway examples: `https://mainnet.gateway.tenderly.co/…` for mainnet, `https://sepolia.gateway.tenderly.co/…` for sepolia | Must be archive-capable and **network-matched** (a mainnet RPC cannot fork sepolia and vice versa). Public RPCs (llamarpc, publicnode, cloudflare) will fail — use Tenderly, archive-tier Alchemy/Infura, or a private archive node.                                                                                                                                                                                                                                                                                                             |
| 6   | **Network**                  | `mainnet`, `sepolia`, or `chaos`                                                                                                                       | Determines which safes/addresses/scripts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 7   | **Deployer private key**     | operator-supplied                                                                                                                                      | **NOT hardcoded in the skill.** Must be passed in the orchestrator's prompt OR via `DEPLOYER_PK` env var. On **mainnet**, the derived sender address MUST equal `0x95FFAC468e37DdeEF407FfEf18f0cC9E86D8f13B` — this is the operator sender baked into `exec-mocked.sh` / `exec-jovian.sh` scripts for mainnet. **Sepolia and chaos have different operator sender addresses** — ask the user and verify against the network-specific `exec-*.sh` script before running. A PK-to-sender mismatch will cause Safe signature verification failures. |

#### Phase 2: Mode-conditional details

**If Mode A** (required):

| #   | Detail                      | Example                                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | --------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 8a  | **Succinct config file**    | (operator-supplied, e.g. `opsuccinctfdgconfig.{name}.json`) | Name of the file under `$SUCCINCT_ROOT/contracts/` containing the correct vkeys for the target network + deployment iteration. **There is NO canonical default file name.** Different operators have different files — the operator MUST explicitly name the file in their prompt. Do NOT guess common names like `mainnet.json` or `mainnet2.json` — they may or may not exist on the operator's machine, and even when they exist, different files contain different `aggregationVkey` / `rangeVkeyCommitment` / `rollupConfigHash` values. The wrong choice deploys a game whose proofs cannot be verified by the live verifier. In interactive mode: always list the files available under `$SUCCINCT_ROOT/contracts/opsuccinctfdgconfig*.json` and ask. In autonomous mode: if the orchestrator did not pass the exact filename, QUIT per "Autonomous Mode — Missing Detail Error Template". Note: the current canonical Phase 2.3 flow uses `anvil_setCode` with real mainnet bytecode and does not directly consume this file during deployment — but the requirement stays so the operator can't skip the verification step in Phase 0.5, and so future forge-based Phase 2.3 (see Phase 2.3 TODO) has the config available. |
| 9a  | **Include Phase 8 basefee** | `no` (any other value is a protocol violation)              | In Mode A, Phase 8 is always skipped due to incompatibility. If the orchestrator passes `yes` here, treat as Mode A + basefee incompatibility (see "oldest block + basefee" resolution rules in the BINDING EXECUTION CONTRACT).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**If Mode B** (required):

| #   | Detail                      | Example        | Notes                                                                                                                                                                                     |
| --- | --------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8b  | **Include Phase 8 basefee** | `yes` or `no`  | Only valid in Mode B; determines whether to run Phase 8 + CP4 after the core pipeline                                                                                                     |
| 9b  | ~~Succinct config file~~    | (not required) | Mode B skips Phase 2.3 entirely (no Succinct deploy needed — the real `0xE7bd...` impl already exists on-chain). You MAY ignore any Succinct config parameter passed by the orchestrator. |

#### Fork block normalization (aliases allowed)

Detail #4 accepts both numeric values AND semantic aliases. Normalize before validating:

| Alias                                          | Network | Resolves to |
| ---------------------------------------------- | ------- | ----------- |
| `oldest block`, `pre-impls`, `mode-a block`    | mainnet | `24699169`  |
| `post-impls`, `mode-b block`, `impls-deployed` | mainnet | `24742240`  |
| `oldest block`                                 | sepolia | `10459393`  |
| `post-impls`                                   | sepolia | `10462786`  |
| `oldest block`                                 | chaos   | `10382100`  |
| `post-impls`                                   | chaos   | `10382216`  |

After normalization, the resolved block number MUST match the chosen mode (Mode A → pre-impls block; Mode B → post-impls block). If the resolved block does not match the mode, report this as a fatal detail mismatch and quit.

#### Optional — defaults allowed if missing

- **Mocked signer addresses/PKs** — defaults to the skill's 4 documented mocked signers (sorted ascending)
- **Sibling repo paths** (Optimism, Optimism2, SuperchainOps, CeloSuperchainOps, Succinct) — defaults to `/Users/mc01/Documents/{RepoName}`

### Autonomous Mode — Missing Detail Error Template

If any required detail is missing, emit this exact block and **STOP**:

```
AUTONOMOUS MODE FAILURE: missing required detail(s).

Missing:
- {detail name 1}: not provided or ambiguous
- {detail name 2}: not provided or ambiguous
- …

This skill runs in autonomous mode and cannot ask the user for missing information.
Re-invoke with all required details explicitly passed in the prompt.

Aborting before any bash commands. No cleanup needed (nothing was started).
```

Do not guess. Do not partially execute. Do not ask questions. Do not attempt to proceed.

### Detecting Your Mode

At the top of every run, check:

1. **Does your invoking prompt contain any of these phrases?**
   - `non-interactive`, `background task`, `autonomous`, `headless`, `no questions`, `do not ask`, `just run it`, `make decisions and proceed`
2. **Is the user available to answer questions during your run?** (Inspect your session type — are you a sub-agent or the main orchestrator?)

If you match any autonomous indicator OR you are a sub-agent → **Autonomous Mode**.
Otherwise → **Interactive Mode** (default).

**Announce your mode at the top of your first output.** Example:

> "Detected mode: **Autonomous** (prompt contains 'non-interactive background task'). Validating required details…"

> "Detected mode: **Interactive** (no autonomous indicators, orchestrator agent). Starting Phase 0 interview…"

---

## BINDING EXECUTION CONTRACT (non-negotiable)

> You are executing a production contract upgrade pipeline. Every step matters. The following rules are **BINDING** — if you violate any of them your run is invalid and MUST be reported as FAILED regardless of apparent success.

### 1. Canonical phase order — you MUST follow this exact sequence

The skill is structured so that **reading top-to-bottom matches execution order**. Each phase number corresponds to one section in this document. There are NO loop-backs. **All deployments happen upfront (Phase 2), then all signatures (Phase 3), then sequential apply (Phases 4, 5, 6).** This is mainnet-faithful — the real production workflow deploys impls first, collects signatures offline, then executes upgrades in sequence.

**Mode A (mocked, full canonical flow, oldest block `24699169`):**

```
Phase 0:   Mode + prerequisites interview (interactive) OR detail validation (autonomous)
Phase 1.1: fork_l1.sh (start anvil on chosen port, fork upstream archive RPC)
Phase 1.2: mock-mainnet.sh (rewrite Safe storage — threshold 2, mocked owners)
Phase 1.3: (optional) start x-ray dashboard
Phase 2.1: bootstrap v4 OPCM (op-deployer/v4/bootstrap.sh)
Phase 2.2: bootstrap v5 OPCM (op-deployer/v5/bootstrap.sh)
Phase 2.3: anvil_setCode plant Succinct v2 game impl (real mainnet bytecode with post-v4 ASR baked in)
CP0:       post-deploy baseline (production contracts unchanged + new impls have code)
Phase 3.1: just sign v4 clabs+council (mock-signed Safe txs via TEST_PK)
Phase 3.2: just sign v5 clabs+council
Phase 3.3: just sign succ-v2 clabs+council
Phase 4.1: (recommended) SuperchainOps simulation v4
Phase 4.2: exec-mocked.sh v4
CP1:       post-v4 health check
Phase 5.1: (recommended) SuperchainOps simulation v5 (AFTER v4 applied)
Phase 5.2: exec-mocked.sh v5
CP2:       post-v5 health check
Phase 6.1: exec-mocked.sh succ-v2 (no separate sim or sign — sigs gathered in 3.3, impl planted in 2.3)
CP3:       post-succ-v2 health check (CRITICAL: OPSuccinctGame→ASR MUST be new v4 ASR)
Phase 7:   final comparison
```

**`exec-basefee.sh` (Phase 8) is NOT compatible with Mode A.** It requires the real 6-of-8 cLabs Safe, which Mode A mocks away. If the user asks for "basefee included" while using Mode A, the agent MUST report that Phase 8 will be skipped for Mode A and explain why.

**Mode B (real signatures, post-impls block `24742240`, shortcut for basefee testing):**

```
Phase 0:   Mode + prerequisites
Phase 1.1: fork_l1.sh at block 24742240 (after impls are already on-chain)
           NO mock-mainnet.sh — real Safe owners must remain to honor real sigs
CP0:       post-deploy baseline (real mainnet state, real OPCMs/Succinct already on-chain)
Phase 4.2: exec-jovian.sh v4 (real sigs from secrets/.env.signers.v4)
CP1:       post-v4 health check
Phase 5.2: exec-jovian.sh v5
CP2:       post-v5 health check
Phase 6.1: exec-jovian.sh succ-v2 (no Phase 2 — real `0xE7bd...` already exists)
CP3:       post-succ-v2 health check
Phase 7:   final comparison
Phase 8:   exec-basefee.sh (CRITICAL: Mode B exclusive)
CP4:       post-basefee health check
```

Mode B intentionally skips Phase 1.2 (no mock — real Safes preserved), Phase 2 (real OPCMs and Succinct impl already deployed), Phase 3 (no signing — real sigs already in `secrets/.env.signers.*`), and Phase 4.1 / 5.1 (no simulations).

**You do NOT get to invent hybrid orders, skip steps in Mode A, or rename phases.** The canonical order is the canonical order. If the flow fails at step N, you report the failure at step N — you do NOT jump ahead to make it "work".

### 2. Phase skipping rules

| Mode                   | Skippable phases (optional)                                                                                                                                                                                                                           | Non-skippable phases (mandatory)                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Mode A (mocked)**    | Phase 4.1 (sim v4 — **recommended**, skip only if simulation env unavailable), Phase 5.1 (sim v5 — **recommended**, same), Phase 8 (basefee — incompatible)                                                                                           | **0, 1.1, 1.2, 2.1, 2.2, 2.3, CP0, 3.1, 3.2, 3.3, 4.2, CP1, 5.2, CP2, 6.1, CP3, 7** |
| **Mode B (real sigs)** | Phase 1.2 (mock — REJECT), Phase 2 (all — real OPCMs and Succinct impl already deployed at the mainnet post-impls block), Phase 3 (all — real sigs already in `secrets/.env.signers.*`), Phase 4.1 (sim — recommended), Phase 5.1 (sim — recommended) | **0, 1.1, CP0, 4.2, CP1, 5.2, CP2, 6.1, CP3, 7, 8 (if requested), CP4**             |

If the user asks for "oldest block + full pipeline + basefee", you MUST:

1. Explain that basefee requires Mode B (post-impls block), AND
2. Pick exactly one of these and document it:
   - **Option A**: Run Mode A for Phases 0-7, explicitly note Phase 8 is skipped due to incompatibility
   - **Option B**: Run Mode B end-to-end with basefee at block `24742240` (skip the "oldest block" requirement)
   - **Option C**: Run Mode A first (Phases 0-7), cleanup, then re-fork at block `24742240` and run Mode B Phases 0-1 + 4.2 + 5.2 + 6.1 + 8 (rare, rarely worth the effort)

You MUST NOT silently switch modes mid-run.

### 3. "Non-interactive" does NOT mean "skip validation"

Autonomous background agents still MUST:

- Run every on-chain validation query documented for each checkpoint
- Present PASS/FAIL tables in their output (even if no human reads them live)
- Acknowledge each mandatory x-ray offer ("headless: would offer x-ray here, skipping per environment")
- Stop and report failure instead of inventing workarounds

Skipping validations because "I'm non-interactive anyway" is a **binding violation**.

### 4. Operator input is mandatory for RPC selection

Phase 0.4 **MUST** obtain the upstream archive RPC URL from the operator before starting. Public RPCs (llamarpc, publicnode, cloudflare, flashbots) do NOT serve sufficient historical state at block `24699169` and will break:

- Succinct forge deployment (historical state query failures)
- SuperchainOps `forge script` simulations (historical archive traversal)

Acceptable sources: **archive-tier Alchemy, archive-tier Infura, Tenderly gateway, internal Celo archive nodes, or an equivalent.** You MUST ask for this URL explicitly. You MUST NOT guess or default to a public endpoint and hope it works.

### 5. No double-running, no retry loops

Each script runs **ONCE per run**. If `bootstrap.sh` or `exec-mocked.sh` fails partway, the correct recovery is: **kill anvil, re-fork fresh, restart from Phase 1.1**. Do NOT re-run bootstrap on a dirty state (this causes CREATE2 address drift and ghost collisions). Do NOT retry `exec-mocked` without re-mocking.

### 6. Cleanup is part of the run

Every run ends with cleanup, whether success or failure. See [Cleanup Discipline](#cleanup-discipline) below.

---

## MANDATORY CHECKPOINT REVIEW PROTOCOL

> **NON-NEGOTIABLE**: At **every** checkpoint (CP0 through CP4), you MUST complete the following 4 steps in order. There are no valid excuses for skipping any of them — "non-interactive" is not an excuse, "headless" is not an excuse, "I'm a background task" is not an excuse.

### Step 1: Run on-chain validation queries

Execute every `cast call` and `cast storage` query documented for the current checkpoint. Do not substitute, summarize, or skip.

### Step 2: Present PASS/FAIL table

Render a markdown table with columns: `Check | Expected | Actual | Status`. Every row is PASS or FAIL against documented expected values (versions, addresses, nonces). If a check is FAIL, you MUST stop the pipeline and report — do NOT proceed to the next phase on FAIL.

### Step 3: X-Ray Offer (mode-sensitive)

You MUST explicitly include the x-ray dashboard offer in your output at every checkpoint. The form it takes depends on execution mode:

**Interactive mode** (a human operator can respond):

> "Would you like to open/refresh the x-ray dashboard (http://localhost:8080, Localhost tab) to visually verify the [CP0/CP1/CP2/CP3/CP4] state before proceeding? If x-ray isn't running yet, I can start it for you with `python3 -m http.server 8080` in packages/op-tooling/x-ray/."

Wait for the operator's response before proceeding.

**Autonomous / headless mode** (no interactive operator — background tasks, CI):
You do NOT need to start x-ray or wait for a response. Instead, you MUST explicitly acknowledge the offer in your output with this exact pattern:

> "**X-Ray Offer (headless mode)**: At [CP0/CP1/CP2/CP3/CP4], I would normally offer to open/refresh the x-ray dashboard at http://localhost:8080 (Localhost tab) for visual verification. Skipping interactive offer because execution mode is autonomous/background. Proceeding to the next phase."

The acknowledgment IS the offer in autonomous mode. **Silent skipping is a binding violation**. The goal is that your output always makes the x-ray step visible to whoever reviews your work.

### Step 4: Gate to next phase

- **Interactive mode**: pause for explicit operator confirmation
- **Autonomous mode**: only proceed if Step 1 had zero FAILs AND Step 2 table is rendered AND Step 3 acknowledgment is printed. On any FAIL, stop and report.

---

## AUTONOMOUS EXECUTION PROTOCOL

If you are running as an autonomous background task (you cannot wait for operator input), follow these additional rules.

### Compaction resilience

Long runs (30+ minutes) may be auto-compacted by the runtime. To survive compaction without losing context:

1. **At the start of every phase**, write the current WIP state to a well-known file:

   ```bash
   cat > /tmp/jovian-wip-$PORT.md <<EOF
   # Jovian Run WIP State — port $PORT
   - Fork block: $BLOCK_NUMBER
   - Mode: [A mocked | B real sigs]
   - Upstream RPC: [redact the key but note provider]
   - Celo root: $CELO_ROOT
   - Current phase: [X]
   - Last successful checkpoint: [CP0/CP1/...]
   - Anvil PID: $(cat /tmp/anvil-$PORT.pid 2>/dev/null)
   - Recent command outputs saved to: /tmp/jovian-$PORT/*.log
   EOF
   ```

2. **On compaction restart**, read `/tmp/jovian-wip-$PORT.md` FIRST before doing anything else. Use it to re-establish state without re-deriving from scratch.

3. **Never ask a clarifying question after compaction** — you have no operator. If you don't know how to proceed, resume from the last WIP checkpoint or fail-stop with a clear explanation in your final report.

### Never ask questions

In autonomous mode you do NOT have an operator. If your prompt says "non-interactive" or "background task", then every decision is yours to make. Document each decision as you make it. **Never call `mcp_question` or emit a question expecting a response.** If information is missing, either use the documented default or fail-stop with a clear reason.

### Parallel tool-call hygiene

Do NOT run multiple `cast` or `forge` commands in parallel if they target the same anvil instance. Some agents have lost anvil processes to parallel-tool side-effects (process manager killing siblings). Prefer sequential calls or group reads into a single bash invocation.

### Log capture

Save the output of every long-running command to a per-port log file under `/tmp/jovian-$PORT/`. This lets you diagnose failures after the fact and survives compaction.

---

## CONCRETE NETWORK REFERENCE ADDRESSES

Throughout this skill, checkpoint validation queries use placeholders like `{system_config_proxy}` or `{dgf_proxy}`. **Substitute them with the concrete addresses below** based on the network you are running against.

### Mainnet (Celo L2 on Ethereum mainnet)

| Placeholder                               | Address                                      | Description                                       |
| ----------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| `{system_config_proxy}`                   | `0x89E31965D844a309231B1f17759Ccaf1b7c09861` | SystemConfig (main entrypoint)                    |
| `{dgf_proxy}`                             | `0xFbAC162162f4009Bb007C6DeBC36B1dAC10aF683` | DisputeGameFactory                                |
| `{asr_proxy}` (pre-v4)                    | `0x9F18D91949731E766f294A14027bBFE8F28328CC` | Old AnchorStateRegistry (used before v4 upgrade)  |
| `{celo_superchain_config_proxy}` (pre-v4) | `0xa440975E5A6BB19Bc3Bee901d909BB24b0f43D33` | Old CeloSuperchainConfig (used before v4 upgrade) |
| `{parent_safe}`                           | `0x4092A77bAF58fef0309452cEaCb09221e556E112` | ProxyAdminOwner / top-level nested Safe           |
| `{clabs_safe}`                            | `0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d` | cLabs team Safe (child of parent)                 |
| `{council_safe}`                          | `0xC03172263409584f7860C25B6eB4985f0f6F4636` | Council team Safe (child of parent)               |
| `{optimism_portal_proxy}`                 | `0xc5c5D157928BDBD2ACf6d0777626b6C75a9EAEDC` | OptimismPortal                                    |
| `{l1_standard_bridge_proxy}`              | `0x9C4955b92F34148dbcfDCD82e9c9eCe5CF2badfe` | L1StandardBridge                                  |
| `{l1_cross_domain_messenger_proxy}`       | `0x1AC1181fc4e4F877963680587AEAa2C90D7EbB95` | L1CrossDomainMessenger                            |
| `{l1_erc721_bridge_proxy}`                | `0x3C519816C5BdC0a0199147594F83feD4F5847f13` | L1ERC721Bridge                                    |
| `{optimism_mintable_erc20_factory_proxy}` | `0x6f0E4f1EB98A52EfaCF7BE11d48B9d9d6510A906` | OptimismMintableERC20Factory                      |
| `{protocol_versions_proxy}`               | `0x1b6dEB2197418075AB314ac4D52Ca1D104a8F663` | ProtocolVersions                                  |
| `{permissioned_delayed_weth_proxy}`       | `0x9c314E8057025F2982aa4B3923Abd741A8e8DE91` | PermissionedDelayedWETH                           |

### Post-upgrade dynamic addresses (discovered on-chain)

These addresses do NOT exist pre-upgrade — they are created by exec v4 and must be discovered at runtime via `cast call`:

| Post-phase             | Discovery query                                                                                      | What it gives                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Post-Phase 3 (exec v4) | `cast call {system_config_proxy} "superchainConfig()(address)"`                                      | NEW CeloSuperchainConfig proxy                                      |
| Post-Phase 3 (exec v4) | `cast call $(cast call {dgf_proxy} "gameImpls(uint32)(address)" 1) "anchorStateRegistry()(address)"` | NEW AnchorStateRegistry proxy (this is the `$LIVE_ASR` for Phase 5) |

### Sepolia and Chaos

For sepolia and chaos networks, consult `verify-versions.sh` for the full address tables. This skill's checkpoint validations use mainnet addresses; sepolia/chaos runs should substitute accordingly.

### OPCM addresses (post-bootstrap)

After Phase 2.1 and 2.2 (Mode A only), record the local OPCM addresses for later validation:

```bash
OPCM_V4=$(jq -r '.opcm' $CELO_ROOT/packages/op-tooling/op-deployer/v4/config-upgrade.json)
OPCM_V5=$(jq -r '.opcm' $CELO_ROOT/packages/op-tooling/op-deployer/v5/config-upgrade.json)
```

Mode B uses the hardcoded real mainnet OPCMs (already deployed on-chain at block `24742240`):

- OPCM v4 mainnet: `0x5fe49eb068a4e3c52255e1f3c1273be331262842`
- OPCM v5 mainnet: `0x503c51b8de2bc78d5f83c179b786b2aa1c454635`

---

## CLEANUP DISCIPLINE

Every run ends with cleanup — whether the pipeline succeeded, failed, or was interrupted. This is **mandatory** and part of your contract.

### Required cleanup steps

1. **Kill your anvil process** by PID (saved to `/tmp/anvil-$PORT.pid`):

   ```bash
   if [ -f /tmp/anvil-$PORT.pid ]; then
     kill $(cat /tmp/anvil-$PORT.pid) 2>/dev/null || true
     rm -f /tmp/anvil-$PORT.pid
   fi
   ```

2. **Kill any TCP forwarder/bridge processes** you started:

   ```bash
   pkill -f "tcp-bridge-$PORT" 2>/dev/null || true
   ```

3. **Verify the port is free**:

   ```bash
   if lsof -ti:$PORT >/dev/null 2>&1; then
     echo "WARNING: port $PORT still busy after cleanup"
   fi
   ```

4. **Preserve logs** (do NOT delete `/tmp/jovian-$PORT/`) — the operator may want to inspect them.

5. **Print a cleanup summary** as the last step of your final report:
   ```
   ## Cleanup
   - Anvil on port $PORT: killed
   - Forwarders: none / killed
   - Logs preserved at: /tmp/jovian-$PORT/
   ```

### Cleanup violations

Leaving a zombie anvil or forwarder behind is a **binding violation**. If you can't clean up (e.g., you crashed before reaching the cleanup step), document it explicitly in your final output so the operator knows to manually clean up. **Silent leaks are the worst outcome.**

---

## Quick Reference

The skill is designed so reading top-to-bottom matches execution order. There are no loop-backs. **All deployments happen upfront, then signatures, then sequential apply.**

| Phase | Action                                                                                    | Mode A        | Mode B      | Key Script(s)                                       |
| ----- | ----------------------------------------------------------------------------------------- | ------------- | ----------- | --------------------------------------------------- |
| 0     | Mode detection + prerequisites (interview OR validate passed details)                     | required      | required    | (interactive or autonomous)                         |
| 1.1   | Start anvil L1 fork                                                                       | required      | required    | `fork_l1.sh` (`PORT=...` env)                       |
| 1.2   | Mock Safe storage (mocked owners + threshold 2)                                           | required      | **SKIP**    | `mock-mainnet.sh` (`RPC_URL=...` env)               |
| 2.1   | Bootstrap v4 OPCM                                                                         | required      | **SKIP**    | `op-deployer/v4/bootstrap.sh`                       |
| 2.2   | Bootstrap v5 OPCM                                                                         | required      | **SKIP**    | `op-deployer/v5/bootstrap.sh`                       |
| 2.3   | Plant Succinct v2 impl (real mainnet bytecode via `anvil_setCode`)                        | required      | **SKIP**    | `cast code` + `cast rpc anvil_setCode`              |
| CP0   | Post-deploy baseline (production unchanged + new impls have code)                         | required      | required    | `verify-versions.sh` + `cast`                       |
| 3     | Gather all signatures (v4 + v5 + succ-v2 × clabs+council = 12 sigs upfront)               | required      | **SKIP**    | CeloSuperchainOps `just sign`                       |
| 4.1   | (recommended) Simulate v4                                                                 | recommended   | recommended | SuperchainOps `./simulate.sh` (v410-celo)           |
| 4.2   | Execute v4 → CP1                                                                          | required      | required    | `exec-mocked.sh` v4 / `exec-jovian.sh` v4           |
| 5.1   | (recommended) Simulate v5 (after v4 applied)                                              | recommended   | recommended | SuperchainOps `./simulate.sh` (v500-celo)           |
| 5.2   | Execute v5 → CP2                                                                          | required      | required    | `exec-mocked.sh` v5 / `exec-jovian.sh` v5           |
| 6.1   | Execute succ-v2 → CP3 (no separate simulate; sigs already gathered, impl already planted) | required      | required    | `exec-mocked.sh` succ-v2 / `exec-jovian.sh` succ-v2 |
| 7     | Final comparison                                                                          | required      | required    | (markdown table + x-ray refresh)                    |
| 8     | **Apply basefee → CP4** (Mode B exclusive — incompatible with Mode A)                     | **NOT VALID** | optional    | `exec-basefee.sh`                                   |

> **At EVERY checkpoint (CP0, CP1, CP2, CP3, and CP4 if Phase 8 is run)**: run validation queries → present PASS/FAIL table → **MANDATORY: offer x-ray dashboard** → pause for user confirmation (interactive) or acknowledge headless template (autonomous) → proceed. See [Mandatory Checkpoint Review Protocol](#mandatory-checkpoint-review-protocol) below.

---

## PHASE 0 — PREREQUISITES INTERVIEW

### Step 0.1: Collect Repository Paths

Ask the user for the local path to each repository. Do NOT assume default paths.

```
I need the local paths to 6 repositories for the Jovian upgrade.
Please provide each path (or confirm if the suggested default exists):

1. Celo monorepo (this repo): ___
2. Optimism (v4 op-deployer): ___
3. Optimism2 (v5 op-deployer): ___
4. SuperchainOps: ___
5. CeloSuperchainOps: ___
6. Succinct: ___
```

Store these as variables for the rest of the session:

- `CELO_ROOT` — Path to Celo monorepo
- `OP_ROOT_V4` — Path to Optimism (v4)
- `OP_ROOT_V5` — Path to Optimism2 (v5)
- `SUPERCHAIN_OPS` — Path to SuperchainOps
- `CELO_SUPERCHAIN_OPS` — Path to CeloSuperchainOps
- `SUCCINCT_ROOT` — Path to Succinct

### Step 0.2: Select Network

Ask the user which network to fork. Default is **mainnet**.

| Network   | L1 Fork Chain ID | Mock Script                       | Exec Script (mocked) |
| --------- | ---------------- | --------------------------------- | -------------------- |
| `mainnet` | 1                | `mock-mainnet.sh`                 | `exec-mocked.sh`     |
| `sepolia` | 11155111         | `mock-sepolia.sh`                 | `exec-mocked.sh`     |
| `chaos`   | 11155111         | `mock-sepolia.sh` (NETWORK=chaos) | `exec-mocked.sh`     |

### Step 0.3: Select Execution Mode

Ask the user which execution mode to use:

**Mode A: Mocked (default)** — Use mocked accounts, CeloSuperchainOps for signing, `exec-mocked.sh` for execution.

**Mode B: Dry-run with real signatures** — Skip mocking, use `exec-jovian.sh` (mainnet) or `exec-jovian-sepolia.sh` (sepolia). Requires decrypted signer files in `secrets/`. The canonical exec scripts are located at `packages/op-tooling/exec/exec-jovian.sh` (mainnet) and `packages/op-tooling/exec/exec-jovian-sepolia.sh` (sepolia). You do NOT need to ask the user for a custom exec script path — use these canonical paths unless the user explicitly provides an override.

If Mode B is selected, ask for:

- Path to the exec script (e.g., `exec-jovian.sh` or a custom script)
- Whether signer files are decrypted

### Step 0.4: Collect Configuration

Ask the user for:

1. **Fork block number** — User can provide their own or pick from a suggested default below:

   **Celo Mainnet (L1 Ethereum)**:
   | Block | Description | Canonical Mode |
   |-------|-------------|----------------|
   | `24699169` | Before v4, v5, succ-v2 impls deployed | **Mode A** — Full canonical flow: mock, bootstrap v4/v5 OPCMs, plant Succinct v2 via `anvil_setCode` (real mainnet bytecode), CP0, gather signatures, simulate, exec v4/v5/succ-v2. **Cannot run Phase 8 basefee** (Mode A mocks the cLabs Safe, exec-basefee requires real 6-of-8). |
   | `24742240` | After impls deployed, before proposal execution | **Mode B** — Execution-only: real mainnet OPCMs already exist, use `exec-jovian.sh` with pre-signed real signatures. **Required for Phase 8 basefee testing.** |

   **Celo Sepolia (L1 Sepolia)**:
   | Block | Description | Best for |
   |-------|-------------|----------|
   | `10459393` | Before ownership transfer | Full flow: mock sepolia, transfer ownership, deploy, execute |
   | `10462786` | After ownership fixed, before impl deployment | Deploy impls + execute txs |

   **Celo Chaos (L1 Sepolia)**:
   | Block | Description | Best for |
   |-------|-------------|----------|
   | `10382100` | Before ownership transfer | Full flow: mock chaos, transfer ownership, deploy, execute |
   | `10382216` | After ownership fixed, before impl deployment | Deploy impls + execute txs |

2. **Upstream RPC URL** for forking — **REQUIRED OPERATOR INPUT**. You MUST obtain this from the user. The URL **must be network-matched** to the target network: `https://mainnet.gateway.tenderly.co/…` for mainnet, `https://sepolia.gateway.tenderly.co/…` for sepolia (chaos uses the sepolia gateway as well since chaos is a Sepolia-based devnet). Mixing networks (e.g., pointing a mainnet fork at a sepolia RPC) will fail. **Public RPCs (llamarpc, publicnode, cloudflare, flashbots) are NOT acceptable** — they do NOT serve sufficient historical state at pre-impls blocks and will break Succinct forge deployment + SuperchainOps simulations mid-flow. Acceptable sources: **archive-tier Alchemy, archive-tier Infura, Tenderly gateway, or a private archive node.** If the user does not provide an acceptable RPC, you MUST stop and ask for one explicitly — do NOT guess, do NOT default to a public endpoint.

3. **Anvil listen port** — default `8545`. If using a different port, pass it as `PORT=$RPC_PORT` to `fork_l1.sh` and set `RPC_URL=http://127.0.0.1:$RPC_PORT` when invoking all downstream scripts (`mock-mainnet.sh`, `exec-mocked.sh`, `verify-versions.sh`, and CeloSuperchainOps `just` recipes). Every script in this pipeline now honors the `RPC_URL` env override.

4. **Deployer private key** — **REQUIRED operator input**. The skill does NOT hardcode the deployer PK. Ask the user interactively, OR require it in the orchestrator prompt / `DEPLOYER_PK` env var for autonomous mode. The corresponding sender address is **network-specific** — on mainnet it's `0x95FFAC468e37DdeEF407FfEf18f0cC9E86D8f13B` (baked into `exec-mocked.sh` / `exec-jovian.sh` as a static constant); sepolia and chaos have different sender addresses. Inspect the network-specific `exec-*.sh` script's `SENDER=` line to confirm the expected sender for your target network. The operator-provided PK must derive to that exact address. Do NOT substitute the Anvil account #0 key (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`) unless the user explicitly asks — its sender (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) mismatches the hardcoded exec-script SENDER on every network and will fail signature verification.

### Step 0.5: Validate Repository State

For each repo, validate the branch and build state. **Build on behalf of the user if artifacts are missing.**

#### Optimism (v4)

```bash
# 1. Check branch
git -C $OP_ROOT_V4 branch --show-current
# Expected: op-deployer/v4.1.0 (or detached HEAD at that tag)
# If wrong branch → WARN user and ask them to switch
```

```bash
# 2. Check op-deployer binary
ls -la $OP_ROOT_V4/op-deployer/bin/op-deployer 2>/dev/null
```

If binary is missing, **build it for the user**:

```bash
cd $OP_ROOT_V4/op-deployer && just build
# Fallback if 'just build' doesn't work on this branch:
# cd $OP_ROOT_V4/op-deployer && just build-go
```

```bash
# 3. Check forge artifacts exist and are non-empty
ARTIFACT_COUNT=$(ls $OP_ROOT_V4/packages/contracts-bedrock/forge-artifacts/ 2>/dev/null | wc -l)
echo "Forge artifacts: $ARTIFACT_COUNT directories"
```

If artifacts are missing or empty (count = 0), **build them for the user**:

```bash
cd $OP_ROOT_V4/packages/contracts-bedrock && forge build
```

> **Note**: Building forge artifacts can take 5-10 minutes. Inform the user.

#### Optimism2 (v5)

```bash
# 1. Check branch
git -C $OP_ROOT_V5 branch --show-current
# Expected: op-deployer/v5.0.0
```

```bash
# 2. Check op-deployer binary
ls -la $OP_ROOT_V5/op-deployer/bin/op-deployer 2>/dev/null
```

If binary is missing, **build it for the user**:

```bash
cd $OP_ROOT_V5/op-deployer && just build
# Fallback: just build-go
```

```bash
# 3. Check forge artifacts
ARTIFACT_COUNT=$(ls $OP_ROOT_V5/packages/contracts-bedrock/forge-artifacts/ 2>/dev/null | wc -l)
echo "Forge artifacts: $ARTIFACT_COUNT directories"
```

If artifacts are missing or empty, **build them**:

```bash
cd $OP_ROOT_V5/packages/contracts-bedrock && forge build
```

#### SuperchainOps

```bash
# Check branch
git -C $SUPERCHAIN_OPS branch --show-current
# Expected: release/v5.0.0

# Check task directories exist (mainnet)
ls $SUPERCHAIN_OPS/src/tasks/eth/048-opcm-upgrade-v410-celo/
ls $SUPERCHAIN_OPS/src/tasks/eth/049-opcm-upgrade-v500-celo/
```

For sepolia, check `src/tasks/sep/` equivalents.

#### CeloSuperchainOps

```bash
# Check branch
git -C $CELO_SUPERCHAIN_OPS branch --show-current

# Check upgrade JSONs exist
ls $CELO_SUPERCHAIN_OPS/upgrades/{network}/
# Should contain: 05-v4.json, 06-v5.json, 07-succ-v2.json (or similar)
```

#### Succinct

This repo requires the most careful validation — vkeys must match the deployed verifier and the config must be freshly fetched.

```bash
# 1. Check branch/commit
git -C $SUCCINCT_ROOT branch --show-current
git -C $SUCCINCT_ROOT log --oneline -1
```

**Ask the user**: "Is this the correct branch/commit for Succinct? Vkeys are commit-dependent — using the wrong commit will deploy a game with mismatched vkeys."

```bash
# 2. Check forge build in contracts/
ls $SUCCINCT_ROOT/contracts/out/ 2>/dev/null | head -3
```

If contracts not built, **build them**:

```bash
cd $SUCCINCT_ROOT/contracts && forge build
```

```bash
# 3. Check for existing FDG config file
ls $SUCCINCT_ROOT/contracts/opsuccinctfdgconfig*.json 2>/dev/null
```

**Ask the user one of**:

**A) Config already fetched** — "Which config file should I use?" Enumerate the available files from the operator's local clone:

```bash
ls $SUCCINCT_ROOT/contracts/opsuccinctfdgconfig*.json 2>/dev/null
```

**The user MUST pick one — do NOT guess.** There is no canonical / default filename. Different operators have different files with different vkeys (e.g., `aggregationVkey`, `rangeVkeyCommitment`, `rollupConfigHash`). The wrong choice deploys a game whose proofs cannot be verified by the live verifier. If the user's request explicitly names the config file, use that exact name. Otherwise, list the available files and ask. In autonomous mode: if the orchestrator did not pass the exact filename, QUIT with the missing-detail template — do NOT auto-select a file even if only one exists.

**B) Config not fetched** — "I'll fetch the config now. This runs `just fetch-fdg-config .env.{network} eigenda` which generates `contracts/opsuccinctfdgconfig.json`. Do you want me to rename it to `opsuccinctfdgconfig.{network}.json` to avoid overwriting other network configs?"

If fetching:

```bash
cd $SUCCINCT_ROOT
just fetch-fdg-config .env.{network} eigenda

# If user wants rename:
mv $SUCCINCT_ROOT/contracts/opsuccinctfdgconfig.json $SUCCINCT_ROOT/contracts/opsuccinctfdgconfig.{network}.json
```

```bash
# 4. Read the chosen config and extract deployment parameters
cat $SUCCINCT_ROOT/contracts/{chosen_config_file}
```

Extract and display the key parameters from the config file to the user for confirmation:

```bash
# Parse deployment parameters from config JSON
CONFIG_FILE=$SUCCINCT_ROOT/contracts/{chosen_config_file}
echo "=== Succinct v2 Deployment Parameters (from $CONFIG_FILE) ==="
echo "aggregationVkey:      $(jq -r '.aggregationVkey' $CONFIG_FILE)"
echo "rangeVkeyCommitment:  $(jq -r '.rangeVkeyCommitment' $CONFIG_FILE)"
echo "rollupConfigHash:     $(jq -r '.rollupConfigHash' $CONFIG_FILE)"
echo "verifierAddress:      check .env.{network} or use known verifier"
echo "anchorStateRegistry:  check .env.{network}"
echo "accessManager:        check .env.{network}"
```

These values were historically used by the forge-deploy path. In the current canonical Mode A flow, Phase 2.3 uses `anvil_setCode` with real mainnet bytecode instead, so the config file is validated as present (to enforce that the Succinct repo is set up correctly) but not actually consumed during deployment. Store the config file path as `$SUCCINCT_CONFIG_FILE` for backwards compatibility with any agent that expects it.

**Ask the user**: "Please confirm these vkeys and parameters are correct for the Jovian upgrade. Proceed?"

### Step 0.6: Validate Tools

Check that required CLI tools are available:

```bash
which anvil cast forge jq just 2>/dev/null
# Or via mise:
mise which anvil cast forge jq just 2>/dev/null
```

Report any missing tools and instruct user to install them.

---

## PHASE 1 — FORK & MOCK SETUP

### Step 1.1: Fork L1

#### Step 1.1.0: Check for Existing Anvil

Before starting a new fork, check if Anvil is already running on port 8545:

```bash
lsof -ti:8545
```

If a process is found, ask the user:

1. **Kill existing Anvil and use port 8545 (default)** — `lsof -ti:8545 | xargs kill`
2. **Use a different port** (e.g., 9545 or user-specified) — All subsequent commands must use `--rpc-url http://localhost:{port}` instead of 8545
3. **Keep existing Anvil** — If user has a fork they want to reuse (skip fork step)

Store the chosen port as `RPC_PORT` (default: 8545) and `RPC_URL=http://localhost:$RPC_PORT` for all subsequent commands.

> **⚠️ zsh / bash export gotcha**: do NOT combine PORT and RPC_URL in a single export line:
>
> ```bash
> # WRONG — $PORT expands BEFORE the new value is set
> export PORT=8549 RPC_URL="http://127.0.0.1:$PORT"
> # Result: RPC_URL=http://127.0.0.1:  (empty port!)
> ```
>
> Use two separate export statements:
>
> ```bash
> # CORRECT
> export PORT=8549
> export RPC_URL="http://127.0.0.1:$PORT"
> # Result: RPC_URL=http://127.0.0.1:8549
> ```
>
> Or expand manually inline:
>
> ```bash
> export PORT=8549 RPC_URL=http://127.0.0.1:8549
> ```
>
> Also: when invoking SuperchainOps recipes, set `LOCAL_RPC_URL` (not `RPC_URL`) — SuperchainOps' `foundry.toml` reads `${LOCAL_RPC_URL}` for its `rpc_endpoints` mapping. Both `RPC_URL` (Celo monorepo scripts) and `LOCAL_RPC_URL` (SuperchainOps) should be exported with the same value.

#### Step 1.1.1: Start Fork

Ask the user how they want to start the Anvil fork:

**Option A: Background fork (recommended)** — The AI spawns Anvil as a background process. Convenient, no extra terminal needed.

**Option B: Manual fork** — The user runs the command themselves in a separate terminal. Useful when the user wants full control over Anvil output.

##### Option A: Background Fork

Spawn Anvil in the background and verify it's running:

```bash
# Determine chain ID from network
# mainnet → --fork-chain-id 1
# sepolia/chaos → --fork-chain-id 11155111

anvil \
  --port $RPC_PORT \
  --fork-url {user_rpc_url} \
  --fork-chain-id {chain_id} \
  --fork-block-number {user_block_number} \
  &>/tmp/anvil-jovian.log &

echo "Anvil PID: $!"
```

Wait a few seconds for startup, then verify:

```bash
sleep 3
cast block-number --rpc-url $RPC_URL
```

> **Cleanup reminder**: When the upgrade is complete (or if you need to restart), kill Anvil:
>
> ```bash
> # Kill by PID (if you saved it)
> kill {anvil_pid}
>
> # Or find and kill by port
> lsof -ti:$RPC_PORT | xargs kill
> ```
>
> Anvil logs are at `/tmp/anvil-jovian.log` if you need to debug.

##### Option B: Manual Fork (uses fork_l1.sh)

Instruct the user to run this in a **separate terminal**. `fork_l1.sh` honors a `PORT` env var to run on a non-default port:

```bash
cd $CELO_ROOT/packages/op-tooling/fork
PORT=$RPC_PORT RPC_URL={user_rpc_url} NETWORK={network} BLOCK_NUMBER={user_block_number} ./fork_l1.sh
```

Note that in `fork_l1.sh`, `RPC_URL` refers to the **upstream** RPC (e.g., Tenderly/Alchemy/Infura archive endpoint), not the local anvil listen URL. The local listen URL is `http://127.0.0.1:$PORT`, which every downstream script (`mock-mainnet.sh`, `exec-mocked.sh`, `verify-versions.sh`) also accepts as `RPC_URL`.

Wait for user confirmation that Anvil is running, then verify:

```bash
cast block-number --rpc-url http://127.0.0.1:$RPC_PORT
```

### Step 1.2: Mock Environment

All mock scripts now honor the `RPC_URL` env var (default `http://127.0.0.1:8545`). On non-default ports, pass `RPC_URL=http://127.0.0.1:$RPC_PORT` explicitly.

**For mainnet** (mocked mode):

```bash
cd $CELO_ROOT/packages/op-tooling/fork
RPC_URL=http://127.0.0.1:$RPC_PORT \
MOCKED_SIGNER_1=0x865d05C8bB46E7AF16D6Dc99ddfb2e64BBec1345 \
MOCKED_SIGNER_2=0x899a864C6bE2c573a98d8493961F4D4c0F7Dd0CC \
MOCKED_SIGNER_3=0x480C5f2340f9E7A46ee25BAa815105B415a7c2e2 \
MOCKED_SIGNER_4=0x8Af6f11c501c082bD880B3ceC83e6bB249Fa32c9 \
./mock-mainnet.sh
```

**For sepolia** (mocked mode):

```bash
cd $CELO_ROOT/packages/op-tooling/fork
RPC_URL=http://127.0.0.1:$RPC_PORT NETWORK=sepolia ./mock-sepolia.sh
```

**For chaos** (mocked mode):

```bash
cd $CELO_ROOT/packages/op-tooling/fork
RPC_URL=http://127.0.0.1:$RPC_PORT NETWORK=chaos ./mock-sepolia.sh
```

#### Step 1.2.1: Validate Mock State

After running the mock script, verify the state changes took effect:

```bash
# Verify Safe thresholds (all should be 2)
echo "Parent threshold:" && cast call {parent_safe} "getThreshold()(uint256)" -r $RPC_URL
echo "cLabs threshold:" && cast call {clabs_safe} "getThreshold()(uint256)" -r $RPC_URL
echo "Council threshold:" && cast call {council_safe} "getThreshold()(uint256)" -r $RPC_URL

# Verify owners are the mocked signers
echo "Parent owners:" && cast call {parent_safe} "getOwners()(address[])" -r $RPC_URL
echo "cLabs owners:" && cast call {clabs_safe} "getOwners()(address[])" -r $RPC_URL
echo "Council owners:" && cast call {council_safe} "getOwners()(address[])" -r $RPC_URL

# Verify Safe nonces match expected values for v4
echo "Parent nonce:" && cast call {parent_safe} "nonce()(uint256)" -r $RPC_URL
echo "cLabs nonce:" && cast call {clabs_safe} "nonce()(uint256)" -r $RPC_URL
echo "Council nonce:" && cast call {council_safe} "nonce()(uint256)" -r $RPC_URL
```

**Expected for mainnet (mocked)**:

- All thresholds: **2**
- Parent owners: [cLabs Safe, Council Safe]
- cLabs owners: [Signer 1, Signer 2]
- Council owners: [Signer 3, Signer 4]
- Nonces: Parent=**26**, cLabs=**24**, Council=**26** (for v4 exec-mocked.sh)

If any validation fails, re-run `mock-mainnet.sh` or investigate. Do NOT proceed until mocking is confirmed.

### Step 1.3: Start X-Ray Dashboard (Optional but Recommended)

Instruct user to open a third terminal:

```bash
cd $CELO_ROOT/packages/op-tooling/x-ray
python3 -m http.server 8080
# Open http://localhost:8080 in browser, select "Localhost" tab
```

---

## PHASE 2 — DEPLOY ALL IMPLEMENTATIONS

**Mode A only.** Deploys everything needed before any upgrade is executed:

- v4 OPCM (via op-deployer)
- v5 OPCM (via op-deployer)
- Succinct v2 game implementation (via `anvil_setCode` with real mainnet bytecode)

**Mode B skips this phase entirely** because at block `24742240` the real OPCMs and the real `0xE7bd695d...` Succinct impl already exist on-chain.

**Mainnet-faithful ordering**: On real mainnet, v4 and v5 OPCMs were deployed first, then the Succinct v2 impl, then the upgrade txs were executed. This skill mirrors that order exactly: **all deployments happen upfront, all signatures are gathered next, then each upgrade runs with simulate-then-exec**.

### Step 2.1: Bootstrap v4 (Optimism repo)

```bash
cd $CELO_ROOT/packages/op-tooling/op-deployer/v4
RPC_URL=http://localhost:8545 \
NETWORK={network} \
OP_ROOT={op_root_v4} \
MULTISIG_ADDRESS={multisig_address} \
DEPLOYER_PK={deployer_pk} \
./bootstrap.sh
```

Where `{multisig_address}` is network-specific:

- mainnet: `0x4092A77bAF58fef0309452cEaCb09221e556E112`
- sepolia: `0x5e60d897Cd62588291656b54655e98ee73f0aabF`
- chaos: `0x6F8DB5374003c9ffa7084d8b65c57655963766a9`

**Expected output**: Bootstrap JSON with `opcmAddress`. Validate:

```bash
# Verify config-upgrade.json was created with correct OPCM
cat $CELO_ROOT/packages/op-tooling/op-deployer/v4/config-upgrade.json

# Verify OPCM contract exists on-chain
OPCM_V4=$(jq -r '.opcm' $CELO_ROOT/packages/op-tooling/op-deployer/v4/config-upgrade.json)
echo "OPCM v4: $OPCM_V4"
cast code-size $OPCM_V4 -r $RPC_URL
# Must be > 0 (contract exists)
```

### Step 2.2: Bootstrap v5 (Optimism2 repo)

```bash
cd $CELO_ROOT/packages/op-tooling/op-deployer/v5
RPC_URL=http://localhost:$RPC_PORT \
NETWORK={network} \
OP_ROOT={op_root_v5} \
MULTISIG_ADDRESS={multisig_address} \
DEPLOYER_PK={deployer_pk} \
./bootstrap.sh
```

**Expected output**: Bootstrap JSON with `opcmAddress`. Validate:

```bash
# Verify config-upgrade.json was created with correct OPCM
cat $CELO_ROOT/packages/op-tooling/op-deployer/v5/config-upgrade.json

# Verify OPCM contract exists on-chain
OPCM_V5=$(jq -r '.opcm' $CELO_ROOT/packages/op-tooling/op-deployer/v5/config-upgrade.json)
echo "OPCM v5: $OPCM_V5"
cast code-size $OPCM_V5 -r $RPC_URL
# Must be > 0 (contract exists)
```

### Step 2.3: Deploy Succinct v2 Game Implementation (Mode A only)

> **⚠️ TODO / FIXME — current approach is a temporary hack, not the canonical production pipeline.**
>
> **Current (accepted as hack)**: fetch real mainnet bytecode at the proposal address from the upstream archive RPC, then plant it on the local fork via `anvil_setCode`. This is operationally correct — the planted bytecode has the post-v4 ASR immutable baked in, and empirically `cast code + anvil_setCode` reproduces a working Succinct impl that CP3 accepts.
>
> **Ideal (canonical production pipeline — TODO)**: run the real Succinct deploy script
> `forge script script/fp/UpgradeOPSuccinctFDG.s.sol:UpgradeOPSuccinctFDG`
> against the correct git commit so the vkeys in the deployed impl match what Succinct's live verifier expects. This matches what Succinct's team actually runs on real mainnet.
>
> **Why we haven't switched yet**: it requires knowing the exact Succinct repo commit that produces the currently-deployed mainnet impl (`0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1`). The vkeys are commit-dependent — building at the wrong commit produces an impl whose vkeys don't match the live SP1 verifier, causing proofs to fail. Until the correct commit + matching config file are documented, the `anvil_setCode` hack is the accepted workaround.
>
> **When to migrate**: once the operator confirms the correct Succinct commit hash + the corresponding `opsuccinctfdgconfig.*.json` file that reproduces the deployed vkeys exactly, this section should be rewritten to run the real forge script with `ANCHOR_STATE_REGISTRY=<the post-v4 ASR>` (fetched dynamically from the planted/deployed state), `AGGREGATION_VKEY`/`RANGE_VKEY_COMMITMENT`/`ROLLUP_CONFIG_HASH` from the confirmed config file, and the rest of the parameters from `.env.{network}`.
>
> **Load-bearing assumption for the current hack**: when v4 executes later (Phase 4.2), it will create the NEW ASR proxy at exactly `0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d` — the same address as real mainnet. This holds because op-deployer bootstraps the v4 OPCM deterministically (same salt, same Create2Deployer address, same inputs), and OPCM v4 creates the ASR proxy via CREATE2 with deterministic inputs. Empirically verified across multiple Mode A runs.

**Step 2.3.1 (current hack)**: Fetch the real mainnet Succinct impl bytecode from the upstream archive RPC and plant it on the local fork:

```bash
# Known mainnet proposal address
SUCCINCT_IMPL_ADDR=0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1

# Fetch real mainnet bytecode from the upstream RPC (same one used for the fork)
MAINNET_CODE=$(cast code $SUCCINCT_IMPL_ADDR -r {upstream_rpc_url})
[ -z "$MAINNET_CODE" ] || [ "$MAINNET_CODE" = "0x" ] && \
  echo "FAIL: upstream RPC returned empty bytecode at $SUCCINCT_IMPL_ADDR — check upstream RPC is archive-capable and the impl is actually deployed" && exit 1

# Plant the real mainnet bytecode at the same address on the local fork
cast rpc anvil_setCode $SUCCINCT_IMPL_ADDR "$MAINNET_CODE" -r $RPC_URL

# Verify
printf 'Planted Succinct codesize:  '; cast codesize $SUCCINCT_IMPL_ADDR -r $RPC_URL
printf 'Planted Succinct version:   '; cast call $SUCCINCT_IMPL_ADDR "version()(string)" -r $RPC_URL
printf 'Planted Succinct gameType:  '; cast call $SUCCINCT_IMPL_ADDR "gameType()(uint32)" -r $RPC_URL
printf 'Planted Succinct ASR:       '; cast call $SUCCINCT_IMPL_ADDR "anchorStateRegistry()(address)" -r $RPC_URL
```

**Expected** (mainnet):

- `codesize: 9033`
- `version: "2.0.0"`
- `gameType: 42`
- `anchorStateRegistry: 0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d`

**If the ASR does not match `0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d`** (e.g., upstream RPC returned stale bytecode or you're on a different network), abort and report — CP3 will fail later otherwise.

> **Why not local forge deploy?** Local forge deploys were the previous canonical approach but they bake in whatever `ANCHOR_STATE_REGISTRY` the env/config file specifies. `Succinct/.env.mainnet` hardcodes the PRE-v4 ASR (`0x9F18D919...`) which is wrong — the resulting impl would point at the wrong ASR forever (immutables can't be patched). Fetching real mainnet bytecode via `cast code` sidesteps this entirely.

> **Sepolia/chaos networks**: the Succinct impl address and baked ASR are different. Substitute the network-specific proposal address from `$CELO_SUPERCHAIN_OPS/upgrades/{network}/*-succ-v2.json` and fetch its bytecode from the appropriate upstream archive RPC.

---

## CHECKPOINT 0 — Post-Deploy Baseline

After all implementations are deployed (Phase 2), capture the baseline of production contracts (which should be unchanged — bootstraps and `anvil_setCode` do not mutate existing proxies) AND verify the new deployments have code.

### Capture Baseline State

Run `verify-versions.sh` and/or x-ray to record the starting point:

```bash
cd $CELO_ROOT/packages/op-tooling/verify
NETWORK={network} RPC_URL=$RPC_URL ./verify-versions.sh
```

### Validate Baseline

Confirm with on-chain queries (substitute `{system_config_proxy}`, `{dgf_proxy}`, etc. from [CONCRETE NETWORK REFERENCE ADDRESSES](#concrete-network-reference-addresses)):

```bash
# CeloSuperchainConfig — record current guardian and version (pre-v4 state)
echo "Old CSC impl:" && cast storage {celo_superchain_config_proxy} 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc -r $RPC_URL
echo "Old CSC guardian:" && cast call {celo_superchain_config_proxy} "guardian()(address)" -r $RPC_URL
echo "Old CSC version:" && cast call {celo_superchain_config_proxy} "version()(string)" -r $RPC_URL

# AnchorStateRegistry — pre-v4 (the OLD ASR proxy)
echo "Old ASR impl:" && cast storage {asr_proxy} 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc -r $RPC_URL

# PermissionedGame (type 1) — pre-v4 state, points to old ASR
PERM_GAME=$(cast call {dgf_proxy} "gameImpls(uint32)(address)" 1 -r $RPC_URL)
echo "PermissionedGame impl: $PERM_GAME"
echo "PG version:" && cast call $PERM_GAME "version()(string)" -r $RPC_URL
echo "PG→ASR (old):" && cast call $PERM_GAME "anchorStateRegistry()(address)" -r $RPC_URL

# OPSuccinctGame (type 42) — pre-succ-v2 state (could be old impl or no game)
SUCC_GAME=$(cast call {dgf_proxy} "gameImpls(uint32)(address)" 42 -r $RPC_URL)
echo "OPSuccinctGame impl (pre-succ-v2): $SUCC_GAME"
echo "SG→ASR (old):" && cast call $SUCC_GAME "anchorStateRegistry()(address)" -r $RPC_URL 2>/dev/null || echo "(no game registered)"

# SystemConfig owner (pre-succ-v2 — should be ProxyAdminOwner)
echo "SystemConfig owner:" && cast call {system_config_proxy} "owner()(address)" -r $RPC_URL

# Verify all 3 implementations exist on-chain (Mode A: newly bootstrapped; Mode B: already deployed at fork block)
echo ""
echo "=== Implementation verification ==="

# Mode A: read OPCM addresses from local op-deployer bootstrap outputs
# Mode B: use hardcoded real mainnet OPCM addresses (no bootstrap was run)
if [ "$MODE" = "A" ] && [ -f $CELO_ROOT/packages/op-tooling/op-deployer/v4/config-upgrade.json ]; then
  OPCM_V4=$(jq -r '.opcm' $CELO_ROOT/packages/op-tooling/op-deployer/v4/config-upgrade.json)
  OPCM_V5=$(jq -r '.opcm' $CELO_ROOT/packages/op-tooling/op-deployer/v5/config-upgrade.json)
else
  # Mode B: hardcoded real mainnet OPCMs (already on-chain at block 24742240)
  OPCM_V4=0x5fe49eb068a4e3c52255e1f3c1273be331262842
  OPCM_V5=0x503c51b8de2bc78d5f83c179b786b2aa1c454635
fi

SUCCINCT_IMPL=0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1
printf 'OPCM v4 (%s) codesize:  ' "$OPCM_V4"; cast codesize $OPCM_V4 -r $RPC_URL
printf 'OPCM v5 (%s) codesize:  ' "$OPCM_V5"; cast codesize $OPCM_V5 -r $RPC_URL
printf 'Succinct v2 (%s) codesize:  ' "$SUCCINCT_IMPL"; cast codesize $SUCCINCT_IMPL -r $RPC_URL
printf 'Succinct v2 ASR (sanity): '; cast call $SUCCINCT_IMPL "anchorStateRegistry()(address)" -r $RPC_URL
```

> **Mode A**: OPCM addresses come from local bootstrap outputs (`config-upgrade.json`), Succinct impl from Phase 2.3 `anvil_setCode`.
> **Mode B**: OPCM and Succinct addresses are hardcoded real mainnet values — they already exist on-chain at block `24742240` with code.

**Expected baseline** (pre-upgrade production state, post-deploy new impls):

- All production contracts at **v3 (Isthmus)** / initial version tags
- PermissionedGame type 1: version **1.4.1** (Isthmus)
- SystemConfig owner: **ProxyAdminOwner** (Parent Safe)
- CeloSuperchainConfig: live guardian (record for comparison vs CP1's NEW CSC guardian which must be cLabs Safe)
- **OPCM v4 codesize > 0** (newly bootstrapped)
- **OPCM v5 codesize > 0** (newly bootstrapped)
- **Succinct v2 codesize = 9033** (planted from real mainnet bytecode)
- **Succinct v2 ASR = `0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d`** (the address v4 will deterministically create later — sanity check the planted bytecode has the expected baked-in immutable)

### X-Ray Check (MANDATORY — Ask Every Checkpoint)

> **DO NOT SKIP.** You MUST explicitly offer the x-ray dashboard to the user at every checkpoint, regardless of execution mode. Use the [Mandatory Checkpoint Review Protocol](#mandatory-checkpoint-review-protocol) headless template if you're in autonomous mode.

**Interactive mode**:

> "Would you like to open/refresh the x-ray dashboard (http://localhost:8080, Localhost tab) to visually verify the post-deploy baseline (CP0) before proceeding to gather signatures? If x-ray isn't running yet, I can start it with `python3 -m http.server 8080` in packages/op-tooling/x-ray/."

**Autonomous mode**:

> "**X-Ray Offer (headless mode)**: At CP0, I would normally offer to open/refresh the x-ray dashboard at http://localhost:8080 (Localhost tab) for visual verification. Skipping interactive offer because execution mode is autonomous/background. Proceeding to the next phase."

### Pause and Confirm

Present the baseline summary. **Ask the user to review and confirm before proceeding.**

> "Checkpoint 0 complete — all 3 implementations deployed (v4 OPCM, v5 OPCM, Succinct v2 game), production contracts unchanged at Isthmus baseline. Ready to gather signatures and execute upgrades. Continue?"

---

## PHASE 3 — GATHER ALL SIGNATURES (Mode A only)

**Mode A only.** Collect all 12 mock signatures (4 signers × 3 versions: v4, v5, succ-v2) upfront via CeloSuperchainOps `just sign`. This mirrors the mainnet workflow where signers sign offline and the executor submits later.

**Mode B skips this phase entirely.** Real signatures already exist in `secrets/.env.signers.{v4,v5,succinct200}` and are passed inline by `exec-jovian.sh`.

### Step 3.1: Sign v4 (clabs + council)

```bash
export LOCAL_RPC_URL=http://127.0.0.1:$RPC_PORT
cd $CELO_SUPERCHAIN_OPS
NETWORK={network} TEST_PK=0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8 just sign v4 clabs
NETWORK={network} TEST_PK=0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592 just sign v4 clabs
NETWORK={network} TEST_PK=0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996 just sign v4 council
NETWORK={network} TEST_PK=0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9 just sign v4 council
```

### Step 3.2: Sign v5 (clabs + council)

```bash
export LOCAL_RPC_URL=http://127.0.0.1:$RPC_PORT
cd $CELO_SUPERCHAIN_OPS
NETWORK={network} TEST_PK=0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8 just sign v5 clabs
NETWORK={network} TEST_PK=0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592 just sign v5 clabs
NETWORK={network} TEST_PK=0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996 just sign v5 council
NETWORK={network} TEST_PK=0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9 just sign v5 council
```

### Step 3.3: Sign succ-v2 (clabs + council)

```bash
export LOCAL_RPC_URL=http://127.0.0.1:$RPC_PORT
cd $CELO_SUPERCHAIN_OPS
NETWORK={network} TEST_PK=0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8 just sign succ-v2 clabs
NETWORK={network} TEST_PK=0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592 just sign succ-v2 clabs
NETWORK={network} TEST_PK=0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996 just sign succ-v2 council
NETWORK={network} TEST_PK=0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9 just sign succ-v2 council
```

After Phase 3 completes, all 12 mock signatures are stored in CeloSuperchainOps and ready for the exec scripts to consume in Phase 4, 5, and 6.

---

## PHASE 4 — APPLY v4 (simulate → exec) → CP1

**Mode A**: optional simulate, then exec with the signatures gathered in Phase 3.
**Mode B**: skips simulate, runs `exec-jovian.sh v4` directly with pre-collected real signatures.

### Step 4.1 (Mode A only, RECOMMENDED): Simulate v4 via SuperchainOps

> **IMPORTANT**: All SuperchainOps commands must run with `mise` activated to use the pinned forge version (v1.1.0). The system forge (e.g., v1.5.1) will hang during simulation. Prefix commands with `eval "$(mise activate bash)" &&` or ensure mise is active in the shell.
>
> **PORT NOTE**: SuperchainOps' `foundry.toml` reads `${LOCAL_RPC_URL}`. Export `LOCAL_RPC_URL=http://127.0.0.1:$RPC_PORT` before running simulate.

```bash
export LOCAL_RPC_URL=http://127.0.0.1:$RPC_PORT
cd $SUPERCHAIN_OPS/src/tasks/eth/048-opcm-upgrade-v410-celo
eval "$(mise activate bash)" && SIMULATE_WITHOUT_LEDGER=1 ./simulate.sh
```

Review the Tenderly simulation link in the output. Confirm state changes look correct. **This step is RECOMMENDED in Mode A** — you should run it whenever the simulation environment (mise + SuperchainOps + working forge v1.1.0) is available. Only skip it if the simulation environment is broken/unavailable, and document the skip in your final report. A successful simulation catches calldata/state errors before you spend gas on the real exec.

> **Note for sepolia**: Use `src/tasks/sep/` equivalent task directories.

### Step 4.2: Execute v4 Upgrade

> **Mode A pre-flight**: signatures for v4 must already be gathered (Phase 3.1). The exec script reads them from CeloSuperchainOps's signature store.

> **`{operator_sender}` is network-specific**. Mainnet: `0x95FFAC468e37DdeEF407FfEf18f0cC9E86D8f13B`. Sepolia and chaos have different values — inspect the `SENDER=` line in the network-specific `exec-*.sh` script before running. The operator-provided `{deployer_pk}` MUST derive to `{operator_sender}`.

**Mode A (mocked):**

```bash
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=http://127.0.0.1:$RPC_PORT \
VERSION=v4 \
PK={deployer_pk} \
SENDER={operator_sender} \
SIGNER_1_PK=0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8 \
SIGNER_2_PK=0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592 \
SIGNER_3_PK=0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996 \
SIGNER_4_PK=0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9 \
./exec-mocked.sh
```

**Expected output**: `Tx executed` at the end.

**Mode B (real signatures, post-impls block only):**

```bash
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=http://127.0.0.1:$RPC_PORT PK={deployer_pk} ./exec-jovian.sh v4
```

---

### CHECKPOINT 1 — Post-v4 Health Check

#### Verify Upgrade Status

Run `verify-versions.sh` or refresh x-ray dashboard (Localhost tab). Confirm contracts upgraded to v4.1.0.

#### Critical v4-Specific Validations

v4 deploys a **new CeloSuperchainConfig proxy** (not just a new impl — an entirely new proxy at a new address) and a **new AnchorStateRegistry proxy**. The `upgradeSuperchainConfig` flag in the config controls only the **SuperchainConfig** contract, NOT CeloSuperchainConfig. The chain is: `SystemConfig.superchainConfig() → CeloSuperchainConfig.superchainConfig() → SuperchainConfig`.

Verify (substitute `{system_config_proxy}`, `{dgf_proxy}`, `{parent_safe}`, `{clabs_safe}`, `{council_safe}` from [CONCRETE NETWORK REFERENCE ADDRESSES](#concrete-network-reference-addresses)):

```bash
# 1. SystemConfig must now point to a NEW CeloSuperchainConfig proxy (created by v4)
NEW_CSC=$(cast call {system_config_proxy} "superchainConfig()(address)" -r $RPC_URL)
echo "SystemConfig→CSC (new proxy): $NEW_CSC"
# This must be a DIFFERENT address from the pre-v4 CSC proxy (mainnet pre-v4: 0xa440975E5A6BB19Bc3Bee901d909BB24b0f43D33)

# 2. New CeloSuperchainConfig — version, guardian, and SuperchainConfig pointer
echo "New CSC version:" && cast call $NEW_CSC "version()(string)" -r $RPC_URL
echo "New CSC guardian:" && cast call $NEW_CSC "guardian()(address)" -r $RPC_URL
echo "New CSC→SuperchainConfig:" && cast call $NEW_CSC "superchainConfig()(address)" -r $RPC_URL
# Expected: version = "1.0.0-celo", guardian = cLabs Safe, SuperchainConfig = original SC address (mainnet: 0x95703e0982140D16f8ebA6d158FccEde42f04a4C)

# 3. PermissionedGame — must point to the NEW AnchorStateRegistry proxy (created by v4)
PERM_GAME_V4=$(cast call {dgf_proxy} "gameImpls(uint32)(address)" 1 -r $RPC_URL)
echo "PermissionedGame impl (post-v4): $PERM_GAME_V4"
echo "PG version:" && cast call $PERM_GAME_V4 "version()(string)" -r $RPC_URL
NEW_ASR=$(cast call $PERM_GAME_V4 "anchorStateRegistry()(address)" -r $RPC_URL)
echo "PG→ASR (new proxy, discovered dynamically): $NEW_ASR"
# Expected: version = "1.7.0", $NEW_ASR is a DIFFERENT address from the pre-v4 ASR (mainnet pre-v4: 0x9F18D91949731E766f294A14027bBFE8F28328CC)

# 4. NEW ASR implementation — read via EIP-1967 implementation slot on the new proxy
echo "New ASR impl:" && cast storage $NEW_ASR 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc -r $RPC_URL
# This is the impl slot of the NEW ASR proxy created by v4. It should be nonzero.

# 5. Safe nonces incremented
echo "Parent nonce:" && cast call {parent_safe} "nonce()(uint256)" -r $RPC_URL
echo "cLabs nonce:" && cast call {clabs_safe} "nonce()(uint256)" -r $RPC_URL
echo "Council nonce:" && cast call {council_safe} "nonce()(uint256)" -r $RPC_URL
# Expected: Parent=27, cLabs=25, Council=27
```

> **IMPORTANT**: Do NOT read ASR impl via `cast storage 0x9F18...` (the pre-v4 ASR). v4 creates a NEW ASR proxy at a different address. You MUST discover that address dynamically by calling `PermissionedGame.anchorStateRegistry()` FIRST, then query the new proxy's impl slot.

**Validation checklist** (all must pass):

- [ ] **New CeloSuperchainConfig proxy** deployed at a new address (different from old CSC proxy)
- [ ] SystemConfig.superchainConfig() points to the **new** CSC proxy
- [ ] New CSC version is **"1.0.0-celo"** (old was "1.0.0-beta.1")
- [ ] New CSC guardian changed to **cLabs Safe** (was a different address)
- [ ] New CSC.superchainConfig() points to the original **SuperchainConfig** address
- [ ] AnchorStateRegistry impl address changed from CP0
- [ ] PermissionedGame version is **"1.7.0"** (was "1.4.1")
- [ ] PermissionedGame→ASR points to the **new** ASR address
- [ ] Safe nonces: Parent=27, cLabs=25, Council=27
- [ ] X-ray health alerts clean (no admin/owner/cross-ref violations)

If any check fails, **STOP** and investigate before proceeding to v5.

#### X-Ray Check (MANDATORY — Ask Every Checkpoint)

> **DO NOT SKIP.** You MUST explicitly offer the x-ray dashboard to the user at every checkpoint. This is enforced by the Checkpoint Review Protocol at the top of this skill.

Ask the user if they want to open/refresh the x-ray dashboard before continuing:

> "Would you like to open/refresh the x-ray dashboard (http://localhost:8080, Localhost tab) to visually verify the post-v4 state (CP1) before proceeding to v5? The x-ray will show new CSC proxy, new ASR, and PermissionedGame 1.7.0 \u2014 any cross-ref or owner-consistency alerts would show up here."

Wait for the user's response before proceeding. If they say yes, start x-ray (if needed) and wait for them to inspect before moving on. If they say no, proceed to v5.

#### Pause and Confirm

Present the checkpoint summary to the user with all validation results. **Ask the user to review and confirm before proceeding.**

> "Checkpoint 1 complete — v4.1.0 upgrade applied. CeloSuperchainConfig upgraded to 1.0.0-celo, new ASR deployed, PermissionedGame at 1.7.0. Continue to v5?"

---

## PHASE 5 — APPLY v5 (simulate → exec) → CP2

**Mode A**: optional simulate, then exec with the signatures gathered in Phase 3.
**Mode B**: skips simulate, runs `exec-jovian.sh v5` directly with pre-collected real signatures.

### Step 5.1 (Mode A only, RECOMMENDED): Simulate v5 via SuperchainOps

> **IMPORTANT**: v5 simulation requires v4 to be **already executed** on the fork (Phase 4 just did this). v5's OPCM calls `SystemConfig.l2ChainId()` which only exists in the v4+ implementation. If you try to simulate v5 before exec v4, it will revert.

```bash
export LOCAL_RPC_URL=http://127.0.0.1:$RPC_PORT
cd $SUPERCHAIN_OPS/src/tasks/eth/049-opcm-upgrade-v500-celo
eval "$(mise activate bash)" && SIMULATE_WITHOUT_LEDGER=1 ./simulate.sh
```

Review the Tenderly simulation link. **Recommended** in Mode A — run whenever the simulation environment is available. Only skip if the simulation environment is broken; document the skip in the final report.

### Step 5.2: Execute v5 Upgrade

> **Mode A pre-flight**: signatures for v5 must already be gathered (Phase 3.2). The exec script reads them from CeloSuperchainOps's signature store.

**Mode A (mocked):**

```bash
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=http://127.0.0.1:$RPC_PORT \
VERSION=v5 \
PK={deployer_pk} \
SENDER={operator_sender} \
SIGNER_1_PK=0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8 \
SIGNER_2_PK=0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592 \
SIGNER_3_PK=0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996 \
SIGNER_4_PK=0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9 \
./exec-mocked.sh
```

**Expected output**: `Tx executed` at the end.

**Mode B:**

```bash
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=http://127.0.0.1:$RPC_PORT PK={deployer_pk} ./exec-jovian.sh v5
```

---

### CHECKPOINT 2 — Post-v5 Health Check

#### Verify Upgrade Status

Run `verify-versions.sh` or refresh x-ray dashboard. Confirm contracts upgraded to v5.0.0.

#### Critical v5-Specific Validations

v5 must deploy a **new PermissionedGame** impl that points to the **same new ASR** deployed by v4. Verify:

```bash
# 1. PermissionedGame — must be NEW impl at version 1.8.0 pointing to same new ASR from v4
PERM_GAME_V5=$(cast call {dgf_proxy} "gameImpls(uint32)(address)" 1 -r $RPC_URL)
echo "PermissionedGame impl (post-v5): $PERM_GAME_V5"
echo "PG version:" && cast call $PERM_GAME_V5 "version()(string)" -r $RPC_URL
ASR_AFTER_V5=$(cast call $PERM_GAME_V5 "anchorStateRegistry()(address)" -r $RPC_URL)
echo "PG→ASR (after v5): $ASR_AFTER_V5"
# Expected: version = "1.8.0", impl address DIFFERENT from CP1's PERM_GAME_V4, ASR = same new ASR discovered in CP1

# 2. Confirm PermissionedGame impl changed from v4 (new deployment)
# Compare $PERM_GAME_V5 with CP1's $PERM_GAME_V4 — must be DIFFERENT address

# 3. Confirm ASR address is the SAME new ASR from v4 (not reverted)
# $ASR_AFTER_V5 must equal $NEW_ASR from CP1 — the new ASR proxy is reused by v5
# Query its impl slot to confirm it's still populated
echo "New ASR impl (post-v5):" && cast storage $ASR_AFTER_V5 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc -r $RPC_URL
# Must match the new ASR impl from CP1 (unchanged by v5)

# 4. SystemConfig owner — still ProxyAdminOwner (not yet transferred)
echo "SystemConfig owner:" && cast call {system_config_proxy} "owner()(address)" -r $RPC_URL
# Expected: ProxyAdminOwner (Parent Safe) — transfer happens in succ-v2

# 5. Safe nonces incremented
echo "Parent nonce:" && cast call {parent_safe} "nonce()(uint256)" -r $RPC_URL
echo "cLabs nonce:" && cast call {clabs_safe} "nonce()(uint256)" -r $RPC_URL
echo "Council nonce:" && cast call {council_safe} "nonce()(uint256)" -r $RPC_URL
# Expected: Parent=28, cLabs=26, Council=28
```

> **IMPORTANT**: Same rule as CP1 — the ASR proxy address is NOT the pre-v4 hardcoded `0x9F18...`. It's the NEW proxy discovered by calling `PermissionedGame.anchorStateRegistry()`. The new ASR proxy persists from v4 through v5 and into succ-v2.

**Validation checklist** (all must pass):

- [ ] Core contracts at v5.0.0 (magenta in x-ray)
- [ ] PermissionedGame version is **"1.8.0"** (was "1.7.0")
- [ ] PermissionedGame impl address changed from CP1 (new deployment)
- [ ] PermissionedGame→ASR points to the **same new ASR** from v4
- [ ] ASR impl address unchanged from CP1
- [ ] SystemConfig owner is still **ProxyAdminOwner** (not yet transferred)
- [ ] Safe nonces: Parent=28, cLabs=26, Council=28
- [ ] X-ray: new MIPS singleton auto-discovered, no critical alerts

If any check fails, **STOP** and investigate before proceeding to succ-v2.

#### X-Ray Check (MANDATORY — Ask Every Checkpoint)

> **DO NOT SKIP.** You MUST explicitly offer the x-ray dashboard to the user at every checkpoint. This is enforced by the Checkpoint Review Protocol at the top of this skill.

Ask the user if they want to open/refresh the x-ray dashboard before continuing:

> "Would you like to open/refresh the x-ray dashboard (http://localhost:8080, Localhost tab) to visually verify the post-v5 state (CP2) before proceeding to succ-v2? The x-ray will show PermissionedGame 1.8.0 and the new MIPS v8 singleton auto-discovered."

Wait for the user's response before proceeding. If they say yes, wait for them to inspect before moving on. If they say no, proceed to succ-v2.

#### Pause and Confirm

Present the checkpoint summary. **Ask the user to review and confirm before proceeding.**

> "Checkpoint 2 complete — v5.0.0 upgrade applied. PermissionedGame at 1.8.0 (Jovian), new MIPS singleton deployed. SystemConfig still owned by ProxyAdminOwner. Continue to Phase 6 (apply succ-v2 upgrade)?"

---

## PHASE 6 — APPLY succ-v2 (exec only) → CP3

**Mode A**: just exec with the signatures gathered in Phase 3.3. There is no SuperchainOps simulation for succ-v2 (it's a direct MultiSend not an OPCM upgrade), and the Succinct impl was already planted in Phase 2.3.
**Mode B**: skips everything else, runs `exec-jovian.sh succ-v2` directly with pre-collected real signatures.

### Step 6.1: Execute succ-v2 Upgrade

> **Mode A pre-flight**: signatures for succ-v2 must already be gathered (Phase 3.3). The Succinct impl bytecode must already be planted at `0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1` (Phase 2.3).
> **Mode B pre-flight**: nothing — `0xE7bd695d...` already exists on-chain at block `24742240`.

**Mode A (mocked):**

```bash
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=http://127.0.0.1:$RPC_PORT \
VERSION=succ-v2 \
PK={deployer_pk} \
SENDER={operator_sender} \
SIGNER_1_PK=0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8 \
SIGNER_2_PK=0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592 \
SIGNER_3_PK=0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996 \
SIGNER_4_PK=0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9 \
./exec-mocked.sh
```

**Expected output**: `Tx executed` at the end.

**Mode B:**

```bash
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=http://127.0.0.1:$RPC_PORT PK={deployer_pk} ./exec-jovian.sh succ-v2
```

---

### CHECKPOINT 3 — Post-Succinct v2 Health Check

#### Verify Upgrade Status

Run `verify-versions.sh` or refresh x-ray dashboard.

#### Critical succ-v2-Specific Validations

succ-v2 must: (1) register a **new OPSuccinctGame** impl in DisputeGameFactory pointing to the **new ASR (NOT the old `0x9F18...` ASR)**, and (2) **transfer SystemConfig ownership** to cLabs Safe. Verify:

```bash
# Capture the live new ASR (created by v4/v5) for comparison
NEW_ASR=$(cast call $(cast call {dgf_proxy} "gameImpls(uint32)(address)" 1 -r $RPC_URL) "anchorStateRegistry()(address)" -r $RPC_URL)
echo "New ASR (from PermissionedGame post-v4): $NEW_ASR"
# Expected (mainnet): 0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d
# This MUST differ from the pre-v4 ASR 0x9F18D91949731E766f294A14027bBFE8F28328CC

# 1. OPSuccinctGame — must be NEW impl, pointing to NEW ASR from v4
SUCC_GAME_V2=$(cast call {dgf_proxy} "gameImpls(uint32)(address)" 42 -r $RPC_URL)
echo "OPSuccinctGame impl (post-succ-v2): $SUCC_GAME_V2"
SG_ASR=$(cast call $SUCC_GAME_V2 "anchorStateRegistry()(address)" -r $RPC_URL)
echo "SG→ASR: $SG_ASR"
# REQUIRED: $SG_ASR == $NEW_ASR (the new v4 ASR proxy, NOT the old 0x9F18...)
# If $SG_ASR == 0x9F18D91949731E766f294A14027bBFE8F28328CC → CP3 FAIL
# This means the Succinct game impl was built against the old ASR. Most likely
# cause: Phase 2.3 used a local forge deploy that baked in the OLD ASR from
# Succinct/.env.{network} (which hardcodes pre-v4 ASR 0x9F18D919...). The
# current canonical Phase 2.3 uses anvil_setCode with REAL MAINNET bytecode
# instead, which already has the correct post-v4 ASR baked in.
# If you see this failure, your Phase 2.3 is using the deprecated forge-deploy
# path. Switch to the anvil_setCode path documented in Step 2.3.1.

# 2. SystemConfig owner — MUST now be cLabs Safe (transferred)
SC_OWNER=$(cast call {system_config_proxy} "owner()(address)" -r $RPC_URL)
echo "SystemConfig owner (post-succ-v2): $SC_OWNER"
# Expected: cLabs Safe address (mainnet: 0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d)
# This is a CRITICAL change — ownership moves from ProxyAdminOwner to cLabs

# 3. Safe nonces incremented
echo "Parent nonce:" && cast call {parent_safe} "nonce()(uint256)" -r $RPC_URL
echo "cLabs nonce:" && cast call {clabs_safe} "nonce()(uint256)" -r $RPC_URL
echo "Council nonce:" && cast call {council_safe} "nonce()(uint256)" -r $RPC_URL
# Expected: Parent=29, cLabs=27, Council=29

# 4. All other contracts unchanged from CP2
echo "PermissionedGame still 1.8.0:" && cast call $(cast call {dgf_proxy} "gameImpls(uint32)(address)" 1 -r $RPC_URL) "version()(string)" -r $RPC_URL
```

**Validation checklist** (all must pass — no ambiguity):

- [ ] OPSuccinctGame (type 42) impl address changed from CP2 (new bytecode)
- [ ] OPSuccinctGame version is `2.0.0` (not `1.0.0`)
- [ ] **OPSuccinctGame→ASR == new v4 ASR proxy (NOT the old `0x9F18...`)** — this is the canonical CP3 invariant. If FAIL, see Phase 5 ordering rules in [BINDING EXECUTION CONTRACT](#binding-execution-contract-non-negotiable).
- [ ] SystemConfig owner is now **cLabs Safe** (not ProxyAdminOwner)
- [ ] PermissionedGame unchanged at "1.8.0" from CP2
- [ ] Safe nonces: Parent=29, cLabs=27, Council=29
- [ ] X-ray: owner consistency alert for SystemConfig is **expected** (different owner)

If `OPSuccinctGame→ASR` returns the old ASR, the run is **FAILED** even though the txs executed. The root cause is that Phase 2.3 used the deprecated local forge-deploy path instead of the canonical `anvil_setCode` approach. Fix: re-fork from scratch and use `cast code 0xE7bd695d... -r $UPSTREAM_RPC_URL` + `anvil_setCode` per Step 2.3.1 — real mainnet bytecode has the correct post-v4 ASR baked in.

#### X-Ray Check (MANDATORY — Ask Every Checkpoint)

> **DO NOT SKIP.** You MUST explicitly offer the x-ray dashboard to the user at every checkpoint. This is enforced by the Checkpoint Review Protocol at the top of this skill.

Ask the user if they want to open/refresh the x-ray dashboard before continuing:

> "Would you like to open/refresh the x-ray dashboard (http://localhost:8080, Localhost tab) to visually verify the final post-succ-v2 state (CP3)? The x-ray will show the new OPSuccinctGame (type 42), and the SystemConfig owner now as cLabs Safe \u2014 the owner-consistency alert is expected here."

Wait for the user's response before proceeding. If they say yes, wait for them to inspect before moving on to Phase 7 (final comparison). If they say no, proceed to Phase 7.

#### Pause and Confirm

Present the final checkpoint summary. **Ask the user to review and confirm.**

> "Checkpoint 3 complete — Succinct v2 applied. New OPSuccinctGame registered (type 42), pointing to new ASR. **SystemConfig ownership transferred to cLabs Safe** (enables optional Phase 8 base fee update — Mode B only). Jovian core upgrade pipeline complete. Proceed to final comparison?"

---

## PHASE 7 — FINAL COMPARISON

Present the upgrade progression across all checkpoints:

```
Contract                    | CP0 (Pre)      | CP1 (Post-v4)  | CP2 (Post-v5)  | CP3 (Post-succ)
----------------------------|----------------|----------------|----------------|----------------
SystemConfig                | initial        | v4.1.0         | v5.0.0         | v5.0.0
OptimismPortal              | initial        | v4.1.0         | v5.0.0         | v5.0.0
L1StandardBridge            | initial        | v4.1.0         | v5.0.0         | v5.0.0
L1CrossDomainMessenger      | initial        | v4.1.0         | v5.0.0         | v5.0.0
L1ERC721Bridge              | initial        | v4.1.0         | v5.0.0         | v5.0.0
OptimismMintableERC20Factory| initial        | v4.1.0         | v5.0.0         | v5.0.0
DisputeGameFactory          | initial        | v4.1.0         | v5.0.0         | v5.0.0
AnchorStateRegistry         | initial        | v4.1.0         | v4.1.0*        | v4.1.0*
DelayedWETH                 | initial        | v4.1.0         | v4.1.0*        | v4.1.0*
ProtocolVersions            | initial        | initial*       | v5.0.0         | v5.0.0
SuperchainConfig            | initial        | v4.1.0**       | v5.0.0**       | v5.0.0**
PermissionedGame (type 1)   | 1.4.1          | 1.7.0          | 1.8.0          | 1.8.0
OPSuccinctGame (type 42)    | 1.0.0/none     | 1.0.0/none     | 1.0.0/none     | 2.0.0
MIPS (singleton)            | initial        | v4 MIPS        | v5 MIPS        | v5 MIPS

* = same impl as previous version (v5 reuses v4 impl for these contracts)
** = mainnet does not upgrade SuperchainConfig (upgradeSuperchainConfig=false)
```

Confirm: "Jovian upgrade complete. All contracts at expected versions."

After Phase 7, **ask the user** (interactive mode) or check the autonomous-mode `include_basefee` parameter to determine whether to run the optional Phase 8 (base fee update):

> "Jovian core pipeline (v4 + v5 + succ-v2) is complete. Would you like to run the optional **Phase 8 — base fee update** (`exec-basefee.sh`)? It's recommended (Mode B only) because the Jovian upgrade transfers `SystemConfig` ownership to the cLabs Safe specifically to enable this post-pipeline cLabs-direct transaction that sets `minBaseFee` and `daFootprintGasScalar` on `SystemConfig`. **Note: only valid in Mode B** — Mode A's mocked cLabs Safe is incompatible."

---

## PHASE 8 — POST-PIPELINE BASE FEE UPDATE (MODE B ONLY, OPTIONAL, RECOMMENDED)

**Optional but recommended.** Runs only in **Mode B (real signatures, block `24742240` or later)** after Phases 3 + 4 + 6 (v4 + v5 + succ-v2) complete and CP3 validation passes.

> ⚠️ **MODE B ONLY — NOT COMPATIBLE WITH MODE A**. `exec-basefee.sh` requires the real 6-of-8 cLabs Safe owners and pre-signed real signatures in `secrets/.env.signers.basefee`. Mode A's `mock-mainnet.sh` replaces the cLabs Safe with a 2-of-2 mocked EOA structure, so the real signatures in `secrets/.env.signers.basefee` will fail verification. **If you ran Mode A, do not attempt Phase 8** — it will fail at the cLabs Safe `execTransaction` call. Report in your final output that Phase 8 was skipped due to Mode A incompatibility.

### Why This Phase Exists

The `succ-v2` upgrade (Phase 6.1) transfers `SystemConfig` ownership from `ProxyAdminOwner` (Parent Safe) to the **cLabs Safe**. This ownership transfer exists specifically to enable direct cLabs Safe execution of post-upgrade config changes — skipping the full Parent/Council nested chain. `exec-basefee.sh` is the first intended consumer of that capability, updating two `SystemConfig` parameters:

1. **`minBaseFee`** — minimum L2 base fee (mainnet default: `25_000_000_000` wei = 25 gwei)
2. **`daFootprintGasScalar`** — data availability footprint gas scalar (mainnet default: `1`)

Both are set via a single `MultiSend` delegatecall from the cLabs Safe, batching `setMinBaseFee(uint256)` and `setDAFootprintGasScalar(uint256)` on `SystemConfig`.

### Prerequisites

- [ ] **Running in Mode B** (`exec-jovian.sh` was used for v4/v5/succ-v2 with real signatures, NOT `exec-mocked.sh`)
- [ ] **CP3 passed** — SystemConfig owner is cLabs Safe (verified at Phase 6.1 / CP3)
- [ ] **CP3 nonces confirmed** — Parent=29, cLabs=27, Council=29 (so cLabs nonce 27 is the expected pre-basefee value)
- [ ] **cLabs Safe still has real 6-of-8 structure** — verify with `cast call $CLABS "getThreshold()(uint256)" && cast call $CLABS "getOwners()(address[])"`. Threshold MUST be 6. Owner count MUST be 8. If either is wrong, you're in Mode A state and Phase 8 will fail.
- [ ] **Decrypted signer file exists** — `$CELO_ROOT/secrets/.env.signers.basefee` (decrypt via `./scripts/key_placer.sh decrypt` from Celo monorepo root)
- [ ] **Submitter PK has gas** — same `PK` you used for Phase 5 works fine

### Step 8.1: Execute Base Fee Update

```bash
cd $CELO_ROOT/packages/op-tooling/exec
PK={deployer_pk} RPC_URL=http://localhost:$RPC_PORT ./exec-basefee.sh
```

**What happens internally**:

- `exec-basefee.sh` loads 6 cLabs signer sigs from `secrets/.env.signers.basefee` (6-of-8)
- Builds MultiSend calldata with two inner calls: `SystemConfig.setMinBaseFee(25000000000)` + `SystemConfig.setDAFootprintGasScalar(1)`
- Calls `execTransaction` directly on the cLabs Safe (`0x9Eb44Da2...`) with `operation=1` (delegatecall) to MultiSend (`0x9641d764fc13c8B624c04430C7356C1C7C8102e2`)
- **Single transaction** — no Parent/Council chain (that's the whole point)

**Expected output**: `status 1 (success)` with a single `cast send` transaction. Much simpler than v4/v5/succ-v2.

### Step 8.2: Validate via CP4

---

### CHECKPOINT 4 — Post-Base-Fee Health Check

#### Verify Direct Updates

```bash
SC=0x89E31965D844a309231B1f17759Ccaf1b7c09861
printf 'minBaseFee:             '; cast call $SC "minBaseFee()(uint256)" -r $RPC_URL
printf 'daFootprintGasScalar:   '; cast call $SC "daFootprintGasScalar()(uint256)" -r $RPC_URL
printf 'SC version (unchanged): '; cast call $SC "version()(string)" -r $RPC_URL
printf 'SC owner (cLabs):       '; cast call $SC "owner()(address)" -r $RPC_URL

# cLabs nonce must have incremented (27 → 28); Parent and Council untouched
printf 'cLabs nonce:            '; cast call 0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d "nonce()(uint256)" -r $RPC_URL
printf 'Parent nonce (=29):     '; cast call 0x4092A77bAF58fef0309452cEaCb09221e556E112 "nonce()(uint256)" -r $RPC_URL
printf 'Council nonce (=29):    '; cast call 0xC03172263409584f7860C25B6eB4985f0f6F4636 "nonce()(uint256)" -r $RPC_URL
```

**Validation checklist** (all must pass):

- [ ] `minBaseFee() == 25000000000` (25 gwei)
- [ ] `daFootprintGasScalar() == 1`
- [ ] `SystemConfig.version()` unchanged from CP3 (Phase 8 does not upgrade the impl, only calls setters)
- [ ] `SystemConfig.owner()` still cLabs Safe (unchanged)
- [ ] **cLabs nonce incremented**: 27 → **28**
- [ ] **Parent nonce unchanged**: still **29**
- [ ] **Council nonce unchanged**: still **29**
- [ ] Only the cLabs Safe was touched — no Parent or Council ExecutionSuccess events in the tx receipt

If Parent or Council nonces changed, something went wrong — the whole point of Phase 8 is that it goes straight to cLabs.

#### X-Ray Check (MANDATORY — Ask Every Checkpoint)

> **DO NOT SKIP.** You MUST explicitly offer the x-ray dashboard to the user at every checkpoint. This is enforced by the Checkpoint Review Protocol at the top of this skill.

Ask the user if they want to open/refresh the x-ray dashboard before continuing:

> "Would you like to open/refresh the x-ray dashboard (http://localhost:8080, Localhost tab) to visually verify the post-basefee state (CP4)? The x-ray will show SystemConfig's new `minBaseFee` and `daFootprintGasScalar` values. The owner-consistency alert for SystemConfig remains expected (cLabs ≠ ProxyAdminOwner)."

Wait for the user's response before proceeding. If they say yes, wait for them to inspect before wrapping up the session.

#### Pause and Confirm

> "Checkpoint 4 complete — base fee update applied. `minBaseFee` set to 25 gwei, `daFootprintGasScalar` set to 1 via single direct cLabs Safe transaction. Full Jovian + post-pipeline config is now in effect. Proceed to session cleanup?"

### Common Issues in Phase 8 (basefee)

**"Need to decode .env.signers.basefee.enc first"** — You haven't decrypted the signer file. From Celo monorepo root: `./scripts/key_placer.sh decrypt` (requires `celo-testnet-production` GCP access).

**"revert" on cLabs Safe `execTransaction`** — Most likely cause: CP3 ownership transfer didn't actually happen (SystemConfig still owned by ProxyAdminOwner). Verify with `cast call $SC "owner()(address)"` before running Phase 8. If it's still Parent Safe, something failed in Phase 6.2 (exec succ-v2).

**cLabs nonce mismatch** — The `exec-basefee.sh` script expects cLabs nonce to be **27** (derived from CP3 = post-succ-v2 state: 24→25→26→27). If you ran Phase 8 twice or did something else on cLabs Safe between Phase 6.2 and Phase 8, the pre-collected signatures will fail. Re-fork from CP3 and try again.

**`setMinBaseFee` or `setDAFootprintGasScalar` function missing on SystemConfig** — These setters exist only in v5 SystemConfig impl. If Phase 4.3 (v5 execution) was skipped or failed, Phase 8 will revert. Verify CP2 shows SC version bumped to v5.0.0 series before running Phase 8.

---

## Alternate Flows

### Partial Upgrade (Single Version)

If user only wants to run one upgrade (e.g., just v5):

1. Skip to the relevant phase
2. Adjust checkpoint expectations (baseline will be different if prior upgrades already executed)
3. Only sign and execute the requested version

### Resume from Checkpoint

If user's Anvil fork already has some upgrades applied:

1. Run x-ray health check to determine current state
2. Identify which checkpoint the fork is at
3. Skip completed phases and resume from the next one

### Sepolia-Specific Notes

- Use `src/tasks/sep/` in SuperchainOps (not `eth/`)
- Use `NETWORK=sepolia` for CeloSuperchainOps signing
- Safe addresses differ (see AGENT.md network reference)
- `mock-sepolia.sh` transfers ownership from EOA to Safe (different from mainnet which mocks Safe owners)
- Version label in exec-jovian-sepolia.sh for Succinct is `succinct-v2` (not `succ-v2`)

### Chaos-Specific Notes

- Uses same mock script as sepolia: `NETWORK=chaos ./mock-sepolia.sh`
- Has its own set of proxy addresses (see `verify-versions.sh` chaos case)
- No SuperchainOps tasks for chaos (simulate manually or skip simulation)

---

## Common Issues

### "Error: MOCKED_SIGNER_1 must be < MOCKED_SIGNER_2"

Signer addresses must be in ascending hex order. The default mocked signers are pre-sorted correctly. If using custom addresses, sort them.

### "Invalid PK" during exec-mocked.sh

The PK must correspond to the SENDER address. This pair is **network-specific** — on mainnet, the SENDER is `0x95FFAC468e37DdeEF407FfEf18f0cC9E86D8f13B` (baked into `exec-*.sh`); sepolia and chaos have different values. Inspect the relevant `exec-*.sh` script's `SENDER=` line for the expected value on your target network.

### Bootstrap fails with "connection refused"

Anvil must be running on port 8545. Verify with `cast block-number --rpc-url http://localhost:8545`.

### "revert" during exec-mocked.sh

- Check Safe nonces match expected values: `cast call {safe_address} "nonce()(uint256)" -r http://localhost:8545`
- Verify mock-mainnet.sh was run after fork_l1.sh
- Ensure signer addresses in mock-mainnet.sh match the PKs in exec-mocked.sh

### Phase 2.3 anvil_setCode fails or plants empty bytecode

**Symptom**: `cast code $SUCCINCT_IMPL_ADDR -r $UPSTREAM_RPC_URL` returns `0x` or empty, or `anvil_setCode` plant is successful but `cast codesize` returns 0.

- **Upstream RPC must be archive-capable.** Public RPCs (llamarpc, publicnode, cloudflare) may return empty for `cast code` against historical addresses — use Tenderly, archive Alchemy/Infura, or a private archive node.
- **The proposal address must have real mainnet bytecode deployed upstream.** Verify with `cast code 0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1 -r $UPSTREAM_RPC_URL | head -c 100` against real mainnet — should return non-empty bytecode.
- **The planted ASR must match mainnet's post-v4 ASR** (`0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d`). If it doesn't, the upstream bytecode is stale or you're on a different network.
- **Do NOT use the deprecated `forge script UpgradeOPSuccinctFDG.s.sol` path** — it reads `ANCHOR_STATE_REGISTRY` from `Succinct/.env.mainnet` which hardcodes the pre-v4 ASR and produces an impl with the wrong immutable. Use `anvil_setCode` with real mainnet bytecode per Step 2.3.1.

### X-ray shows "UNKNOWN" for implementation

The x-ray impl_lookup tables in `config.js` may not have the newly deployed addresses yet. This is expected for fresh deployments on localhost. The version string from `version()` call is still accurate.

### Signing fails in CeloSuperchainOps

- Ensure `LOCAL_RPC_URL` env var is set to your local fork (e.g. `export LOCAL_RPC_URL=http://127.0.0.1:8549`). SuperchainOps' `foundry.toml` reads `${LOCAL_RPC_URL}` for all `rpc_endpoints`.
- For non-default ports, also set the SuperchainOps justfile's `RPC_URL` via `.env` or env var.
- Verify the `eip712sign` binary is installed: `just install-eip712sign`
- Check upgrade JSON files exist for the selected network

### CP3 FAIL: OPSuccinctGame.anchorStateRegistry() returns the OLD ASR (`0x9F18...`)

**Symptom**: `cast call $SUCC_GAME_V2 "anchorStateRegistry()(address)"` returns `0x9F18D91949731E766f294A14027bBFE8F28328CC` instead of the new v4 ASR `0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d`.

**Root cause**: The Succinct game implementation bakes `ANCHOR_STATE_REGISTRY_ADDRESS` as a Solidity **immutable** at construction time. The planted or deployed Succinct impl has the wrong ASR address baked into its bytecode.

**The current canonical Phase 2.3 avoids this** by fetching REAL MAINNET BYTECODE via `cast code 0xE7bd695d... -r $UPSTREAM_RPC_URL` and planting it via `anvil_setCode`. The real mainnet bytecode already has the correct post-v4 ASR baked in because it was deployed AFTER v4+v5 were applied on mainnet.

**Fix if you hit this**: Your Phase 2.3 is using the DEPRECATED local forge-deploy path that reads `ANCHOR_STATE_REGISTRY` from `Succinct/.env.mainnet` (which hardcodes the OLD pre-v4 ASR). Switch to the canonical `anvil_setCode` approach:

```bash
# Canonical Phase 2.3 (correct):
SUCCINCT_IMPL_ADDR=0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1
MAINNET_CODE=$(cast code $SUCCINCT_IMPL_ADDR -r $UPSTREAM_RPC_URL)
cast rpc anvil_setCode $SUCCINCT_IMPL_ADDR "$MAINNET_CODE" -r $RPC_URL

# Verify the baked-in ASR is correct
cast call $SUCCINCT_IMPL_ADDR "anchorStateRegistry()(address)" -r $RPC_URL
# MUST return 0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d (the post-v4 mainnet ASR)
```

Re-fork from scratch after switching to the canonical `anvil_setCode` path. The canonical Mode A order is:

```
Phase 1.1 fork → Phase 1.2 mock
→ Phase 2.1 bootstrap v4 → Phase 2.2 bootstrap v5 → Phase 2.3 plant Succinct (anvil_setCode)
→ CP0 (post-deploy baseline)
→ Phase 3.1/3.2/3.3 gather all signatures
→ Phase 4 (sim v4 → exec v4) → CP1
→ Phase 5 (sim v5 → exec v5) → CP2
→ Phase 6 (exec succ-v2) → CP3
```

### "environment variable LOCAL_RPC_URL not found" from forge

You're running a SuperchainOps `forge script` or `cast` command without exporting `LOCAL_RPC_URL`. SuperchainOps' updated `foundry.toml` requires it. Fix:

```bash
export LOCAL_RPC_URL="http://127.0.0.1:$RPC_PORT"
```

Set this once per shell session, before any `just sign`, `just simulate`, or direct `cast --rpc-url mainnet` invocation against SuperchainOps.

---

## Additional Resources

- **X-Ray Dashboard**: `packages/op-tooling/x-ray/` — Run locally or visit https://x-ray-celo.vercel.app/
- **Op-deployer docs**: `packages/op-tooling/op-deployer/v5/README.md`
- **Fork/Mock docs**: `packages/op-tooling/fork/README.md`
- **Exec docs** (includes `exec-jovian.sh`, `exec-basefee.sh` reference): `packages/op-tooling/exec/README.md`
- **Verify docs**: `packages/op-tooling/verify/README.md`
- **SuperchainOps README**: Check `$SUPERCHAIN_OPS/README.md` for simulation guide
- **CeloSuperchainOps README**: Check `$CELO_SUPERCHAIN_OPS/README.md` for signing guide (includes `sign-basefee.sh` for Phase 8 signature generation)
- **Succinct deploy guide**: Check `$SUCCINCT_ROOT/book/fault_proofs/deploy.md`
