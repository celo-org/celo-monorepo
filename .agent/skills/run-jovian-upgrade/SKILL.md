---
name: run-jovian-upgrade
description: >
  Execute the Jovian upgrade pipeline (v4.1.0 + v5.0.0 + Succinct v2 + optional basefee)
  on a local Anvil fork, as an orchestrator that dispatches one subagent per TODO.
  Use when: upgrading Celo OP Stack, testing Jovian, running v4/v5/succ-v2 upgrades,
  local fork testing, op-deployer bootstrap, SuperchainOps simulation, contract state
  comparison, or when the user mentions Jovian, v4.1.0, v5.0.0, Succinct, OPSuccinct,
  upgrade pipeline.
---

# Jovian Upgrade Pipeline — Orchestrator Protocol

## §1 ORCHESTRATOR RULE (read first, read every run)

You are the **orchestrator**. You do NOT run `anvil`, `cast`, `forge`, `bootstrap.sh`,
`exec-*.sh`, `just sign`, or any heavy bash yourself. Your only direct actions are:

- `TodoWrite` — create and update the fixed checklist.
- `Task(subagent_type="oh-my-claudecode:executor", model="sonnet", ...)` — dispatch ONE
  subagent per TODO, passing the full §CONTEXT_BLOCK and the CARD text for that TODO.
- `mcp_question` — only at checkpoint gates (interactive mode) and final cleanup gate.
- A short final report summarising what happened.

Everything else is delegated. This keeps your context clean and prevents drift.

### §1.1 Hard rules (non-negotiable)

1. **Localhost only.** Every subagent runs against `http://127.0.0.1:$RPC_PORT`.
   If the user requests real mainnet/sepolia execution → REFUSE, print the commands,
   explain why.
2. **The TODO list is fixed.** You MUST create the full list in §THE PROTOCOL at the
   start of every run, verbatim, in order, no merges, no renames, no omissions.
3. **No skipping.** A "skippable" step still appears as a TODO; the subagent either
   executes it or returns `STATUS: SKIP` with a reason. Silently dropping a TODO is a
   binding violation.
4. **Subagent per TODO.** You never batch multiple TODOs into one subagent. You never
   run two TODOs in parallel (the pipeline is sequential by construction).
5a. **Evidence-gated completion (subagent TODOs).** You only mark a TODO executed by a
   subagent `completed` when the subagent's report contains the `REQUIRED EVIDENCE`
   block named by that TODO's card. If not, re-dispatch with a corrective prompt.
5b. **Orchestrator-executed TODOs.** The orchestrator-only TODOs — T14/T23/T29/T34
   checkpoint gates (CP0..CP3), T40 CP4 gate, T42 cleanup gate — have NO subagent.
   Their evidence is whatever the orchestrator itself emits: the `mcp_question`
   response value (interactive) or a one-line autonomous decision string. Rule 5a
   does not apply to these — you mark them completed the moment you record the
   decision. Note: T00 is NOT in this list — T00 does dispatch a minimal `haiku`
   subagent to register the cleanup plan, then stays `pending` throughout the
   pipeline per rule 6 below (it's completed at the end of T41, not T00's own
   subagent return).
6. **Cleanup TODO exists BEFORE anvil starts.** TODO `T00` is created in the first
   `TodoWrite` call as status `pending` and stays `pending` (NOT `in_progress`,
   NOT `completed`) throughout the entire pipeline. It is the visible sentinel that
   cleanup is owed. Mark it `completed` only at the end of T41 (after cleanup
   succeeded). Multiple simultaneous `pending` items is allowed; TodoWrite only
   requires at most one `in_progress` at a time.
7. **No double-running.** If a script fails mid-pipeline, the only recovery is
   cleanup + re-fork from scratch. Never re-run a partial `bootstrap.sh` or
   `exec-*.sh`.
8. **Checkpoints are four TODOs, not one.** Every checkpoint (CP0..CP4) is represented
   by four TODOs: `.1` queries, `.2` PASS/FAIL table, `.3` x-ray offer, `.4` gate.
   You may not fold them together.

### §1.2 Recovery protocol on FAIL

When a subagent returns `STATUS: FAIL`, the orchestrator's response depends on which
TODO failed:

| Failed TODO range | Recovery                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| T01..T07          | Fix the root cause (wrong path, missing tool, busy port), re-dispatch the same TODO. No re-fork needed.  |
| T08..T10          | Bootstrap/plant partial state. Jump to T41 cleanup, re-fork from scratch at T04.                         |
| T11..T14 (CP0)    | If validation fails (not a query error), the fork is bad. Jump to T41 cleanup, re-fork from scratch.     |
| T15..T17 (sign)   | Fix signing env (LOCAL_RPC_URL, mise, TEST_PK), re-dispatch. No re-fork needed.                          |
| T18 / T24 (sim)   | Only FAIL on actual simulate failure. On SKIP (pre-flight), record reason, continue.                     |
| T19 / T25 / T30   | Exec failure (`revert`). Jump to T41 cleanup, re-fork from scratch. Do NOT retry in place.               |
| T20..T23 (CP1)    | Post-v4 invariant broken. Jump to T41 cleanup, re-fork from scratch.                                     |
| T26..T29 (CP2)    | Post-v5 invariant broken. Jump to T41 cleanup, re-fork from scratch.                                     |
| T31..T34 (CP3)    | Post-succ-v2 invariant broken (esp. `SG_ASR == OLD_ASR`). Jump to T41 cleanup, re-fork from scratch.     |
| T35 (Phase 7)     | Comparison table failure — pipeline already done, report and proceed to T36.                             |
| T36..T40 (CP4)    | Basefee failure — cleanup, investigate, re-fork if the operator wants to retry.                          |
| T41 (cleanup)     | Manual cleanup required. Log a warning in final summary so the operator knows.                          |

"Re-fork from scratch" means: reset the TodoWrite list, re-create T00..T42 from the
fixed template, and start over at T01. Do NOT patch the TodoWrite list in place.

### §1.3 CORE INVARIANTS (memory anchor — read after §1.1)



A one-glance summary of things that MUST be true of every run, regardless of
NETWORK or MODE. If any of these is not true at any point, the pipeline is FAILED.

| # | Invariant                                                                                             |
| - | ----------------------------------------------------------------------------------------------------- |
| 1 | Every bash command targets `http://127.0.0.1:$RPC_PORT` — never a real network RPC.                   |
| 2 | The TodoWrite list has exactly 43 items (`T00..T42`), created in one call after §2 mode detection.    |
| 3 | `T00` is `pending` the entire run, not `in_progress`, and completes only after T41 cleanup succeeds.  |
| 4 | Exactly ONE subagent is `in_progress` at a time. Sequential dispatch. No parallel TODOs.              |
| 5 | Checkpoint gates (T14, T23, T29, T34, T40, T42) are orchestrator-only — NO subagent dispatch.         |
| 6 | X-ray offers (T13, T22, T28, T33, T39) are their own TODOs, each a subagent that ONLY builds text.    |
| 7 | Simulations (T18, T24) are mandatory unless a documented pre-flight reason forces SKIP.               |
| 8 | SKIP TODOs still dispatch a subagent (or are orchestrator-only); silent dropping = binding violation. |
| 9 | Dynamic slots (`OPCM_V4`, `OPCM_V5`, `NEW_CSC`, `NEW_ASR`) are filled by specific TODOs per §3.2.     |
| 10| Real `DEPLOYER_PK` flows forward in prompts; evidence reports redact it as `0x***`.                   |
| 11| Every exit path — success, failure, user stop, crash — lands at T41 cleanup.                          |
| 12| On CP3 FAIL (SG_ASR == OLD_ASR) or any other irrecoverable failure: cleanup, re-fork from scratch.    |

### §1.4 What goes to a subagent vs. to main agent

| Action                              | Main agent | Subagent |
| ------------------------------------ | ---------- | -------- |
| `TodoWrite`                          | ✅         | ❌       |
| Dispatching Task                     | ✅         | ❌       |
| `mcp_question` (checkpoint gate)     | ✅         | ❌       |
| `mcp_question` (prerequisites)       | ✅         | ❌       |
| `anvil`, `cast`, `forge`, `jq`, `lsof` | ❌       | ✅       |
| `bootstrap.sh`, `mock-*.sh`, `exec-*.sh` | ❌   | ✅       |
| `just sign`, `just simulate`         | ❌         | ✅       |
| Reading logs / verifying state       | ❌         | ✅       |
| Rendering PASS/FAIL table            | ❌         | ✅       |

---

## §2 MODE DETECTION (Step 0 — first action of every run)

**Detect mode** by scanning your invoking prompt for any of:
`non-interactive`, `background task`, `autonomous`, `headless`, `no questions`,
`do not ask`, `just run it`, `make decisions and proceed`.

- Match → **Autonomous mode**.
- No match AND you can call `mcp_question` → **Interactive mode**.

**Announce the mode** in your first message: `Detected mode: Interactive|Autonomous`.

**Mid-run mode switch**: if the user explicitly requests fewer gates during an
Interactive run (e.g. "just keep going", "don't ask me again"), switch to
**Autonomous mode** for subsequent checkpoint gates. Record the switch:
`Mode switched to Autonomous at T<NN> per user request`. All subsequent gates
(T23, T29, T34, T40, T42) use autonomous proceed logic. Checkpoint TODOs (.1
queries, .2 table, .3 x-ray offer) are still dispatched as subagents — only the
.4 gate interaction changes.

### §2.1 Autonomous mode — required details

In autonomous mode you MUST validate every required detail BEFORE any TodoWrite,
BEFORE any subagent dispatch. Missing detail → emit the missing-detail quit block
from §2.2 and stop.

Required for both modes:

| # | Detail             | Example                                         |
| - | ------------------ | ----------------------------------------------- |
| 1 | Execution mode     | `A` (mocked) or `B` (real sigs)                 |
| 2 | `CELO_ROOT`        | e.g. `/path/to/Celo` (your local checkout)      |
| 3 | Network            | `mainnet`, `sepolia`, `chaos`                   |
| 4 | Fork block         | numeric or alias (see §APPENDIX B)              |
| 5 | Upstream RPC URL   | Tenderly / archive Alchemy / archive Infura     |
| 6 | Anvil port         | default `8545`                                  |
| 7 | Deployer PK        | derives to network-specific SENDER (§APPENDIX B) |

Required in Mode A only:

| # | Detail                         | Notes                                         |
| - | ------------------------------ | --------------------------------------------- |
| 8a| Succinct config filename       | `opsuccinctfdgconfig.<network>.json` under `$SUCCINCT_REPO/contracts/` — OR generate via `just fetch-fdg-config`. See §3.4 for repo resolution and §F.1 for per-network config references. |
| 9a| `include_basefee`              | MUST be `no` — Mode A rejects `yes`           |

Required in Mode B only:

| # | Detail                         | Notes                                         |
| - | ------------------------------ | --------------------------------------------- |
| 8b| `include_basefee`              | `yes` or `no`                                 |

Optional with defaults:

- Sibling repo paths → default: sibling directories of `$CELO_ROOT` (e.g. `$CELO_ROOT/../Optimism`, `$CELO_ROOT/../Optimism2`, `$CELO_ROOT/../SuperchainOps`, `$CELO_ROOT/../CeloSuperchainOps`, `$CELO_ROOT/../Succinct`, `$CELO_ROOT/../Succinct2`)
- `SUCCINCT_ROOT_MAINNET` → default `$CELO_ROOT/../Succinct2` (see §3.4)
- Mocked signer addresses/PKs → defaults in §APPENDIX B

### §2.4 Sibling repo path discovery

Default paths use capitalized directory names (`Optimism`, `SuperchainOps`, etc.) but
real machines often have lowercase or hyphenated variants (`optimism`, `superchain-ops`,
`celo-superchain-ops`, `op-succinct`). At T01, the subagent MUST resolve each path
by checking both the default AND common alternatives:

| Variable               | Default                          | Common alternatives                                |
| ---------------------- | -------------------------------- | -------------------------------------------------- |
| `OP_ROOT_V4`           | `$CELO_ROOT/../Optimism`         | `../optimism`                                      |
| `OP_ROOT_V5`           | `$CELO_ROOT/../Optimism2`        | `../optimism2`, or same as `OP_ROOT_V4` (see §2.5) |
| `SUPERCHAIN_OPS`       | `$CELO_ROOT/../SuperchainOps`    | `../superchain-ops`                                |
| `CELO_SUPERCHAIN_OPS`  | `$CELO_ROOT/../CeloSuperchainOps`| `../celo-superchain-ops`                           |
| `SUCCINCT_ROOT`        | `$CELO_ROOT/../Succinct`         | `../op-succinct`                                   |
| `SUCCINCT_ROOT_MAINNET`| `$CELO_ROOT/../Succinct2`        | `../op-succinct-mainnet`                           |

Use `ls -d <path> 2>/dev/null` for each candidate. First match wins. If no match,
FAIL with `repo not found: <variable>=<tried paths>`.

### §2.5 Single optimism repo (OP_ROOT_V4 == OP_ROOT_V5)

The v4 and v5 bootstraps require **different `op-deployer` binaries**: v4 uses the
`celo10` / `op-deployer/v4.1.0` branch, v5 uses the `op-deployer/v5.0.0` branch.
These binaries produce different OPCM versions (v4 → `3.2.0`, v5 → `4.2.0`).

If only ONE optimism repo exists (no `Optimism2` clone):

1. At T01, set `OP_ROOT_V4 = OP_ROOT_V5 = <single repo path>` and record
   `single_optimism_repo=true` in evidence.
2. At T02, record the current branch of the single repo. If it is the v4 branch
   (`celo10` or similar), the v4 binary is available.
3. **Before T09** (v5 bootstrap), the orchestrator MUST instruct the T09 subagent to:
   a. Create a git worktree: `git -C $OP_ROOT_V4 worktree add /tmp/optimism-v5 origin/op-deployer/v5.0.0`
   b. Build the v5 op-deployer: `cd /tmp/optimism-v5/op-deployer && just build` (or `go build -o bin/op-deployer ./cmd/`)
   c. If the build needs forge artifacts: `cd /tmp/optimism-v5/packages/contracts-bedrock && forge build`
   d. Run `v5/bootstrap.sh` with `OP_ROOT=/tmp/optimism-v5`
   e. After T09 completes, clean up: `git -C $OP_ROOT_V4 worktree remove /tmp/optimism-v5 --force`
4. **Version guard at T09**: after bootstrap, verify `OPCM_V5 != OPCM_V4`. If they
   are equal, FAIL with `v5 bootstrap produced same OPCM as v4 — wrong binary used`.
   This is a hard guard against the v4/v5 binary confusion.

### §2.2 Missing-detail quit block (autonomous mode)

```
AUTONOMOUS MODE FAILURE: missing required detail(s).

Missing:
- <detail name>: not provided or ambiguous
- ...

This skill runs in autonomous mode and cannot ask the user. Re-invoke with all
required details explicitly passed in the prompt.

Aborting before any bash commands. No cleanup needed (nothing was started).
```

### §2.3 Interactive mode — prerequisites collection

Dispatch **one** subagent (`T01`, see §THE PROTOCOL) that asks the user for the missing
details via printed questions (the subagent does NOT use `mcp_question` — only the
main orchestrator does). The subagent returns a filled §CONTEXT_BLOCK as evidence.

---

## §3 THE CONTEXT BLOCK (build once, then grow across TODOs)

Every subagent dispatch starts with the same CONTEXT_BLOCK. You assemble it once after
T01 completes and **mutate a single slot only after it is explicitly discovered or
written** by a prior TODO. Never let a subagent "guess" a value.

```
CELO_ROOT=<path>
OP_ROOT_V4=<path>                 # default $CELO_ROOT/../Optimism (overridable)
OP_ROOT_V5=<path>                 # default $CELO_ROOT/../Optimism2
SUPERCHAIN_OPS=<path>             # default $CELO_ROOT/../SuperchainOps
CELO_SUPERCHAIN_OPS=<path>        # default $CELO_ROOT/../CeloSuperchainOps
SUCCINCT_ROOT=<path>              # default $CELO_ROOT/../Succinct
NETWORK=<mainnet|sepolia|chaos>
MODE=<A|B>
INCLUDE_BASEFEE=<yes|no>          # Mode B only; Mode A forces 'no'
RPC_PORT=<port>                   # default 8545
RPC_URL=http://127.0.0.1:<port>
LOCAL_RPC_URL=http://127.0.0.1:<port>   # SuperchainOps reads this
XRAY_PORT=<port>                  # default 8080 (collision check at T07)
UPSTREAM_RPC_URL=<archive RPC>    # see §3.1 redaction policy
FORK_BLOCK=<number>
FORK_CHAIN_ID=<1 | 11155111>
DEPLOYER_PK=<0x...>               # see §3.1 handling policy
SENDER=<network-specific; §APPENDIX B.6>
PARENT_SAFE=<§APPENDIX B.3>
CLABS_SAFE=<§APPENDIX B.3>
COUNCIL_SAFE=<§APPENDIX B.3>
SYSTEM_CONFIG=<§APPENDIX B.4 or B.4b>
DGF=<§APPENDIX B.4 or B.4b>
OLD_ASR=<§APPENDIX B.4 or B.4b>
OLD_CSC=<§APPENDIX B.4 or B.4b>
SUCCINCT_IMPL_ADDR=<§APPENDIX B.4 or B.4b>
EXPECTED_NEW_ASR=<§APPENDIX B.4 or B.4b>   # deterministic post-v4 ASR
SUCCINCT_CONFIG_FILE=<Mode A only; filename under $SUCCINCT_REPO/contracts/>
SUCCINCT_REPO=<resolved Succinct repo; see §3.4>
SUCCINCT_PROPOSAL_ADDR=<expected impl addr from CeloSuperchainOps proposal; §F.2>
SUCCINCT_DEPLOY_STRATEGY=<pending|deploy|setcode; see §3.2 & §5.10>
OPCM_V4=<see §3.2 dynamic slots>
OPCM_V5=<see §3.2 dynamic slots>
NEW_CSC=<see §3.2 dynamic slots>
NEW_ASR=<see §3.2 dynamic slots>
```

### §3.1 Secret & RPC handling

- **`DEPLOYER_PK`**: the orchestrator holds the real value in memory and passes it
  verbatim into each subagent dispatch prompt that needs it (T04 anvil fork,
  T08 bootstrap v4, T09 bootstrap v5, T19 exec v4, T25 exec v5, T30 exec succ-v2,
  T36 exec basefee). In **evidence returned by subagents**, the value MUST be redacted
  as `0x***`. In **TodoWrite task descriptions**, never include the raw PK. Rule:
  "real PK flows forward in prompts, redacted PK flows back in evidence."
- **`UPSTREAM_RPC_URL`**: treated the same way. Real URL flows forward, redacted as
  `<upstream-archive>` in evidence.
- **CONTEXT_BLOCK shown in this skill file uses placeholders** — when the
  orchestrator passes it to a subagent, it substitutes the real values.

### §3.2 Dynamic slots (mutated by specific TODOs)

Dynamic slots are populated between dispatches (not all at T01). The orchestrator
MUST update the CONTEXT_BLOCK between TODOs when each slot is filled:

| Slot         | Filled by            | Source                                                                             |
| ------------ | -------------------- | ---------------------------------------------------------------------------------- |
| `OPCM_V4`    | **Mode A**: T08 output. **Mode B**: T01 static from §B.5 (not actually dynamic in Mode B) | Mode A: `jq -r .opcm .../op-deployer/v4/config-upgrade.json` / Mode B: §B.5 literal |
| `OPCM_V5`    | **Mode A**: T09 output. **Mode B**: T01 static from §B.5                                    | Mode A: same for v5 / Mode B: §B.5 literal                                          |
| `NEW_CSC`    | T20                  | `cast call $SYSTEM_CONFIG "superchainConfig()(address)"`                           |
| `NEW_ASR`    | T20                  | `cast call <PERM_GAME_V4> "anchorStateRegistry()(address)"`                        |
| `OLD_CSC`    | **Mode A mainnet**: §B.4 literal at T01. **Other networks**: T11 dynamic capture from `SystemConfig.superchainConfig()` on the pre-v4 fork state | see §B.4b sepolia note |
| `SUCCINCT_IMPL_ADDR` | **Mainnet**: §B.4 literal at T01 (initial). **Sepolia**: T01 grep from `exec-jovian-sepolia.sh SUCCINCT_IMPL=` line. **Chaos**: T01 grep from same script's chaos branch. T10 may override if Strategy A (deploy) succeeds — see §5.10. | §B.4 / §B.4b / §F.2 |
| `SUCCINCT_PROPOSAL_ADDR` | T01 from §F.2 per NETWORK. | §F.2 literal |
| `SUCCINCT_DEPLOY_STRATEGY` | T10 — set to `deploy` if Strategy A succeeds, `setcode` if fallback used. | §5.10 |
| `SUCCINCT_REPO` | T01 — resolved per §3.4: mainnet → `$SUCCINCT_ROOT_MAINNET`, sepolia/chaos → `$SUCCINCT_ROOT`. | §3.4 |

Rule: after a TODO whose evidence contains one of these slots, the orchestrator's
very next action is to append the new value to its in-memory CONTEXT_BLOCK. All
subsequent dispatches use the grown block. Subagents downstream of T20 (T21, T26,
T27, T31, T32) therefore see `NEW_CSC` and `NEW_ASR` as concrete addresses, not
`<placeholder>`.

### §3.3 Sibling repo path portability

The `OP_ROOT_V4`/`OP_ROOT_V5`/`SUPERCHAIN_OPS`/`CELO_SUPERCHAIN_OPS`/`SUCCINCT_ROOT`/
`SUCCINCT_ROOT_MAINNET` defaults assume a single operator's laptop layout. On a
different machine, the orchestrator MUST override these in T01 (interactive: ask;
autonomous: orchestrator prompt must pass them).

### §3.4 Succinct repo resolution (NETWORK-dependent)

Succinct has a **per-network repo problem**: different networks were deployed with
different repo versions, branches, and commits — each producing different vkeys and
therefore different contract addresses. This is a temporary state; eventually all
versions should converge into tagged releases in the public Succinct repo.

**Current state (Jovian era)**:

| Network  | Repo variable          | Default path                       | Why                                                                                           |
| -------- | ---------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| mainnet  | `SUCCINCT_ROOT_MAINNET`| `$CELO_ROOT/../Succinct2`          | Requires a specific repo, branch, or commit to produce vkeys matching the mainnet deployment. Operator determines the correct source.                    |
| sepolia  | `SUCCINCT_ROOT`        | `$CELO_ROOT/../Succinct`           | Public repo at specific commit produces vkeys matching sepolia deployment.                     |
| chaos    | `SUCCINCT_ROOT`        | `$CELO_ROOT/../Succinct`           | Public repo at specific commit produces vkeys matching chaos deployment.                      |

At T01, set `SUCCINCT_REPO` to the resolved path:
- `NETWORK=mainnet` → `SUCCINCT_REPO=$SUCCINCT_ROOT_MAINNET`
- `NETWORK=sepolia|chaos` → `SUCCINCT_REPO=$SUCCINCT_ROOT`

The FDG config file at `$SUCCINCT_REPO/contracts/opsuccinctfdgconfig.$NETWORK.json`
(or the generic `opsuccinctfdgconfig.json` generated by `just fetch-fdg-config`)
contains `aggregationVkey` and `rangeVkeyCommitment` — these are constructor
parameters to `OPSuccinctFaultDisputeGame` and directly affect the deployed
contract address via CREATE (deployer + nonce + initcode w/ constructor args).

**Vkey → address chain**: `repo commit` → `SP1 ELF binaries` → `aggregationVkey +
rangeVkeyCommitment` → `constructor args` → `initcode hash` → with deployer nonce →
`CREATE address`. Wrong commit = wrong vkeys = wrong address = proposal mismatch.

See §APPENDIX F for per-network commit references, config URLs, and expected
proposal addresses.

---

## §4 THE PROTOCOL — FIXED TODO CHECKLIST

Create the list below in ONE `TodoWrite` call, immediately after §2 mode detection.
Items are numbered `T00`..`T42` in BOTH Mode A and Mode B (43 items total — the list
has the same length in both modes; only the subjects differ between the tables below,
with skipped phases marked as explicit SKIP TODOs). Use these exact subjects verbatim
(you may add the `activeForm` field as shown).

### §4.1 Mode A (mocked, full canonical flow)

| ID  | Subject                                                              | Card §  |
| --- | -------------------------------------------------------------------- | ------- |
| T00 | CLEANUP PRECOMMIT: kill anvil on $RPC_PORT at end of run             | §5.0    |
| T01 | Collect prerequisites + build CONTEXT_BLOCK                          | §5.1    |
| T02 | Validate repo branches & build artifacts (5 sibling repos)           | §5.2    |
| T03 | Validate CLI tools (anvil, cast, forge, jq, just, mise)              | §5.3    |
| T04 | Start anvil fork at $FORK_BLOCK and verify block number              | §5.4    |
| T05 | Mock Safe storage via mock-$NETWORK.sh                               | §5.5    |
| T06 | Validate mock state (thresholds=2, owners, nonces)                   | §5.6    |
| T07 | Start x-ray dashboard on :$XRAY_PORT                                 | §5.7    |
| T08 | Bootstrap v4 OPCM via op-deployer/v4/bootstrap.sh                    | §5.8    |
| T09 | Bootstrap v5 OPCM via op-deployer/v5/bootstrap.sh                    | §5.9    |
| T10 | Plant Succinct v2 impl (Strategy A: deploy from repo; Strategy B: setCodeAtAddress fallback) | §5.10 |
| T11 | CP0.1 — run post-deploy baseline validation queries                  | §5.11   |
| T12 | CP0.2 — render PASS/FAIL table                                       | §5.12   |
| T13 | CP0.3 — x-ray offer (interactive mcp_question OR headless ack)       | §5.13   |
| T14 | CP0.4 — checkpoint gate (mcp_question / autonomous proceed)          | §5.14   |
| T15 | Sign v4 (clabs + council) via CeloSuperchainOps                      | §5.15   |
| T16 | Sign v5 (clabs + council) via CeloSuperchainOps                      | §5.16   |
| T17 | Sign succ-v2 (clabs + council) via CeloSuperchainOps                 | §5.17   |
| T18 | Simulate v4 via SuperchainOps (REQUIRED; skip only with documented reason) | §5.18 |
| T19 | Execute v4 (exec-mocked.sh mainnet / exec-jovian-sepolia.sh sep/chaos) | §5.19   |
| T20 | CP1.1 — run post-v4 validation queries (discover $NEW_ASR, $NEW_CSC) | §5.20   |
| T21 | CP1.2 — render PASS/FAIL table                                       | §5.21   |
| T22 | CP1.3 — x-ray offer                                                  | §5.22   |
| T23 | CP1.4 — checkpoint gate                                              | §5.23   |
| T24 | Simulate v5 via SuperchainOps (REQUIRED; skip only with documented reason) | §5.24 |
| T25 | Execute v5 (exec-mocked.sh mainnet / exec-jovian-sepolia.sh sep/chaos) | §5.25   |
| T26 | CP2.1 — run post-v5 validation queries                               | §5.26   |
| T27 | CP2.2 — render PASS/FAIL table                                       | §5.27   |
| T28 | CP2.3 — x-ray offer                                                  | §5.28   |
| T29 | CP2.4 — checkpoint gate                                              | §5.29   |
| T30 | Execute succ-v2 (exec-mocked.sh mainnet / exec-jovian-sepolia.sh sep/chaos: succinct-v2) | §5.30 |
| T31 | CP3.1 — run post-succ-v2 validation queries                          | §5.31   |
| T32 | CP3.2 — render PASS/FAIL table                                       | §5.32   |
| T33 | CP3.3 — x-ray offer                                                  | §5.33   |
| T34 | CP3.4 — checkpoint gate                                              | §5.34   |
| T35 | Phase 7 — final comparison table (CP0..CP3 progression)              | §5.35   |
| T36 | Phase 8 — SKIP (Mode A incompatible)                                 | §5.36   |
| T37 | CP4.1 — SKIP (Phase 8 not executed)                                  | §5.37   |
| T38 | CP4.2 — SKIP                                                         | §5.38   |
| T39 | CP4.3 — SKIP                                                         | §5.39   |
| T40 | CP4.4 — SKIP                                                         | §5.40   |
| T41 | CLEANUP — kill anvil, kill x-ray, verify port free, print summary    | §5.41   |
| T42 | CLEANUP GATE — mcp_question (interactive) / final print (autonomous) | §5.42   |

### §4.2 Mode B (real signatures, post-impls block)

| ID  | Subject                                                              | Card §  |
| --- | -------------------------------------------------------------------- | ------- |
| T00 | CLEANUP PRECOMMIT: kill anvil on $RPC_PORT at end of run             | §5.0    |
| T01 | Collect prerequisites + build CONTEXT_BLOCK                          | §5.1    |
| T02 | Validate repo state (Celo only; sibling builds not required)         | §5.2    |
| T03 | Validate CLI tools                                                   | §5.3    |
| T04 | Start anvil fork at $FORK_BLOCK (post-impls) and verify block        | §5.4    |
| T05 | SKIP mock — Mode B keeps real Safes (emit explicit SKIP report)      | §5.5    |
| T06 | SKIP mock validation — n/a in Mode B                                 | §5.6    |
| T07 | Start x-ray dashboard on :$XRAY_PORT                                 | §5.7    |
| T08 | SKIP bootstrap v4 — real OPCM v4 already on-chain                    | §5.8    |
| T09 | SKIP bootstrap v5 — real OPCM v5 already on-chain                    | §5.9    |
| T10 | SKIP Succinct plant — real impl already on-chain at fork block       | §5.10   |
| T11 | CP0.1 — post-deploy baseline queries                                 | §5.11   |
| T12 | CP0.2 — render PASS/FAIL table                                       | §5.12   |
| T13 | CP0.3 — x-ray offer                                                  | §5.13   |
| T14 | CP0.4 — checkpoint gate                                              | §5.14   |
| T15 | SKIP sign v4 — real sigs in secrets/.env.signers.v4                  | §5.15   |
| T16 | SKIP sign v5 — real sigs in secrets/.env.signers.v5                  | §5.16   |
| T17 | SKIP sign succ-v2 — real sigs in secrets/.env.signers.succinct200    | §5.17   |
| T18 | Simulate v4 via SuperchainOps (REQUIRED; skip only with documented reason) | §5.18 |
| T19 | Execute v4 via exec-jovian.sh v4                                     | §5.19   |
| T20 | CP1.1 — run post-v4 validation queries                               | §5.20   |
| T21 | CP1.2 — render PASS/FAIL table                                       | §5.21   |
| T22 | CP1.3 — x-ray offer                                                  | §5.22   |
| T23 | CP1.4 — checkpoint gate                                              | §5.23   |
| T24 | Simulate v5 via SuperchainOps (REQUIRED)                             | §5.24   |
| T25 | Execute v5 via exec-jovian.sh v5                                     | §5.25   |
| T26 | CP2.1 — run post-v5 validation queries                               | §5.26   |
| T27 | CP2.2 — render PASS/FAIL table                                       | §5.27   |
| T28 | CP2.3 — x-ray offer                                                  | §5.28   |
| T29 | CP2.4 — checkpoint gate                                              | §5.29   |
| T30 | Execute succ-v2 via exec-jovian.sh succ-v2                           | §5.30   |
| T31 | CP3.1 — post-succ-v2 queries                                         | §5.31   |
| T32 | CP3.2 — render PASS/FAIL table                                       | §5.32   |
| T33 | CP3.3 — x-ray offer                                                  | §5.33   |
| T34 | CP3.4 — checkpoint gate                                              | §5.34   |
| T35 | Phase 7 — final comparison table                                     | §5.35   |
| T36 | Phase 8 — execute exec-basefee.sh (if INCLUDE_BASEFEE=yes) OR SKIP   | §5.36   |
| T37 | CP4.1 — post-basefee queries (only if T36 executed)                  | §5.37   |
| T38 | CP4.2 — render PASS/FAIL table                                       | §5.38   |
| T39 | CP4.3 — x-ray offer                                                  | §5.39   |
| T40 | CP4.4 — checkpoint gate                                              | §5.40   |
| T41 | CLEANUP — kill anvil, kill x-ray, verify port free, print summary    | §5.41   |
| T42 | CLEANUP GATE                                                         | §5.42   |

> In Mode A: `T36..T40` stay in the list as explicit SKIP TODOs (Mode A incompatible).
> In Mode B with `INCLUDE_BASEFEE=no`: `T36..T40` stay in the list as SKIPs.

---

## §5 EXECUTION CARDS — per-TODO subagent prompt templates

Each card tells you (a) what the subagent should do, (b) the exact `REQUIRED EVIDENCE`
block the subagent must return, (c) the PASS condition, (d) the model tier.

All subagents are dispatched with this wrapper:

```
Task(
  subagent_type="oh-my-claudecode:executor",
  model="<tier>",
  description="Jovian T<NN>",
  prompt="""
<§1.1 safety reminder: localhost only; no retries; fail-fast>
<§CONTEXT_BLOCK verbatim>

TODO: T<NN>
CARD: §5.<NN>

TASK:
<card body>

REQUIRED EVIDENCE (return ALL of these, labelled, in your final report):
<card evidence list>

OUTPUT FORMAT:
---
TODO: T<NN>
STATUS: PASS | FAIL | SKIP
EVIDENCE:
  <labelled evidence block>
NEXT: <one sentence>
---

If the task fails: report FAIL with the exact error and DO NOT attempt recovery.
"""
)
```

Orchestrator verifies evidence → marks TODO complete. Missing evidence → re-dispatch.

### §5.0 — T00 Cleanup precommit (SENTINEL — stays `pending`)

**Task**: Lightweight sentinel subagent that records the cleanup plan so it is
visible from the very first `TodoWrite`. It lists the files/processes that T41
will kill/preserve but does NOT kill anything itself. After the subagent returns
PASS, the orchestrator keeps T00 on the TodoWrite list as **`pending`** (per §1.1
rule 6 — NOT `in_progress`, NOT `completed`) until T41 cleanup succeeds, at which
point the orchestrator marks T00 `completed`.

Files the subagent registers for cleanup: `/tmp/anvil-$RPC_PORT.pid`,
`/tmp/anvil-$RPC_PORT.log`, `/tmp/xray-$RPC_PORT.pid`, `/tmp/xray-$RPC_PORT.log`.
Directories: `/tmp/optimism-v5` (git worktree, created by §2.5 if single repo).
Ports to verify free at T41: `$RPC_PORT`, `$XRAY_PORT`.

Tier: `haiku`.

**Evidence**: `ARMED: rpc_port=$RPC_PORT; xray_port=$XRAY_PORT; files=/tmp/anvil-$RPC_PORT.pid,/tmp/anvil-$RPC_PORT.log,/tmp/xray-$RPC_PORT.pid,/tmp/xray-$RPC_PORT.log; cleanup_todo=T41`

### §5.1 — T01 Collect prerequisites

**Task**: Build the §CONTEXT_BLOCK. Steps (applied in order):

1. **Alias normalization**: if `FORK_BLOCK` is a string alias (`oldest block`,
   `pre-impls`, `mode-a block`, `post-impls`, `mode-b block`, `impls-deployed`),
   resolve via §B.1 for the chosen NETWORK. After resolution, verify the resolved
   numeric block matches the declared `MODE` (Mode A = pre-impls row; Mode B =
   post-impls row). Mismatch → FAIL with `mode-block mismatch: <mode> expects <n>, got <actual>`.
2. **Address resolution**: populate all static slots (`SENDER`, `PARENT_SAFE`,
   `CLABS_SAFE`, `COUNCIL_SAFE`, `SYSTEM_CONFIG`, `DGF`, `OLD_ASR`) from §B.3/§B.4
   (mainnet) or §B.4b (sepolia/chaos). On mainnet also populate `OLD_CSC` and
   `SUCCINCT_IMPL_ADDR` from §B.4 literals; on **sepolia/chaos**, `OLD_CSC` is
   deferred (set to empty placeholder — captured later at T11 from
   `SystemConfig.superchainConfig()` on the pre-v4 fork and copied into
   CONTEXT_BLOCK before T12 dispatches), and `SUCCINCT_IMPL_ADDR` is captured
   at T01 with
   `grep -m1 'SUCCINCT_IMPL[_ADDR]*=' $CELO_ROOT/packages/op-tooling/exec/exec-jovian-sepolia.sh | sed 's/.*=//'`.
   `EXPECTED_NEW_ASR` is populated from §B.4 on mainnet and left empty on
   non-mainnet runs (compared dynamically at T20).
3. **OPCM resolution**: Mode B sets `OPCM_V4` and `OPCM_V5` from §B.5. Mode A leaves
   them empty (filled by T08/T09).
4. **Secret handling**: `DEPLOYER_PK` and `UPSTREAM_RPC_URL` are passed through to
   downstream cards verbatim; in the **evidence report** from T01, redact
   `DEPLOYER_PK` as `0x***` and `UPSTREAM_RPC_URL` as `<upstream-archive>`.
5. **Interactive round-trip**: in Interactive mode, if any required detail is
   missing, the subagent prints numbered questions to stdout and returns
   `STATUS: FAIL` with evidence `missing_details=<list>`. The orchestrator then
   calls `mcp_question` itself (only the orchestrator is allowed to, per §1.4)
   to collect answers, then re-dispatches T01 with the merged details.
6. **Autonomous mode**: on any missing or ambiguous detail → `STATUS: FAIL` with
   the §2.2 missing-detail quit block. Do NOT guess.

Tier: `haiku`.

**Evidence**: full CONTEXT_BLOCK filled in; `DEPLOYER_PK` redacted as `0x***`;
`UPSTREAM_RPC_URL` redacted as `<upstream-archive>`; plus, in interactive mode,
a numbered `missing_details=<list>` block if applicable.

### §5.2 — T02 Validate repos

**Task (Mode A)**: for each of $OP_ROOT_V4, $OP_ROOT_V5, $SUPERCHAIN_OPS,
$CELO_SUPERCHAIN_OPS, $SUCCINCT_ROOT: check branch (`git branch --show-current`),
binary presence (`op-deployer/bin/op-deployer` for v4/v5), forge artifact count,
task directories. SCOps task directories:
- `NETWORK=mainnet`: `$SUPERCHAIN_OPS/src/tasks/eth/048-opcm-upgrade-v410-celo/`
  and `.../eth/049-opcm-upgrade-v500-celo/`
- `NETWORK=sepolia`: `$SUPERCHAIN_OPS/src/tasks/sep/074-opcm-upgrade-v410-celo-sepolia/`
  and `.../sep/075-opcm-upgrade-v500-celo-sepolia/` (path is `sep/` at the TOP level of
  `src/tasks/`, NOT under `eth/sep/`; note the task numbers are 074/075, not 048/049)
- `NETWORK=chaos`: no SCOps tasks exist; T02 MUST return a chaos-specific evidence
  line `scops_chaos=N/A`; T18/T24 will SKIP for the same reason.
If artifacts missing → run `forge build` (may take 5-10 min). This is the ONE
exception to "no extra steps" (§7 dispatch rules): artifact bootstrap is explicitly
allowed in T02.

**Succinct build & FDG config validation (Mode A)**:
1. Resolve `$SUCCINCT_REPO` per §3.4 (mainnet → `$SUCCINCT_ROOT_MAINNET`, else →
   `$SUCCINCT_ROOT`). Verify the directory exists and is a git repo.
2. Report `git -C $SUCCINCT_REPO log --oneline -1` and `git -C $SUCCINCT_REPO
   branch --show-current` as evidence (`succinct_commit=<hash>; succinct_branch=<br>`).
3. Check for pre-existing per-network config:
   `$SUCCINCT_REPO/contracts/opsuccinctfdgconfig.$NETWORK.json`. If present, use it
   as `SUCCINCT_CONFIG_FILE`. If absent, check for the generic
   `$SUCCINCT_REPO/contracts/opsuccinctfdgconfig.json`.
4. If neither config exists AND the operator has a `.env.$NETWORK` in the Succinct
   repo: attempt `cd $SUCCINCT_REPO && just fetch-fdg-config .env.$NETWORK` to
   generate it. This may fail if RPC access is not configured — on failure, record
   `fdg_config_generated=false` as evidence and continue (T10 Strategy B
   `setCodeAtAddress` fallback will be used).
5. If a config file is found/generated: extract and report `aggregationVkey` and
   `rangeVkeyCommitment` from it as evidence. Store the config path as
   `SUCCINCT_CONFIG_FILE` in the CONTEXT_BLOCK.
6. Build Succinct contracts: `cd $SUCCINCT_REPO/contracts && forge build`. If build
   fails, record `succinct_build=failed` — T10 will use Strategy B fallback.
7. Report `succinct_build=ok|failed; fdg_config=$SUCCINCT_CONFIG_FILE|missing`.

**Task (Mode B)**: only check `$CELO_ROOT/packages/op-tooling/exec/exec-jovian.sh`
(mainnet) or `exec-jovian-sepolia.sh` (sepolia/chaos) exists AND
`$CELO_ROOT/secrets/.env.signers.{v4,v5,succinct200}` are decrypted. If
`INCLUDE_BASEFEE=yes`, ALSO check `$CELO_ROOT/secrets/.env.signers.basefee` — this
is the pre-check so Phase 8 does not late-fail at T36.

Tier: `sonnet`.

**Evidence**: per-repo `branch=<x>, binary=<ok|missing|built>, artifacts=<N>` lines;
`scops_tasks=<eth|sep|N/A>`; `exec_script=<file>`; for Mode B: `signers.v4=ok`,
`signers.v5=ok`, `signers.succinct200=ok`, `signers.basefee=ok|N/A`.

### §5.3 — T03 Validate CLI tools

**Task**: `which anvil cast forge jq just mise`. Report missing.
Tier: `haiku`.

**Evidence**: `anvil=<path>; cast=<path>; forge=<path>; jq=<path>; just=<path>; mise=<path>` one per line.

### §5.4 — T04 Start anvil fork

**Task**:
1. `lsof -ti:$RPC_PORT` — if non-empty, FAIL ("port busy; orchestrator must resolve").
2. `anvil --port $RPC_PORT --fork-url "$UPSTREAM_RPC_URL" --fork-chain-id $FORK_CHAIN_ID --fork-block-number $FORK_BLOCK &>/tmp/anvil-$RPC_PORT.log & echo $! > /tmp/anvil-$RPC_PORT.pid`
3. `sleep 3 && cast block-number -r $RPC_URL`
Tier: `haiku`.

**Evidence**: `anvil_pid=<N>; current_block=<matches $FORK_BLOCK ±1>`

### §5.5 — T05 Mock Safe storage (Mode A only; SKIP in Mode B)

**Script selection by network** (the skill does NOT have `mock-chaos.sh` or
`mock-mainnet.sh` symlinks — these are the real script names):
- `NETWORK=mainnet`: `./mock-mainnet.sh`
- `NETWORK=sepolia`: `NETWORK=sepolia ./mock-sepolia.sh`
- `NETWORK=chaos`:   `NETWORK=chaos ./mock-sepolia.sh`   (same script, different env)

**Task (Mode A, NETWORK=mainnet)**:
```
cd $CELO_ROOT/packages/op-tooling/fork
RPC_URL=$RPC_URL \
NETWORK=$NETWORK \
MOCKED_SIGNER_1=0x865d05C8bB46E7AF16D6Dc99ddfb2e64BBec1345 \
MOCKED_SIGNER_2=0x899a864C6bE2c573a98d8493961F4D4c0F7Dd0CC \
MOCKED_SIGNER_3=0x480C5f2340f9E7A46ee25BAa815105B415a7c2e2 \
MOCKED_SIGNER_4=0x8Af6f11c501c082bD880B3ceC83e6bB249Fa32c9 \
./mock-mainnet.sh
```

**Task (Mode A, NETWORK=sepolia|chaos)**:
`mock-sepolia.sh` does NOT inject mocked signers — it only transfers contract
ownership (ProxyAdmin, SystemConfig, DGF, etc.) to the Safe and fixes the
SuperchainConfig proxy admin slot. The MOCKED_SIGNER_* env vars are NOT used.
```
cd $CELO_ROOT/packages/op-tooling/fork
RPC_URL=$RPC_URL \
NETWORK=$NETWORK \
./mock-sepolia.sh
```
`exec-jovian-sepolia.sh` uses pre-signed signatures (hardcoded per version) instead
of mocked signer PKs, so injecting mocked owners is not needed on sepolia/chaos.

**Task (Mode B)**: `STATUS: SKIP` with evidence `SKIP: Mode B keeps real Safes`.
Tier: `haiku`.

**Evidence (Mode A mainnet)**: `mock_script=mock-mainnet.sh; exit_code=0`
**Evidence (Mode A sepolia/chaos)**: `mock_script=mock-sepolia.sh; exit_code=0`
**Evidence (Mode B)**: `SKIP: Mode B keeps real Safes`

### §5.6 — T06 Validate mock state (Mode A only; SKIP in Mode B)

**Task (Mode A, NETWORK=mainnet)**:
```
cast call $PARENT_SAFE  "getThreshold()(uint256)" -r $RPC_URL
cast call $CLABS_SAFE   "getThreshold()(uint256)" -r $RPC_URL
cast call $COUNCIL_SAFE "getThreshold()(uint256)" -r $RPC_URL
cast call $PARENT_SAFE  "getOwners()(address[])"  -r $RPC_URL
cast call $CLABS_SAFE   "getOwners()(address[])"  -r $RPC_URL
cast call $COUNCIL_SAFE "getOwners()(address[])"  -r $RPC_URL
cast call $PARENT_SAFE  "nonce()(uint256)"        -r $RPC_URL
cast call $CLABS_SAFE   "nonce()(uint256)"        -r $RPC_URL
cast call $COUNCIL_SAFE "nonce()(uint256)"        -r $RPC_URL
```

**Task (Mode A, NETWORK=sepolia)**:
Same queries as mainnet, but expected values differ. `mock-sepolia.sh` does NOT
inject mocked signers, so the Safe owners/thresholds are the real sepolia values:
- Parent Safe: threshold=2, owners=[cLabs_Safe, Council_Safe] (nested Safe structure)
- cLabs Safe: threshold=1
- Council Safe: threshold=1
Nonces match §B.8 row for sepolia (all 0 at pre-impls block).

**Task (Mode A, NETWORK=chaos)**: flat Safe — query `getThreshold()`, `getOwners()`,
`nonce()` on the single chaos Safe `0x6F8DB5...66a9` only.
**Task (Mode B)**: `STATUS: SKIP` with evidence `SKIP: Mode B keeps real Safes`.
Tier: `haiku`.

**Evidence (mainnet Mode A)**: three thresholds (all `2`), three owner
arrays (match §B.7 mocked defaults), three nonces (match §B.8 row for NETWORK+MODE).
**Evidence (sepolia Mode A)**: Parent_threshold=2, cLabs_threshold=1,
Council_threshold=1; three owner arrays (real sepolia owners, NOT mocked);
three nonces (match §B.8 row for sepolia).
**Evidence (chaos Mode A)**: `threshold=1; owner=<EOA>; nonce=<baseline>`.
**Evidence (Mode B)**: `SKIP: Mode B keeps real Safes`.

### §5.7 — T07 Start x-ray dashboard

**Task**:
1. `lsof -ti:$XRAY_PORT` — if non-empty, FAIL with `xray port $XRAY_PORT busy;
   orchestrator must resolve or override XRAY_PORT in CONTEXT_BLOCK`.
2. `cd $CELO_ROOT/packages/op-tooling/x-ray && python3 -m http.server $XRAY_PORT
   &>/tmp/xray-$RPC_PORT.log & echo $! > /tmp/xray-$RPC_PORT.pid`
3. `sleep 2 && curl -sSf http://localhost:$XRAY_PORT | head -c 200`
Tier: `haiku`.

**Evidence**: `xray_pid=<N>; xray_port=$XRAY_PORT; curl_status=200`.

### §5.8 — T08 Bootstrap v4 OPCM (Mode A only; SKIP in Mode B)

**PRECONDITION**: T06 STATUS=PASS (Mode A) OR T06 STATUS=SKIP (Mode B — then T08 also SKIPs).

**Task (Mode A)**:
```
cd $CELO_ROOT/packages/op-tooling/op-deployer/v4
RPC_URL=$RPC_URL \
NETWORK=$NETWORK \
OP_ROOT=$OP_ROOT_V4 \
MULTISIG_ADDRESS=<§APPENDIX B.3 "Multisig (bootstrap)" row for NETWORK> \
DEPLOYER_PK=<real DEPLOYER_PK, not 0x***> \
./bootstrap.sh
OPCM_V4=$(jq -r '.opcm' $CELO_ROOT/packages/op-tooling/op-deployer/v4/config-upgrade.json)
cast codesize $OPCM_V4 -r $RPC_URL
```
Return `OPCM_V4` as labelled evidence so the orchestrator can mutate CONTEXT_BLOCK
per §3.2.

**Task (Mode B)**: `STATUS: SKIP` with evidence
`SKIP: Mode B — OPCM_V4=<§B.5 value> already on-chain`.

Tier: `sonnet`.

**Evidence (Mode A)**: `OPCM_V4=0x<addr>; codesize>0`
**Evidence (Mode B)**: `SKIP: Mode B — OPCM_V4=<§B.5 mainnet value> already on-chain`

### §5.9 — T09 Bootstrap v5 OPCM (Mode A only; SKIP in Mode B)

**PRECONDITION**: T08 STATUS=PASS or SKIP.

Mirror of §5.8 for the v5 path (`.../op-deployer/v5/bootstrap.sh` and
`.../op-deployer/v5/config-upgrade.json`).

**CRITICAL — v5 binary requirement**: v5 bootstrap MUST use the `op-deployer/v5.0.0`
branch binary, NOT the v4 binary. If `OP_ROOT_V4 == OP_ROOT_V5` (single repo), the
subagent MUST use a git worktree per §2.5. The v5 OPCM version should be `4.2.0`
(not `3.2.0` which is v4).

**Version guard**: after bootstrap, the subagent MUST verify:
1. `OPCM_V5 != OPCM_V4` — if equal, FAIL with `v5 bootstrap produced same OPCM as
   v4 — wrong binary used`. This catches the single-repo-wrong-branch bug.
2. `cast call $OPCM_V5 "version()(string)"` — must return `"4.2.0"` (not `"3.2.0"`).
   If it returns `"3.2.0"`, FAIL with `v5 OPCM has v4 version — wrong binary`.

**Evidence (Mode A)**: `OPCM_V5=0x<addr>; codesize>0; opcm_version=4.2.0; v5_differs_from_v4=true`
**Evidence (Mode B)**: `SKIP: Mode B — OPCM_V5=<§B.5 mainnet value> already on-chain`

Tier: `sonnet`.

### §5.10 — T10 Plant Succinct v2 impl (Mode A only; SKIP in Mode B)

**PRECONDITION**: T09 STATUS=PASS (OPCM_V5 deployed — not strictly needed for
this call but the orchestrator enforces Phase 2 monotonicity).

**Task (Mode B)**: `STATUS: SKIP` with evidence
`SKIP: Mode B — Succinct impl $SUCCINCT_IMPL_ADDR already on-chain at fork block`.

**Task (Mode A)**: Two strategies, tried in order. The subagent MUST attempt
Strategy A first; only fall through to Strategy B on failure.

#### Strategy A — Deploy from Succinct repo (preferred)

**Preconditions for Strategy A** (all must be true; if ANY is false → skip to B):
- `SUCCINCT_CONFIG_FILE` is set (T02 found or generated an FDG config).
- `succinct_build=ok` (T02 evidence).
- `$SUCCINCT_REPO/contracts/` contains forge artifacts (`out/` non-empty).

**Steps**:
1. Read the FDG config and extract key fields:
   ```
   AGG_VKEY=$(jq -r '.aggregationVkey' $SUCCINCT_CONFIG_FILE)
   RANGE_VKEY=$(jq -r '.rangeVkeyCommitment' $SUCCINCT_CONFIG_FILE)
   ROLLUP_HASH=$(jq -r '.rollupConfigHash' $SUCCINCT_CONFIG_FILE)
   VERIFIER=$(jq -r '.verifierAddress' $SUCCINCT_CONFIG_FILE)
   ```
   Report these as evidence: `agg_vkey=<val>; range_vkey=<val>`.

2. Deploy via forge script on the local fork:
   ```
   cd $SUCCINCT_REPO/contracts
   forge script script/fp/DeployOPSuccinctFDG.s.sol \
     --fork-url $RPC_URL \
     --private-key $DEPLOYER_PK \
     --broadcast \
     --json
   ```
   Capture the deployed `OPSuccinctFaultDisputeGame` address from forge output.
   Record as `deployed_addr=<addr>`.

3. **Address comparison**: compare `deployed_addr` against `$SUCCINCT_PROPOSAL_ADDR`
   (from §F.2 via CONTEXT_BLOCK).
   - **Match** → Strategy A SUCCESS. Set `SUCCINCT_IMPL_ADDR=$deployed_addr` and
     `SUCCINCT_DEPLOY_STRATEGY=deploy`. Proceed to validation (step 4).
   - **Mismatch** → log a WARNING:
     ```
     WARN: Strategy A deployed at <deployed_addr> but proposal expects
     <SUCCINCT_PROPOSAL_ADDR>. Likely cause: deployer nonce mismatch or
     vkey divergence (see §F.3 nonce quirks). Falling through to Strategy B.
     ```
     Proceed to Strategy B.

   **Mainnet nonce quirk**: on mainnet, the Succinct game impl was deployed
   TWICE during the original deployment (the first attempt consumed a nonce).
   This means the effective deployer nonce is +1 from what a clean fork would
   produce. If the address is off by exactly one nonce increment, this is the
   likely cause. See §F.3.

4. **Validation** (only on Strategy A match):
   ```
   cast codesize $SUCCINCT_IMPL_ADDR -r $RPC_URL
   cast call $SUCCINCT_IMPL_ADDR "version()(string)" -r $RPC_URL
   cast call $SUCCINCT_IMPL_ADDR "gameType()(uint32)" -r $RPC_URL
   cast call $SUCCINCT_IMPL_ADDR "anchorStateRegistry()(address)" -r $RPC_URL
   ```
   Apply network-conditional ASR assertion (see below).

#### Strategy B — setCodeAtAddress fallback

Used when Strategy A is not possible (missing config, build failure, address
mismatch) OR when `NETWORK=chaos` (no proposal exists for chaos).

**Steps**:
1. **Warn the user** that the alternative route is being taken:
   ```
   WARN: Using setCodeAtAddress fallback for Succinct impl.
   Reason: <inherited from Strategy A failure or precondition miss>.
   The bytecode will be copied from upstream RPC, not built locally.
   ```

2. Determine source address:
   - If `$SUCCINCT_PROPOSAL_ADDR` is set (sepolia/mainnet): use it as both
     source and target — copy bytecode from upstream to the proposal address.
   - If `$SUCCINCT_PROPOSAL_ADDR` is empty (chaos): use `$SUCCINCT_IMPL_ADDR`
     from CONTEXT_BLOCK (T01 grep from exec script).

3. Copy bytecode:
   ```
   SOURCE_ADDR=<resolved per step 2>
   CODE=$(cast code $SOURCE_ADDR -r $UPSTREAM_RPC_URL)
   [ -z "$CODE" ] || [ "$CODE" = "0x" ] && exit 1
   cast rpc anvil_setCode $SOURCE_ADDR "$CODE" -r $RPC_URL
   ```

4. If `$SUCCINCT_PROPOSAL_ADDR` differs from `$SUCCINCT_IMPL_ADDR`: update
   `SUCCINCT_IMPL_ADDR=$SUCCINCT_PROPOSAL_ADDR` in evidence so the
   orchestrator can mutate CONTEXT_BLOCK.

5. Set `SUCCINCT_DEPLOY_STRATEGY=setcode`.

6. **Validation** (same as Strategy A step 4):
   ```
   cast codesize $SUCCINCT_IMPL_ADDR -r $RPC_URL
   cast call $SUCCINCT_IMPL_ADDR "version()(string)" -r $RPC_URL
   cast call $SUCCINCT_IMPL_ADDR "gameType()(uint32)" -r $RPC_URL
   cast call $SUCCINCT_IMPL_ADDR "anchorStateRegistry()(address)" -r $RPC_URL
   ```

#### Network-conditional ASR assertion (both strategies)

- `NETWORK=mainnet`: FAIL if ASR ≠ `0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d`
  (this is the deterministic CREATE2 post-v4 ASR on mainnet, and
  `EXPECTED_NEW_ASR` in the CONTEXT_BLOCK).
- `NETWORK=sepolia|chaos`: DO NOT assert a specific ASR. Record the value as
  evidence `succinct_baked_asr=<addr>`; the orchestrator compares it at T20
  against the dynamically-discovered post-v4 ASR there. `EXPECTED_NEW_ASR` is
  empty on non-mainnet runs.

#### Codesize expectations

- `NETWORK=mainnet`: expect `9033` (real mainnet Succinct impl). On Strategy A
  the forge-deployed contract may have slightly different codesize if the repo
  version diverges — record actual and do NOT hard-fail on mismatch; flag as
  WARNING.
- `NETWORK=sepolia|chaos`: report `codesize=<actual>`, do NOT assert a fixed
  number.

Tier: `sonnet`.

**Evidence (Mode A, Strategy A success)**:
`strategy=deploy; agg_vkey=<val>; range_vkey=<val>; deployed_addr=<addr>;
proposal_match=true; SUCCINCT_IMPL_ADDR=<addr>; codesize=<N>;
version="2.0.0"; gameType=42; asr=<addr>; SUCCINCT_DEPLOY_STRATEGY=deploy`.

**Evidence (Mode A, Strategy B fallback)**:
`strategy=setcode; fallback_reason=<reason>; SUCCINCT_IMPL_ADDR=<addr>;
codesize=<N>; version="2.0.0"; gameType=42; succinct_baked_asr=<addr>;
SUCCINCT_DEPLOY_STRATEGY=setcode`.

**Evidence (Mode B)**: `SKIP: Mode B — Succinct impl already on-chain`.

### §5.11 — T11 CP0.1 post-deploy baseline queries

**Task**: run every query in §APPENDIX C — CP0 ROW SET. Pre-v4 state on production
contracts (Isthmus versions) + verify OPCM_V4/OPCM_V5/SUCCINCT_IMPL have code.

**Sepolia OLD_CSC note**: on sepolia at the pre-impls fork block, the SystemConfig
may be version 2.5.0 which does NOT expose `superchainConfig()`. In this case,
record `OLD_CSC=N/A (SystemConfig version lacks superchainConfig() accessor)` as
evidence. The v4 upgrade introduces the accessor, so NEW_CSC will be discovered
at T20. The CP0.2 table should record this as a baseline observation, not a FAIL.

Tier: `sonnet`.

**Evidence**: labelled snapshot block with each query and its raw output.

### §5.12 — T12 CP0.2 PASS/FAIL table

**PRECONDITION**: T11 STATUS=PASS (queries ran).
**PRIOR_EVIDENCE**: T11 snapshot (required in dispatch prompt).

**Task**: Render a markdown table:
```
| Check | Expected | Actual | Status |
```
Rows (network-conditional — pick the row for the current NETWORK/MODE):
- OPCM v4 codesize > 0
- OPCM v5 codesize > 0
- Succinct impl codesize:
  - `NETWORK=mainnet, MODE=A, SUCCINCT_DEPLOY_STRATEGY=setcode`: == 9033
  - `NETWORK=mainnet, MODE=A, SUCCINCT_DEPLOY_STRATEGY=deploy`: > 0 (may differ from 9033; record actual)
  - `NETWORK=mainnet, MODE=B`: > 0
  - `NETWORK=sepolia|chaos`: > 0 (record actual)
- Succinct baked ASR:
  - `NETWORK=mainnet`: == `0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d`
  - `NETWORK=sepolia|chaos`: record actual (asserted at T20 vs discovered NEW_ASR)
- SystemConfig.owner == ProxyAdminOwner (§APPENDIX B)
- PermissionedGame(1).version == "1.4.1"
- SystemConfig.superchainConfig: **mainnet** assert == `0xa440975E5A6BB19Bc3Bee901d909BB24b0f43D33` (literal OLD_CSC). **sepolia/chaos**: record the value as OLD_CSC baseline (evidence only — the assertion happens at CP1 via `NEW_CSC ≠ OLD_CSC`).
- Safe thresholds (Mode A only): mainnet all == 2; sepolia Parent == 2, cLabs == 1, Council == 1 (mock-sepolia.sh does NOT inject mocked signers); chaos == 1

Any FAIL → `STATUS: FAIL`; orchestrator STOPs the pipeline and jumps to T41 cleanup.
Tier: `haiku`.

**Evidence**: full markdown table + `STATUS: PASS | FAIL`.

### §5.13 — T13 CP0.3 x-ray offer

**Task**: The subagent merely constructs the offer text — it does NOT ask the user
and does NOT call `mcp_question`. Return the text as evidence so the orchestrator can
either relay it via `mcp_question` (interactive) or print the headless ack
(autonomous).
Tier: `haiku`.

**Evidence (interactive)**:
```
X-Ray Offer (CP0): Open http://localhost:$XRAY_PORT (Localhost tab) and verify post-deploy
baseline? Options: [Continue to Phase 3] [Open x-ray first] [Stop pipeline]
```

**Evidence (autonomous)**:
```
X-Ray Offer (CP0, headless): At CP0 I would normally offer the dashboard. Skipping
interactive offer; execution mode is autonomous. Proceeding.
```

### §5.14 — T14 CP0.4 checkpoint gate

**Task**: NO subagent — the orchestrator itself runs this TODO.
- **Interactive**: the orchestrator MUST call `mcp_question` with the options from
  §5.13 evidence AND must include the PASS/FAIL table from T12 in the question body.
  Do not advance until the user selects "Continue".
- **Autonomous**: proceed only if T12 status was PASS; otherwise FAIL the pipeline and
  jump to T41 cleanup.
Tier: n/a.

**Evidence**: the `mcp_question` response value (interactive) OR `autonomous_proceed_pass` (autonomous).

### §5.15 / §5.16 / §5.17 — T15..T17 Sign v4 / v5 / succ-v2 (Mode A mainnet+sepolia only)

**PRECONDITION**: T14 gate completed (CP0 PASS).

**Task (Mode A, NETWORK ∈ {mainnet, sepolia})**:
```
cd $CELO_SUPERCHAIN_OPS
export LOCAL_RPC_URL=$RPC_URL
export ${NETWORK^^}_RPC_URL=$RPC_URL   # e.g. SEPOLIA_RPC_URL — some sign scripts read this
SKIP_SIGNER_CHECK=1 NETWORK=$NETWORK TEST_PK=0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8 just sign <ver> clabs
SKIP_SIGNER_CHECK=1 NETWORK=$NETWORK TEST_PK=0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592 just sign <ver> clabs
SKIP_SIGNER_CHECK=1 NETWORK=$NETWORK TEST_PK=0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996 just sign <ver> council
SKIP_SIGNER_CHECK=1 NETWORK=$NETWORK TEST_PK=0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9 just sign <ver> council
```
Note: `SKIP_SIGNER_CHECK=1` is required on sepolia because the mocked TEST_PK
addresses are not registered as Safe owners on the local fork (sepolia uses
pre-signed signatures in `exec-jovian-sepolia.sh`, so the CeloSuperchainOps signing
step produces artifacts but the exec script ignores them in favor of hardcoded sigs).
On mainnet, `SKIP_SIGNER_CHECK=1` may also be needed depending on the CSCOps version.
`<ver>` = `v4` (T15), `v5` (T16), `succ-v2` (T17) — this is the CSCOps `just`
recipe name and is uniform across networks. Note the downstream exec version
string differs: on **mainnet** `exec-mocked.sh` / `exec-jovian.sh` take
`VERSION=succ-v2`; on **sepolia/chaos** `exec-jovian-sepolia.sh` takes
`succinct-v2` as the positional argument (see §B.4b "Sepolia naming"). The CSCOps
sign step always uses `succ-v2`; do not substitute.

**Task (Mode A, NETWORK=chaos)**: `STATUS: SKIP` with evidence
`SKIP: chaos uses flat Safe, no nested CSCOps signing`.

**Task (Mode B)**: `STATUS: SKIP` with evidence
- T15: `SKIP: Mode B — real sigs at secrets/.env.signers.v4`
- T16: `SKIP: Mode B — real sigs at secrets/.env.signers.v5`
- T17: `SKIP: Mode B — real sigs at secrets/.env.signers.succinct200`

Tier: `sonnet`.

**Evidence (Mode A mainnet/sepolia)**: `signed: <ver> clabs×2 council×2; exit_code=0`
**Evidence (chaos)**: `SKIP: chaos flat Safe`
**Evidence (Mode B)**: `SKIP: Mode B — real sigs at secrets/.env.signers.<version>`

### §5.18 — T18 Simulate v4 via SuperchainOps (REQUIRED)

**PRECONDITION**: T14 (CP0.4 gate) completed; T17 (sign succ-v2) completed (Mode A) OR
T17 was SKIP (Mode B / chaos).

**Task**:
1. Pre-flight: SCOps repo exists; `mise` installed; task directory resolves per
   network:
   - `NETWORK=mainnet`: `$SUPERCHAIN_OPS/src/tasks/eth/048-opcm-upgrade-v410-celo/`
   - `NETWORK=sepolia`: `$SUPERCHAIN_OPS/src/tasks/sep/074-opcm-upgrade-v410-celo-sepolia/`
     (top-level `sep/`, NOT `eth/sep/`; task number is 074, not 048)
   - `NETWORK=chaos`: no SCOps task exists → `STATUS: SKIP` with reason
     `SKIP: chaos has no SuperchainOps task directories`.
2. `export LOCAL_RPC_URL=$RPC_URL`
3. `cd <task dir> && eval "$(mise activate bash)" && SIMULATE_WITHOUT_LEDGER=1 ./simulate.sh`
4. Capture the Tenderly link from stdout.

**Skip only if**: pre-flight fails for a documented reason (chaos network, SCOps
not cloned, mise missing, task dir missing). Then `STATUS: SKIP` with the reason.
Do NOT skip for convenience.

**Runtime failure vs pre-flight**: if the simulation RUNS but reverts (e.g. OPCM not
at expected address, contract call failure), that is `STATUS: FAIL`, NOT `SKIP`.
The orchestrator should fix the root cause (e.g. clone OPCM to expected address)
and re-dispatch T18. Only pre-flight issues (directory missing, tool missing) are
valid SKIP reasons.
Tier: `sonnet`.

**Evidence (PASS)**: `simulate: PASS; tenderly_link=<url>`
**Evidence (SKIP)**: `SKIP: <reason>`

### §5.19 — T19 Execute v4

**PRECONDITION**: T12 STATUS=PASS AND T14 gate completed AND T18 STATUS=PASS|SKIP.

**Exec script selection**:
- `NETWORK=mainnet, MODE=A`: `./exec-mocked.sh` (VERSION env)
- `NETWORK=mainnet, MODE=B`: `./exec-jovian.sh v4`
- `NETWORK=sepolia|chaos`, both modes: `./exec-jovian-sepolia.sh v4` (uses
  hardcoded sigs; mock-sepolia.sh pre-setup is compatible)

**Sepolia Mode A — OPCM address cloning prerequisite**:
`exec-jovian-sepolia.sh` hardcodes TARGET_ADDRESS per version (these are the real
sepolia OPCM addresses). In Mode A with a pre-impls fork, the bootstrapped OPCMs
are at different addresses. Before T19 dispatch, the T19 subagent MUST:
1. Read the hardcoded `TARGET_ADDRESS` from exec-jovian-sepolia.sh for the version.
2. Check if code exists at that address: `cast codesize $TARGET_ADDRESS -r $RPC_URL`.
3. If codesize == 0: clone the bootstrapped OPCM bytecode to the target address:
   `CODE=$(cast code $OPCM_V4 -r $RPC_URL) && cast rpc anvil_setCode $TARGET_ADDRESS "$CODE" -r $RPC_URL`
   (The OPContractsManager uses Solidity immutables baked into bytecode, not storage
   slots, so bytecode-only copy is sufficient.)
4. Verify: `cast codesize $TARGET_ADDRESS -r $RPC_URL` must be > 0.
Same applies to T25 (v5) with `$OPCM_V5`, and the pre-signed signatures in the
exec script are tied to these hardcoded addresses so they CANNOT be changed.

**Task (Mode A mainnet)**:
```
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=$RPC_URL VERSION=v4 PK=<real DEPLOYER_PK> SENDER=$SENDER \
SIGNER_1_PK=0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8 \
SIGNER_2_PK=0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592 \
SIGNER_3_PK=0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996 \
SIGNER_4_PK=0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9 \
./exec-mocked.sh
```

**Task (Mode B mainnet)**:
```
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=$RPC_URL PK=<real DEPLOYER_PK> ./exec-jovian.sh v4
```

**Task (sepolia/chaos)**:
```
cd $CELO_ROOT/packages/op-tooling/exec
RPC_URL=$RPC_URL NETWORK=$NETWORK PK=<real DEPLOYER_PK> ./exec-jovian-sepolia.sh v4
```

Grep for `Tx executed` / `status 1 (success)`. Tier: `sonnet`.

**Evidence**: `tx_status=success; tx_hash=0x<...>` (redact neither — tx hashes are
public chain data).

### §5.20 — T20 CP1.1 post-v4 queries

**PRECONDITION**: T19 STATUS=PASS.

**Task**: Run every query in §APPENDIX C — CP1 ROW SET. Discover `$NEW_CSC`,
`$NEW_ASR` dynamically via `SystemConfig.superchainConfig()` and
`PermissionedGame.anchorStateRegistry()`. Read EIP-1967 impl slot of $NEW_ASR.
After this TODO completes, the orchestrator MUST mutate CONTEXT_BLOCK per §3.2
to set `NEW_CSC` and `NEW_ASR` to the discovered values before dispatching T21.

**Nonce expectations**: pull from §B.8 row matching `NETWORK + MODE`. Do NOT
hardcode mainnet Mode A values on other scenarios.

Tier: `sonnet`.

**Evidence**: `NEW_CSC=<addr>; NEW_ASR=<addr>; PG_version=1.7.0; Parent_nonce=<§B.8>; cLabs_nonce=<§B.8>; Council_nonce=<§B.8>`. On chaos, `SAFE_NONCE=<§B.8>` instead of three nonces.

### §5.21 — T21 CP1.2 PASS/FAIL table

**Task**: render the table with every row from the §APPENDIX C — CP1 expected set.
Must include $NEW_CSC ≠ OLD_CSC, $NEW_ASR ≠ OLD_ASR, CSC version = `1.0.0-celo`,
CSC guardian = cLabs Safe, PG version = `1.7.0`, nonces as above.
Tier: `haiku`. **Evidence**: markdown table + overall PASS/FAIL.

### §5.22 / §5.23 — T22/T23 CP1 x-ray offer + gate

Same shape as T13 / T14 with CP1 wording.

### §5.24 — T24 Simulate v5 (REQUIRED)

**PRECONDITION**: T19 STATUS=PASS AND T23 gate completed. v5 simulation queries
post-v4 chain state (v5's OPCM calls `SystemConfig.l2ChainId()` which only exists
post-v4) — running it before T19 reverts.

Same shape as T18 but the task dir is `049-opcm-upgrade-v500-celo` (mainnet) or
`075-opcm-upgrade-v500-celo-sepolia` (sepolia) under the network-appropriate
`eth/` (mainnet) or `sep/` (sepolia) parent. Chaos → SKIP.
Tier: `sonnet`.

**Evidence (PASS)**: `simulate: PASS; tenderly_link=<url>`
**Evidence (SKIP)**: `SKIP: <reason>`

### §5.25 — T25 Execute v5

**PRECONDITION**: T21 STATUS=PASS AND T23 gate completed AND T24 STATUS=PASS|SKIP.

Same shape as T19 with `VERSION=v5` / `exec-jovian.sh v5` / `exec-jovian-sepolia.sh v5`.
Tier: `sonnet`.

**Evidence**: `tx_status=success; tx_hash=0x<...>`.

### §5.26 — T26 CP2.1 post-v5 queries

**PRECONDITION**: T25 STATUS=PASS.

**Task**: APPENDIX C — CP2 ROW SET. Verify PG impl address changed from CP1, ASR
address stayed the same (== NEW_ASR from T20), SC owner still ProxyAdminOwner.
Nonces pulled from §B.8 row for NETWORK+MODE.
Tier: `sonnet`.

**Evidence**: `PG_version=1.8.0; PG_impl_changed=true; ASR_same=true; SC_owner=ProxyAdminOwner; Parent_nonce=<§B.8>; cLabs_nonce=<§B.8>; Council_nonce=<§B.8>`.

### §5.27 / §5.28 / §5.29 — T27/T28/T29 CP2 table/x-ray/gate

Same shape as CP1.

### §5.30 — T30 Execute succ-v2

**PRECONDITION**: T27 STATUS=PASS AND T29 gate completed.

**Version string by network**:
- `NETWORK=mainnet`: `VERSION=succ-v2` / `./exec-jovian.sh succ-v2`
- `NETWORK=sepolia|chaos`: `./exec-jovian-sepolia.sh succ-v2` (the script's `case`
  statement accepts `succ-v2`, NOT `succinct-v2` — verify by checking line ~6 of
  `exec-jovian-sepolia.sh` before dispatch)

Same exec-script shape as T19 with the correct version string. Tier: `sonnet`.

**Evidence**: `tx_status=success; tx_hash=0x<...>`.

### §5.31 — T31 CP3.1 post-succ-v2 queries

**PRECONDITION**: T30 STATUS=PASS.

**Task**: APPENDIX C — CP3 ROW SET. **Critical invariant**:
`OPSuccinctGame.anchorStateRegistry()` MUST equal `$NEW_ASR` from T20's evidence
(NOT the old ASR from §B.4/§B.4b). `SystemConfig.owner` MUST be cLabs Safe
(§B.3 row for NETWORK). Nonces from §B.8 row for NETWORK+MODE.

Tier: `sonnet`.

**Evidence**: `SG_ASR=<value == NEW_ASR from T20>; SG_version=2.0.0; SC_owner=<CLABS_SAFE>; Parent_nonce=<§B.8>; cLabs_nonce=<§B.8>; Council_nonce=<§B.8>`.

**CP3 FAIL guard**: if `SG_ASR` equals the pre-v4 ASR (`OLD_ASR` from CONTEXT_BLOCK),
STATUS: FAIL. Root cause: stale Succinct bytecode at T10 (Mode A) or upstream RPC
returned wrong code. Recovery: cleanup via T41 and re-fork from scratch. Do NOT
attempt in-place recovery.

### §5.32 / §5.33 / §5.34 — T32/T33/T34 CP3 table/x-ray/gate

Same shape as CP1/CP2. If SG_ASR equals old ASR (`0x9F18...`) → PIPELINE FAIL; the
fix is to re-fork from scratch and use the `anvil_setCode` path at T10.

### §5.35 — T35 Phase 7 final comparison

**Task**: produce a single markdown table:
```
| Contract | CP0 | CP1 | CP2 | CP3 |
|---|---|---|---|---|
| SystemConfig | initial | v4.1.0 | v5.0.0 | v5.0.0 |
| OptimismPortal | initial | v4.1.0 | v5.0.0 | v5.0.0 |
| L1StandardBridge | initial | v4.1.0 | v5.0.0 | v5.0.0 |
| L1CrossDomainMessenger | initial | v4.1.0 | v5.0.0 | v5.0.0 |
| L1ERC721Bridge | initial | v4.1.0 | v5.0.0 | v5.0.0 |
| OptimismMintableERC20Factory | initial | v4.1.0 | v5.0.0 | v5.0.0 |
| DisputeGameFactory | initial | v4.1.0 | v5.0.0 | v5.0.0 |
| AnchorStateRegistry | initial | v4.1.0 | v4.1.0* | v4.1.0* |
| ProtocolVersions | initial | initial* | v5.0.0 | v5.0.0 |
| PermissionedGame(1) | 1.4.1 | 1.7.0 | 1.8.0 | 1.8.0 |
| OPSuccinctGame(42) | 1.0.0/none | 1.0.0/none | 1.0.0/none | 2.0.0 |
| MIPS(singleton) | initial | v4 | v5 | v5 |
```
`*` = same impl reused from prior phase.
Tier: `haiku`.

**Evidence**: table above.

### §5.36 — T36 Phase 8 basefee (Mode B only if INCLUDE_BASEFEE=yes; else SKIP)

**PRECONDITION**: T32 (CP3.2) STATUS=PASS; T34 gate completed.

**Task (Mode B, INCLUDE_BASEFEE=yes)**:
1. Verify cLabs Safe still has real 6-of-8 (`getThreshold()(uint256)` == 6 AND
   `getOwners()(address[]).length` == 8) — else FAIL ("mocked Safe, Mode A state").
2. Verify `$CELO_ROOT/secrets/.env.signers.basefee` exists (T02 should have already
   checked when INCLUDE_BASEFEE=yes) — else FAIL with
   "decrypt first via `./scripts/key_placer.sh decrypt`".
3. `cd $CELO_ROOT/packages/op-tooling/exec && PK=<real DEPLOYER_PK> RPC_URL=$RPC_URL ./exec-basefee.sh`.
Grep for `status 1 (success)`.

**Task (Mode A OR INCLUDE_BASEFEE=no)**: `STATUS: SKIP` with verbatim reason per
§5.SKIP-POLICY. The SKIP still emits a subagent dispatch — it's a one-liner but it
happens, so silent skipping is impossible.

Tier: `sonnet`.

**Evidence (execute)**: `basefee_status=success; tx_hash=<0x...>`
**Evidence (SKIP Mode A)**: `SKIP: Mode A incompatible (cLabs mocked 2-of-2; basefee needs real 6-of-8)`
**Evidence (SKIP INCLUDE_BASEFEE=no)**: `SKIP: INCLUDE_BASEFEE=no`

### §5.37 — T37 CP4.1 post-basefee queries

**PRECONDITION**: T36 STATUS=PASS (not SKIP).

**Task (if T36 PASS)**: run APPENDIX C CP4 ROW SET.
**Task (if T36 SKIP)**: `STATUS: SKIP` with reason `SKIP: T36 was SKIP (<inherit T36 reason>)`.
Tier: `sonnet`.

**Evidence (PASS)**: labelled snapshot — `minBaseFee=<n>; daFootprintGasScalar=<n>;
SC_owner=<addr>; SC_version=<unchanged>; Parent_nonce=<n>; cLabs_nonce=<n>; Council_nonce=<n>`.
**Evidence (SKIP)**: `SKIP: inherited from T36`.

### §5.38 — T38 CP4.2 PASS/FAIL table

**PRECONDITION**: T37 completed (PASS or SKIP).

**Task (if T37 PASS)**: render markdown table with rows:
- `minBaseFee == 25000000000`
- `daFootprintGasScalar == 1`
- `SystemConfig.owner == CLABS_SAFE` (unchanged from CP3)
- `SystemConfig.version` unchanged from CP3
- `cLabs nonce` == CP3 cLabs_nonce + 1
- `Parent nonce` == CP3 Parent_nonce (unchanged)
- `Council nonce` == CP3 Council_nonce (unchanged)

**Task (if T37 SKIP)**: `STATUS: SKIP` with reason inherited from T37.
Tier: `haiku`.

**Evidence (PASS)**: full markdown table + `STATUS: PASS | FAIL`.
**Evidence (SKIP)**: `SKIP: inherited from T37`.

### §5.39 — T39 CP4.3 x-ray offer

**PRECONDITION**: T38 completed.

**Task (if T38 PASS)**: construct offer text (subagent does NOT call `mcp_question`):
- Interactive variant:
  `X-Ray Offer (CP4): Open http://localhost:$XRAY_PORT and verify post-basefee state?
   Options: [Continue to cleanup] [Open x-ray first] [Stop pipeline]`
- Autonomous variant:
  `X-Ray Offer (CP4, headless): At CP4 I would normally offer the dashboard. Skipping
   interactive offer; execution mode is autonomous. Proceeding.`

**Task (if T38 SKIP)**: `STATUS: SKIP` with reason inherited.
Tier: `haiku`.

**Evidence**: offer text verbatim OR SKIP message.

### §5.40 — T40 CP4.4 checkpoint gate (ORCHESTRATOR-ONLY)

**PRECONDITION**: T39 completed.

**NO subagent.** Orchestrator action per §1.1 rule 5b and §1.4.
- **Interactive**: call `mcp_question` with T38's PASS/FAIL table in the body AND
  T39's offer text as options. Advance only on "Continue to cleanup".
- **Autonomous**: proceed if T38 STATUS=PASS; record evidence
  `autonomous_proceed_pass`. If T38=FAIL → jump to T41. If T38=SKIP → record
  `autonomous_proceed_skip: <reason>` and continue to T41.

**Evidence**: mcp_question response value OR autonomous decision line.

### §5.41 — T41 Cleanup

**PRECONDITION**: reached from T40 gate OR from any earlier FAIL/abort path
(per §1.1 rule 7 every exit path lands here).

**Task**:
```
# Anvil
if [ -f /tmp/anvil-$RPC_PORT.pid ]; then
  kill $(cat /tmp/anvil-$RPC_PORT.pid) 2>/dev/null || true
  rm -f /tmp/anvil-$RPC_PORT.pid
fi
# X-ray dashboard
if [ -f /tmp/xray-$RPC_PORT.pid ]; then
  kill $(cat /tmp/xray-$RPC_PORT.pid) 2>/dev/null || true
  rm -f /tmp/xray-$RPC_PORT.pid
fi
pkill -f "python3 -m http.server $XRAY_PORT" 2>/dev/null || true
# Git worktree cleanup (from §2.5 single-repo v5 build)
if [ -d /tmp/optimism-v5 ]; then
  git -C $OP_ROOT_V4 worktree remove /tmp/optimism-v5 --force 2>/dev/null || true
fi
# Port checks
lsof -ti:$RPC_PORT  >/dev/null 2>&1 && echo "WARN: anvil port busy"  || echo "anvil port free"
lsof -ti:$XRAY_PORT >/dev/null 2>&1 && echo "WARN: xray port busy"   || echo "xray port free"
```
Preserve `/tmp/anvil-$RPC_PORT.log` and `/tmp/xray-$RPC_PORT.log` for post-mortem.
After T41 completes successfully, the orchestrator marks T00 `completed` (T00 has
been `pending` since run start per §1.1 rule 6).
Tier: `haiku`.

**Evidence**: `anvil_killed=true; xray_killed=true; rpc_port_free=true; xray_port_free=true; worktree_cleaned=true|N/A; logs_preserved=/tmp/anvil-$RPC_PORT.log,/tmp/xray-$RPC_PORT.log`.

### §5.42 — T42 Cleanup gate (ORCHESTRATOR-ONLY)

**NO subagent.** Orchestrator action per §1.1 rule 5b and §1.4.
- **Interactive**: `mcp_question` with `"Cleanup complete. Anvil killed, x-ray killed,
  both ports verified free. Confirm pipeline end."` options `[Confirmed]`, `[Port still busy]`.
- **Autonomous**: print final one-line summary `Jovian pipeline ${status}; cleanup OK`.

**Evidence**: `mcp_question` response value OR final summary line.

### §5.SKIP-POLICY — universal rules for SKIP TODOs

Every TODO that is eligible for SKIP status MUST:
1. **Still dispatch a subagent** (or be orchestrator-only per §1.4). Silent skipping
   is forbidden.
2. **Return STATUS: SKIP** with a **prescribed verbatim evidence string**. The skill
   lists these strings in each card. If a card doesn't list one, use
   `SKIP: <TODO subject> — <one-line reason>`.
3. **Inherit reasons downstream** when a later TODO depends on an earlier SKIP
   (e.g. T37/T38/T39/T40 inherit from T36 when basefee is skipped).
4. **Never silently mutate CONTEXT_BLOCK**. A SKIP TODO produces no new dynamic slot
   values (OPCM_V4/V5/NEW_CSC/NEW_ASR stay whatever the alternative path provided).

---

## §6 CHECKPOINT DISCIPLINE (why four TODOs per checkpoint)

A checkpoint is NOT a single thing. Collapsing it into one step loses the guarantees
you need. The four-TODO split exists because each sub-step has a distinct risk:

- `.1 queries` — the only place the subagent touches chain state; isolates bash.
- `.2 table` — formats deterministic PASS/FAIL so the orchestrator can scan it without
  re-interpreting raw cast output.
- `.3 x-ray offer` — captures the textual offer so it cannot be silently dropped.
- `.4 gate` — creates an actual turn boundary via `mcp_question` (interactive) or a
  documented autonomous decision.

If you try to run `.3` and `.4` in the same subagent you lose the `mcp_question`
turn boundary. If you merge `.1` and `.2` you lose the raw-query audit trail. Do not
merge them.

### §6.1 X-ray — ALWAYS on the list

The x-ray TODOs (T13 CP0.3, T22 CP1.3, T28 CP2.3, T33 CP3.3, T39 CP4.3) are
**never removed** and **never merged** with their neighbours. Each is a subagent
dispatch that constructs offer text only; the subagent does NOT call `mcp_question`
— that is the orchestrator's job in the matching gate TODO (T14/T23/T29/T34/T40).
If you feel pressure to "save time", that is the exact failure mode this skill
is designed to prevent.

### §6.2 Simulations — ALWAYS on the list

T18 (sim v4) and T24 (sim v5) are mandatory. A `STATUS: SKIP` is permitted ONLY with
a documented pre-flight reason (chaos network, missing SCOps repo, missing `mise`,
missing task directory). "I decided it wasn't needed" is a binding violation.

### §6.3 Confirmation gates — ALWAYS on the list

T14, T23, T29, T34, T40 and T42 are the ONLY places the orchestrator itself calls
`mcp_question` (interactive) or prints the autonomous proceed-line. They are hard
turn boundaries. NO subagent is dispatched for them (per §1.4 and §1.1 rule 5b).
Their evidence is the orchestrator's own decision text. Never collapse them into an
earlier TODO.

---

## §7 DISPATCH TEMPLATE (copy-paste ready)

When dispatching TODO `T<NN>`:

```
Task(
  subagent_type="oh-my-claudecode:executor",
  model="<tier from card>",
  description="Jovian T<NN> <short subject>",
  prompt="""
SAFETY: localhost only. No retries. Fail fast. Never target a real network.
CONTEXT_BLOCK contains real secrets (DEPLOYER_PK, UPSTREAM_RPC_URL). Use them for
the bash commands in this card. In your evidence report, redact DEPLOYER_PK as
`0x***` and UPSTREAM_RPC_URL as `<upstream-archive>`.

=== CONTEXT_BLOCK ===
<paste the full CONTEXT_BLOCK verbatim, with all §3.2 dynamic slots filled as of now>
=== END CONTEXT_BLOCK ===

=== PRIOR_EVIDENCE (only for TODOs whose card body references another TODO's output) ===
<TODO id>: <verbatim evidence block>
=== END PRIOR_EVIDENCE ===

TODO: T<NN>
CARD: §5.<NN> — <card title>

TASK:
<copy the card body from §5.<NN>, with $VARIABLES already expanded against the
current CONTEXT_BLOCK — no placeholder text>

REQUIRED EVIDENCE (return labelled, verbatim, in your final report):
<copy the card evidence list for the branch your task takes: PASS, FAIL or SKIP>

OUTPUT FORMAT:
---
TODO: T<NN>
STATUS: PASS | FAIL | SKIP
EVIDENCE:
  <labelled evidence>
NEXT: <one sentence>
---

Rules:
- Do NOT attempt recovery on failure. Report FAIL with exact error.
- Do NOT run additional steps beyond this card.
- Do NOT call mcp_question — only the orchestrator can.
- Do NOT print raw DEPLOYER_PK or UPSTREAM_RPC_URL in evidence.
- Tier: <tier>.
"""
)
```

### §7.1 When PRIOR_EVIDENCE is required

The following cards consume evidence from an earlier TODO:

| TODO    | Consumes            | Why                                                         |
| ------- | ------------------- | ----------------------------------------------------------- |
| T12     | T11 (CP0.1)         | Build the PASS/FAIL table                                   |
| T21     | T20 (CP1.1)         | Build CP1 table + extract NEW_CSC/NEW_ASR                  |
| T27     | T26 (CP2.1)         | Build CP2 table + compare to T20                            |
| T32     | T31 (CP3.1)         | Build CP3 table + compare to T20                            |
| T35     | T11, T20, T26, T31  | Final CP0..CP3 progression comparison                       |
| T37     | T36 (Phase 8 exec)  | Pick PASS vs SKIP branch; SKIP reason inherits             |
| T38     | T37 (CP4.1) AND T32 (CP3.2) | Build CP4 table; rows compare against CP3 baseline |
| T14/23/29/34/40 | T12/T21/T27/T32/T38 | Orchestrator gates need the PASS/FAIL table (passed into `mcp_question` body, not a Task dispatch) |

For all other cards, `PRIOR_EVIDENCE` may be omitted.

---

## §APPENDIX A — References to existing docs

- Project ecosystem overview (safes, build reqs, dependency map): `.agent/AGENT.md`
  §"Jovian Upgrade Ecosystem". Read this ONCE at the start of the run.
- Exec script details: `packages/op-tooling/exec/README.md`.
- Fork/mock details: `packages/op-tooling/fork/README.md`.
- Verify details: `packages/op-tooling/verify/README.md`.
- X-ray details: `packages/op-tooling/x-ray/README.md`.

Do not duplicate these into subagent prompts; reference the file paths instead.

---

## §APPENDIX B — Network reference (addresses, blocks, signers)

### B.1 Fork blocks

| Network | Mode A (pre-impls) | Mode B (post-impls) |
| ------- | ------------------ | ------------------- |
| mainnet | `24699169`         | `24742240`          |
| sepolia | `10459393`         | `10462786`          |
| chaos   | `10382100`         | `10382216`          |

Aliases accepted at T01: `oldest block`, `pre-impls`, `mode-a block` → Mode A row.
`post-impls`, `mode-b block`, `impls-deployed` → Mode B row. After normalisation,
block must match declared MODE or fail.

### B.2 Chain IDs

- mainnet → `FORK_CHAIN_ID=1`
- sepolia, chaos → `FORK_CHAIN_ID=11155111`

### B.3 Safe addresses

| Role          | Mainnet                                      | Sepolia                                      | Chaos                                        |
| ------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| Parent Safe   | `0x4092A77bAF58fef0309452cEaCb09221e556E112` | `0x009A6Ac23EeBe98488ED28A52af69Bf46F1C18cb` | `0x6F8DB5374003c9ffa7084d8b65c57655963766a9` |
| cLabs Safe    | `0x9Eb44Da23433b5cAA1c87e35594D15FcEb08D34d` | `0x769b480A8036873a2a5EB01FE39278e5Ab78Bb27` | n/a                                          |
| Council Safe  | `0xC03172263409584f7860C25B6eB4985f0f6F4636` | `0x3b00043E8C82006fbE5f56b47F9889a04c20c5d6` | n/a                                          |
| Multisig (bootstrap) | `0x4092A77bAF58fef0309452cEaCb09221e556E112` | `0x5e60d897Cd62588291656b54655e98ee73f0aabF` | `0x6F8DB5374003c9ffa7084d8b65c57655963766a9` |

### B.4 Mainnet proxy addresses

| Proxy                | Address                                      |
| -------------------- | -------------------------------------------- |
| SystemConfig         | `0x89E31965D844a309231B1f17759Ccaf1b7c09861` |
| DisputeGameFactory   | `0xFbAC162162f4009Bb007C6DeBC36B1dAC10aF683` |
| OLD ASR (pre-v4)     | `0x9F18D91949731E766f294A14027bBFE8F28328CC` |
| OLD CSC (pre-v4)     | `0xa440975E5A6BB19Bc3Bee901d909BB24b0f43D33` |
| SuperchainConfig     | `0x95703e0982140D16f8ebA6d158FccEde42f04a4C` |
| Succinct impl (plant)| `0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1` |
| NEW ASR (post-v4)    | `0x8fE58d2168b5412Cf1Bd212cE6137f8b7300222d` (deterministic CREATE2 result) |

Sepolia/chaos proxy addresses → §B.4b below + `packages/op-tooling/verify/verify-versions.sh`.

### B.4b Sepolia & Chaos proxy addresses

Sourced from `packages/op-tooling/exec/exec-jovian-sepolia.sh` and
`packages/op-tooling/verify/verify-versions.sh`. Use when `NETWORK=sepolia` or `chaos`.

**Sepolia**:

| Proxy                 | Address                                                    |
| --------------------- | ---------------------------------------------------------- |
| SystemConfig          | `0x760a5F022C9940f4A074e0030be682F560d29818`              |
| DisputeGameFactory    | `0x57C45d82D1a995F1e135B8D7EDc0a6BB5211cfAA`              |
| ProxyAdmin            | `0xF7d7A3d3bb8aBb6829249B3D3aD3d525D052027e`              |
| OLD ASR (pre-v4)      | `0xD73BA8168A61F3E917F0930D5C0401aA47e269D6`              |
| OLD CSC (pre-v4)      | **capture dynamically at T11** from `SystemConfig.superchainConfig()` and store as `OLD_CSC` in CONTEXT_BLOCK. Not hardcoded. |
| SuperchainConfig      | `0x31bEef32135c90AE8E56Fb071B3587de289Aaf77`              |
| Succinct impl target  | **capture at T01** via `grep -m1 'SUCCINCT_IMPL=' $CELO_ROOT/packages/op-tooling/exec/exec-jovian-sepolia.sh` (or the `SUCCINCT_IMPL_ADDR` variable). Store as `SUCCINCT_IMPL_ADDR`. |
| EXPECTED_NEW_ASR      | empty on sepolia (discover dynamically at T20)             |

**Chaos**: flat Safe topology, no nested approval chain. Addresses:

| Proxy               | Address                                      |
| ------------------- | -------------------------------------------- |
| Flat Safe           | `0x6F8DB5374003c9ffa7084d8b65c57655963766a9` |
| SystemConfig        | `0x6baf5959cc06a39793c338e6586f49473c731b4c` |
| ProxyAdmin          | `0xb2a0c2b49cdc2d3f0a0a291be0a6c20559ec053e` |
| DisputeGameFactory  | `0x338ac809e6a045cfc8aeb16ff8a4329147b61afb` |

**Sepolia naming**: the succinct version string in `exec-jovian-sepolia.sh` is
`succ-v2` (the script's case statement on line ~6 accepts `v4|v5|succ-v2`).
T30 must pass the argument as `succ-v2` when `NETWORK=sepolia`.

**Chaos flow divergence**: on chaos the Parent/cLabs/Council nested Safe chain
does not exist. `exec-jovian-sepolia.sh` with `NETWORK=chaos` talks to the flat
Safe directly and signs with the deployer PK (who must be a Safe owner).
Consequently: T15/T16/T17 (`just sign` via CeloSuperchainOps) are not applicable
on chaos — they return SKIP with reason `SKIP: chaos uses flat Safe, no nested
signing`. CP1/CP2/CP3 nonce expectations use dynamic single-safe counters, not
the three-Safe tuple.

### B.5 Mode B OPCM addresses (no bootstrap)

- OPCM v4 mainnet: `0x5fe49eb068a4e3c52255e1f3c1273be331262842`
- OPCM v5 mainnet: `0x503c51b8de2bc78d5f83c179b786b2aa1c454635`

### B.6 SENDER addresses

- mainnet: `0x95FFAC468e37DdeEF407FfEf18f0cC9E86D8f13B`
- sepolia/chaos: read the `SENDER=` line from
  `packages/op-tooling/exec/exec-mocked.sh` or `exec-jovian-sepolia.sh`. DO NOT guess.
  The `$DEPLOYER_PK` must derive to the network's SENDER.

### B.7 Default mocked signers (Mode A)

| Slot             | Role             | Address                                      | PK                                                                   |
| ---------------- | ---------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `SIGNER_1_PK`    | cLabs Signer 1   | `0x865d05C8bB46E7AF16D6Dc99ddfb2e64BBec1345` | `0x57e639820c9154e011f46153bda6d502e1f8ebd376f87fadc1e317d3beeb10d8` |
| `SIGNER_2_PK`    | cLabs Signer 2   | `0x899a864C6bE2c573a98d8493961F4D4c0F7Dd0CC` | `0x5fb4edc777e9ad5889935f6cc0368a275be7f467b4b7eadf94cab92d667de592` |
| `SIGNER_3_PK`    | Council Signer 1 | `0x480C5f2340f9E7A46ee25BAa815105B415a7c2e2` | `0x82b0a6c773da129fc3604c6b85e68fa2c9cce0b21c3b63dd70b691e538269996` |
| `SIGNER_4_PK`    | Council Signer 2 | `0x8Af6f11c501c082bD880B3ceC83e6bB249Fa32c9` | `0x04cdae0aa51355d0bad6ec4e200138c71ca6686de3924382a048c9cbf38ddef9` |

**Ordering rule (CORRECTED)**: `mock-mainnet.sh` requires the two cLabs signer
addresses to be in ascending hex order relative to each other, AND the two Council
signer addresses to be in ascending hex order relative to each other. The four
addresses across the whole list are NOT required to be globally sorted (and are not).
Check:
- cLabs pair: `0x865d... < 0x899a...` ✓
- Council pair: `0x480C... < 0x8Af6...` ✓

When passing to `exec-mocked.sh` (T19/T25/T30): `SIGNER_1_PK`/`SIGNER_2_PK` carry
cLabs sigs, `SIGNER_3_PK`/`SIGNER_4_PK` carry Council sigs. Mapping is positional,
not by hex order.

### B.8 Expected Safe nonces per network / checkpoint

**Mainnet Mode A** (mocked-mainnet, block `24699169`):

| Checkpoint       | Parent | cLabs | Council |
| ---------------- | ------ | ----- | ------- |
| CP0 pre-v4       | 26     | 24    | 26      |
| CP1 post-v4      | 27     | 25    | 27      |
| CP2 post-v5      | 28     | 26    | 28      |
| CP3 post-succ-v2 | 29     | 27    | 29      |

**Mainnet Mode B** (real sigs, block `24742240` — impls already deployed):

| Checkpoint       | Parent | cLabs | Council |
| ---------------- | ------ | ----- | ------- |
| CP0 baseline     | (read from chain at T11) | (read) | (read) |
| CP1 post-v4      | CP0+1  | CP0+1 | CP0+1 |
| CP2 post-v5      | CP1+1  | CP1+1 | CP1+1 |
| CP3 post-succ-v2 | CP2+1  | CP2+1 | CP2+1 |
| CP4 post-basefee | unchanged | CP3+1 | unchanged |

In Mode B the absolute numbers depend on on-chain history at block 24742240. The
orchestrator captures them at T11 as `BASELINE_{PARENT,CLABS,COUNCIL}_NONCE` and
compares *deltas* in later checkpoints.

**Sepolia** (both modes; sourced from `exec-jovian-sepolia.sh` hardcoded nonces):

| Checkpoint            | Parent | cLabs | Council |
| --------------------- | ------ | ----- | ------- |
| CP0 pre-v4            | 0      | 0     | 0       |
| CP1 post-v4           | 1      | 1     | 1       |
| CP2 post-v5           | 2      | 2     | 2       |
| CP3 post-succinct-v2  | 3      | 3     | 3       |

**Chaos** (flat Safe, single nonce):

| Checkpoint            | SAFE_NONCE                          |
| --------------------- | ----------------------------------- |
| CP0 pre-v4            | (read dynamically at T11; baseline) |
| CP1 post-v4           | baseline + 1                        |
| CP2 post-v5           | baseline + 2                        |
| CP3 post-succinct-v2  | baseline + 3                        |

Cards §5.6, §5.20, §5.26, §5.31, §5.37 MUST select the row matching NETWORK + MODE.
Hardcoding the mainnet-Mode-A values on any other scenario is a binding violation.

---

## §APPENDIX C — Checkpoint query sets (compact reference)

Each checkpoint's subagent runs these exact queries. `$X` are CONTEXT_BLOCK variables.

> **Network substitution rule**: the query bodies are network-agnostic because they
> use CONTEXT_BLOCK variables populated from §B.3/§B.4 (mainnet) or §B.4b
> (sepolia/chaos). Expected values (versions, addresses) match mainnet; on sepolia/
> chaos substitute the address column from §B.4b and pull nonce expectations from
> §B.8. Version strings (`1.4.1`, `1.7.0`, `1.8.0`, `2.0.0`) are the same on every
> network. Chaos uses a single `SAFE_NONCE` read, not three separate Safe nonces.

### CP0 — Post-deploy baseline

```
cast call $SYSTEM_CONFIG "owner()(address)" -r $RPC_URL                             # → ProxyAdminOwner
cast call $SYSTEM_CONFIG "superchainConfig()(address)" -r $RPC_URL                  # → OLD_CSC
cast call $DGF "gameImpls(uint32)(address)" 1 -r $RPC_URL                           # → PERM_GAME (pre-v4)
cast call <PERM_GAME> "version()(string)" -r $RPC_URL                               # → "1.4.1"
cast call <PERM_GAME> "anchorStateRegistry()(address)" -r $RPC_URL                  # → OLD_ASR
cast call $DGF "gameImpls(uint32)(address)" 42 -r $RPC_URL                          # → pre-succ game or 0
cast codesize $OPCM_V4 -r $RPC_URL                                                  # > 0 (both modes)
cast codesize $OPCM_V5 -r $RPC_URL                                                  # > 0 (both modes)
cast codesize $SUCCINCT_IMPL_ADDR -r $RPC_URL                                       # > 0 (both modes; Strategy A may differ from 9033)
cast call $SUCCINCT_IMPL_ADDR "anchorStateRegistry()(address)" -r $RPC_URL          # → 0x8fE58d... (mainnet)
```

### CP1 — Post-v4

```
NEW_CSC=$(cast call $SYSTEM_CONFIG "superchainConfig()(address)" -r $RPC_URL)       # ≠ OLD_CSC
cast call $NEW_CSC "version()(string)" -r $RPC_URL                                  # → "1.0.0-celo"
cast call $NEW_CSC "guardian()(address)" -r $RPC_URL                                # → CLABS_SAFE
cast call $NEW_CSC "superchainConfig()(address)" -r $RPC_URL                        # → original SuperchainConfig
PERM_GAME_V4=$(cast call $DGF "gameImpls(uint32)(address)" 1 -r $RPC_URL)
cast call $PERM_GAME_V4 "version()(string)" -r $RPC_URL                             # → "1.7.0"
NEW_ASR=$(cast call $PERM_GAME_V4 "anchorStateRegistry()(address)" -r $RPC_URL)     # ≠ OLD_ASR
cast storage $NEW_ASR 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc -r $RPC_URL  # non-zero
cast call $PARENT_SAFE "nonce()(uint256)" -r $RPC_URL                               # → 27 (mainnet Mode A)
cast call $CLABS_SAFE "nonce()(uint256)" -r $RPC_URL                                # → 25
cast call $COUNCIL_SAFE "nonce()(uint256)" -r $RPC_URL                              # → 27
```

### CP2 — Post-v5

```
PERM_GAME_V5=$(cast call $DGF "gameImpls(uint32)(address)" 1 -r $RPC_URL)           # ≠ PERM_GAME_V4
cast call $PERM_GAME_V5 "version()(string)" -r $RPC_URL                             # → "1.8.0"
cast call $PERM_GAME_V5 "anchorStateRegistry()(address)" -r $RPC_URL                # == NEW_ASR from CP1
cast call $SYSTEM_CONFIG "owner()(address)" -r $RPC_URL                             # still ProxyAdminOwner
cast call $PARENT_SAFE "nonce()(uint256)" -r $RPC_URL                               # → 28
cast call $CLABS_SAFE "nonce()(uint256)" -r $RPC_URL                                # → 26
cast call $COUNCIL_SAFE "nonce()(uint256)" -r $RPC_URL                              # → 28
```

### CP3 — Post-succ-v2

```
SUCC_GAME_V2=$(cast call $DGF "gameImpls(uint32)(address)" 42 -r $RPC_URL)          # new impl
cast call $SUCC_GAME_V2 "version()(string)" -r $RPC_URL                             # → "2.0.0"
cast call $SUCC_GAME_V2 "anchorStateRegistry()(address)" -r $RPC_URL                # == NEW_ASR (NOT OLD_ASR)
cast call $SYSTEM_CONFIG "owner()(address)" -r $RPC_URL                             # → CLABS_SAFE
cast call $PARENT_SAFE "nonce()(uint256)" -r $RPC_URL                               # → 29
cast call $CLABS_SAFE "nonce()(uint256)" -r $RPC_URL                                # → 27
cast call $COUNCIL_SAFE "nonce()(uint256)" -r $RPC_URL                              # → 29
```

CP3 FAIL guard: if `SUCC_GAME_V2.anchorStateRegistry()` returns OLD_ASR, pipeline is
FAILED (bad Phase 2.3). Re-fork and use the `anvil_setCode` path.

### CP4 — Post-basefee (Mode B + INCLUDE_BASEFEE=yes only)

```
cast call $SYSTEM_CONFIG "minBaseFee()(uint256)" -r $RPC_URL                        # → 25000000000
cast call $SYSTEM_CONFIG "daFootprintGasScalar()(uint256)" -r $RPC_URL              # → 1
cast call $SYSTEM_CONFIG "version()(string)" -r $RPC_URL                            # unchanged from CP3
cast call $SYSTEM_CONFIG "owner()(address)" -r $RPC_URL                             # still CLABS_SAFE
cast call $PARENT_SAFE "nonce()(uint256)" -r $RPC_URL                               # → 29 (unchanged)
cast call $CLABS_SAFE "nonce()(uint256)" -r $RPC_URL                                # → 28 (incremented from 27)
cast call $COUNCIL_SAFE "nonce()(uint256)" -r $RPC_URL                              # → 29 (unchanged)
```

---

## §APPENDIX D — Common failure modes (fast reference)

| Symptom                                                | Root cause                                                         | Fix                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------- |
| `MOCKED_SIGNER_1 must be < MOCKED_SIGNER_2`            | signers not in ascending hex order                                 | use §B.7 defaults (already sorted)     |
| `Invalid PK` during exec                               | PK doesn't derive to network SENDER                                | §B.6                                   |
| Bootstrap `connection refused`                         | anvil not up on `$RPC_PORT`                                        | verify via `cast block-number`         |
| `revert` during exec                                   | nonce mismatch OR mock not applied                                 | re-fork + re-mock                      |
| Phase 2.3 `anvil_setCode` empty bytecode               | non-archive RPC                                                    | switch to Tenderly/archive Alchemy     |
| CP3 SG→ASR is OLD_ASR                                  | deprecated forge-deploy Phase 2.3                                  | re-fork + use `anvil_setCode`          |
| SCOps forge hangs                                      | system forge instead of mise-pinned                                | `eval "$(mise activate bash)"` first   |
| SCOps `LOCAL_RPC_URL not found`                        | not exported                                                       | `export LOCAL_RPC_URL=$RPC_URL`        |
| `setMinBaseFee` missing on SystemConfig                | v5 not yet applied                                                 | verify CP2 PASS before T36             |
| Phase 8 cLabs Safe `execTransaction` revert            | Mode A, or SC ownership not transferred                            | Mode B only; verify CP3 SC_owner=cLabs |
| T10 Strategy A address mismatch                        | Deployer nonce differs from original deployment (esp. mainnet double-deploy §F.3) | Expected; fall through to Strategy B (setCodeAtAddress) |
| T10 Strategy A `forge script` fails                    | Succinct repo not built, wrong branch, missing artifacts           | Check T02 `succinct_build` evidence; fall through to Strategy B |
| T10 Strategy A vkey mismatch                           | Wrong Succinct repo commit checked out (wrong ELFs → wrong vkeys) | Verify commit matches §F.5; checkout correct commit and rebuild |
| T10 `fetch-fdg-config` fails                           | Missing `.env.$NETWORK`, RPC access denied, or repo access issue   | Fall through to Strategy B; operator resolves access separately |
| T10 Strategy B empty bytecode from upstream             | Non-archive RPC or contract not yet deployed on target network     | Switch to Tenderly / archive Alchemy RPC |
| T09 OPCM_V5 == OPCM_V4 (same address)                  | v5 bootstrap used v4 binary (single repo, wrong branch)           | Use git worktree per §2.5; verify version guard |
| T19/T25 revert on sepolia (exec-jovian-sepolia.sh)     | OPCM not at hardcoded TARGET_ADDRESS on pre-impls fork            | Clone bootstrapped OPCM bytecode to target per §5.19 |
| T15-T17 `just sign` signer check fails                 | Mocked PKs not registered as Safe owners on sepolia fork          | Set `SKIP_SIGNER_CHECK=1` per §5.15 |
| T11 `superchainConfig()` reverts on sepolia            | SystemConfig v2.5.0 lacks accessor (pre-v4)                       | Record OLD_CSC=N/A per §5.11; normal for sepolia pre-impls |
| T25 GS013 revert                                       | Inner delegatecall failed (often wrong OPCM version / CREATE2 collision) | Check OPCM version; v5 needs 4.2.0 not 3.2.0 |

---

## §APPENDIX E — Determinism notes (why this skill is rigid)

- The TodoWrite list is identical across runs. Two separate agents running on the
  same inputs should produce identical task IDs, identical subagent prompts, and
  identical evidence. If they differ, the skill is broken — report the drift.
- Cards are a machine-consumable template. Adding narrative to them breaks
  determinism. Keep them tight.
- X-ray offers, simulations, and confirmation gates are separate TODOs precisely
  because they have been skipped historically. The per-TODO split makes silent
  skipping impossible.
- Subagents never call `mcp_question`. Only the orchestrator does. This preserves
  the turn boundary contract.

---

## §APPENDIX F — Succinct versioning reference (Jovian era)

> **Temporary state disclaimer**: The per-network repo/commit divergence documented
> here is a transitional artifact of the Jovian deployment timeline. Different
> networks were deployed at different times with different Succinct repo versions,
> each producing unique vkeys and therefore unique contract addresses. In the future,
> all versions should converge into tagged releases in the public `op-succinct` repo
> (`$SUCCINCT_ROOT`). When that happens, this appendix can be simplified to a single
> tag reference per version. Until then, the per-network mapping below is
> authoritative.

### F.1 Per-network config references

The FDG config files contain `aggregationVkey`, `rangeVkeyCommitment`, and other
constructor parameters that determine the deployed `OPSuccinctFaultDisputeGame`
address. Each network was deployed with a config generated from a specific repo
state.

**Canonical config files** (at commit `ca8ea9fc7750213c3d0ca775a522b1e23e21ff64`
in `celo-org/op-succinct`):

| Network  | Config file                            | Source URL                                                                                                     |
| -------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| mainnet  | `opsuccinctfdgconfig.mainnet.json`     | `https://github.com/celo-org/op-succinct/blob/ca8ea9fc7750213c3d0ca775a522b1e23e21ff64/contracts/opsuccinctfdgconfig.mainnet.json` |
| sepolia  | `opsuccinctfdgconfig.sepolia.json`     | `https://github.com/celo-org/op-succinct/blob/ca8ea9fc7750213c3d0ca775a522b1e23e21ff64/contracts/opsuccinctfdgconfig.sepolia.json` |
| chaos    | `opsuccinctfdgconfig.chaos.json`       | `https://github.com/celo-org/op-succinct/blob/ca8ea9fc7750213c3d0ca775a522b1e23e21ff64/contracts/opsuccinctfdgconfig.chaos.json`   |

**Local file resolution** at T02 / T10:
- Look for `$SUCCINCT_REPO/contracts/opsuccinctfdgconfig.$NETWORK.json` first.
- If absent, look for generic `$SUCCINCT_REPO/contracts/opsuccinctfdgconfig.json`.
- If neither exists, attempt `just fetch-fdg-config .env.$NETWORK` to generate.
- If generation fails (RPC access issues, missing `.env`), fall to T10 Strategy B.

**Config generation** (`just fetch-fdg-config`):
Runs `scripts/utils/bin/fetch_fault_dispute_game_config.rs` which:
1. Reads `.env` file for secrets, addresses, and behavior flags.
2. Connects to L1/L2 RPCs to fetch `rollupConfigHash`, `startingRoot`, etc.
3. Retrieves `aggregationVkey` and `rangeVkeyCommitment` from compiled SP1 programs.
4. Writes `contracts/opsuccinctfdgconfig.json`.

### F.2 Expected proposal addresses (CeloSuperchainOps)

These are the `OPSuccinctFaultDisputeGame` implementation addresses embedded in the
CeloSuperchainOps upgrade proposals. T10 Strategy A attempts to reproduce these
via local deployment; Strategy B copies their bytecode from upstream.

| Network  | Proposal file                              | OPSuccinctFaultDisputeGame address             |
| -------- | ------------------------------------------ | ---------------------------------------------- |
| mainnet  | `upgrades/mainnet/07-succ-v2.json`         | `0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1`  |
| sepolia  | `upgrades/sepolia/03-succ-v2.json`         | `0x67cd626E1C2534cD5A129ba9208de69B305Ffbd3`  |
| chaos    | n/a (no proposal)                          | capture from `exec-jovian-sepolia.sh` `SUCCINCT_IMPL=` line |

At T01, populate `SUCCINCT_PROPOSAL_ADDR` from this table. On chaos, leave empty.

### F.3 Nonce quirks and address determinism

`OPSuccinctFaultDisputeGame` is deployed via `new` (Solidity CREATE opcode).
The deployed address is `keccak256(rlp([deployer, nonce]))[12:]`. This means:

- **Same deployer + same nonce + same constructor args = same address.**
- **Different nonce = different address**, even with identical bytecode.

**Mainnet double-deploy**: during the original mainnet deployment, the Succinct
game implementation was deployed **twice** — the first attempt consumed a deployer
nonce before the second (successful) attempt produced the address
`0xE7bd695d6A17970A2D9dB55cfeF7F2024d630aE1`. On a clean anvil fork, the deployer
starts with the nonce from the fork block, so the first `forge script` deploy will
land at a **different** address (one nonce earlier). To reproduce the exact mainnet
address, you would need to burn one nonce first (e.g., send a zero-value tx from
the deployer). T10 Strategy A compares the deployed address and falls back to
Strategy B if it doesn't match — this is the expected path for mainnet unless the
nonce is manually adjusted.

**Sepolia**: deployed once, so the nonce is straightforward. Strategy A has a
higher chance of matching if the correct Succinct repo commit is checked out.

**Chaos**: no CeloSuperchainOps proposal exists. T10 always uses Strategy B
(setCodeAtAddress from `$SUCCINCT_IMPL_ADDR` captured at T01).

### F.4 Repo → vkey → address chain (why commits matter)

```
Succinct repo commit
  → compiles SP1 programs (programs/aggregation/, programs/range/)
  → produces ELF binaries (elf/)
  → derives aggregationVkey + rangeVkeyCommitment
  → these are constructor args to OPSuccinctFaultDisputeGame
  → constructor args affect initcode hash
  → initcode hash + deployer + nonce → CREATE address
```

**Wrong commit = wrong ELFs = wrong vkeys = wrong initcode = wrong address.**

This is why §3.4 maps each network to a specific repo path, and why T02 reports
the git commit hash as evidence — so the operator can verify the exact source that
produced the vkeys.

### F.5 Repo assignments (current Jovian era)

| Network  | Repo path (default)                    | Branch        | Notes                                                                                   |
| -------- | -------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| mainnet  | `$SUCCINCT_ROOT_MAINNET` (default `$CELO_ROOT/../Succinct2`) | `develop`     | May require a specific repo, branch, or commit to match deployed vkeys. Operator determines correct source. |
| sepolia  | `$SUCCINCT_ROOT` (default `$CELO_ROOT/../Succinct`)          | `develop`     | Public `celo-org/op-succinct` repo. Config at commit `ca8ea9fc...` matches deployment.  |
| chaos    | `$SUCCINCT_ROOT` (default `$CELO_ROOT/../Succinct`)          | `develop`     | Same public repo. Config at commit `ca8ea9fc...` matches deployment.                    |

**Future state**: when all networks use the same repo source (e.g., tagged releases
in the public `op-succinct` repo), `SUCCINCT_ROOT_MAINNET` can be removed and all
networks can use `SUCCINCT_ROOT` with a version tag. Update this appendix and §3.4
when that happens.
