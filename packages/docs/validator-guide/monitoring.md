# Monitoring

## Monitoring Validators and Proxies

### Logging

Several command line options control logging:

* `--verbosity`: Sets logging verbosity. `3` outputs logs up to `INFO` level and is recommended. `4` outputs up to `DEBUG` level; `5` is `TRACE`.
* `--vmodule`: Overrides this verblosity in specific modules. For example, to configure `TRACE` level logging of consensus activity, use `consensus/istanbul/*=5`.
* `--consoleoutput`: Sends output to the given path, or to `stdout`.
* `--consoleformat`: Formats logs for easy viewing in a terminal \(`term`\), or as structured JSON \(`json`\).

Useful messages to record or set up log-based metrics on:

* `msg="Validator Election Results"`: When the last block of any epoch \(`number`\) has been agreed, `elected` shows whether the validator was selected in the validator election.
* `msg="Elected but didn't sign block"`: This validator was elected but did not have its signature included in the block given by `number` \(in fact, in the child's parent seal\). This block could count towards downtime if 12 successive blocks are missed.

### Metrics

Celo Blockchain inherits [go-ethereum's metrics](https://github.com/ethereum/go-ethereum/wiki/Metrics-and-Monitoring) system, but additional Celo-specific metrics have been added.

Metrics reporting is enabled with the `--metrics` flag.

Pull-based metrics are available using the `--pprof` flag. This enables the `pprof` debugging HTTP server, by default on `http://localhost:6060`. The `--pprofaddr` and `--pprofport` options can be used to configure the interface and port respectively. If the node is running inside a Docker container, you will need to set `--pprofaddr 0.0.0.0`, then on your Docker command line add `-p 127.0.0.1:6060:6060`.

{% hint style="warning" %}
Be sure never to expose the `pprof` service to the public internet.
{% endhint %}

[Prometheus](https://prometheus.io) format metrics are available at `http://localhost:6060/debug/metrics/prometheus`.

[ExpVar](https://golang.org/pkg/expvar/) format metrics are available at `http://localhost:6060/debug/metrics`.

Support for pushing metrics to [InfluxDB](https://www.influxdata.com/products/influxdb-overview/) is available via `--metrics.influxdb` and related flags. This works without the `pprof` server.

Note that metric name separators differ between these endpoints.

All metrics are soft-state and are cleared when the process is restarted.

### Memory metrics

Memory metrics derived from [mstats](https://godoc.org/github.com/go-graphite/carbonzipper/mstats):

* `system_memory_held`: Gauge of virtual address space allocated by the Celo Blockchain process, measured in bytes.
* `system_memory_used`: Gauge of Memory in use by the Celo Blockchain process, measured as bytes of allocated heap objects.
* `system_memory_allocs`: Counter for memory allocations made, measured in bytes. Consider monitoring the rate.
* `system_memory_pauses`: Counter for stop-the-world Garbage Collection pauses, measured in nanoseconds. Consider monitoring the rate.

### CPU metrics

* `system_cpu_sysload`: Gauge of load average for the system.
* `system_cpu_syswait`: Gauge of IO wait time for the system.
* `system_cpu_procload`: Gauge of load average for the Celo Blockchain process.

### Network metrics

* `p2p_peers`: The number of connected peers. This should remain at exactly `1` for a proxied validator \(just its proxy\). It should remain at a relatively steady level for proxy nodes.
* `p2p_ingress`: Counter for total inbound traffic, measured in bytes. Consider monitoring the rate.
* `p2p_egress`: Counter for total outbound traffic, measured in bytes. Consider monitoring the rate.
* `p2p_dials`: Counter for outbound connection attempts. Consider monitoring the rate.
* `p2p_serves`: Counter for accepted inbound connection attempts. Consider monitoring the rate.

### Blockchain metrics

* `chain_inserts_count`: The count of insertions of new blocks into this node's chain. The rate of this metric should be close to constant at `0.2` /second.

### Validator health metrics

A number of metrics are tracked for the parent of the last sealed block received \(i.e. this is always two fewer than the current consensus sequence\):

* `consensus_istanbul_blocks_elected`: Counts the number of blocks for which this validator has been elected
* `consensus_istanbul_blocks_signedbyus`: Counts the blocks for which this validator was elected and its signature was included in the seal. This means the validator completed consensus correctly, sent a `COMMIT`, its commit was received in time to make the seal of the parent received by the next proposer, or was received directly by the next proposer itself, and so the block will not count as downtime. Consider monitoring the rate.
* `consensus_istanbul_blocks_missedbyus`: Counts the blocks for which this validator was elected but not included in the child's parent seal \(this block could count towards downtime if 12 successive blocks are missed\). Consider monitoring the rate.
* `consensus_istanbul_blocks_missedbyusinarow`: \(_since 1.0.2_\) Counts the blocks for which this validator was elected but not included in the child's parent seal in a row. Consider monitoring the gauge.
* `consensus_istanbul_blocks_proposedbyus`: \(_since 1.0.2_\) Counts the blocks for which this validator was elected and for which a block it proposed was succesfully included in the chain. Consider monitoring the rate.
* `consensus_istanbul_blocks_downtimeevent`: \(_since 1.0.2_\) Counts the blocks for which this validator was elected and for blocks where it is considered down \(occurs when `missedbyusinarow` is &gt;= 12\). Consider monitoring the rate.

### Consensus metrics

* `consensus_istanbul_core_desiredround`: Current desired round for this validator, i.e the round we are waiting to see a quorum of validators send `RoundChange` messages for. Usually this value should be `0`. Desired rounds increment with each timeout, which backoff exponentially. A value of `5` indicates consensus has stalled for more than 30 seconds. Values above that means the validator is unable to participate in quorum \(either because it is disconnected, out of sync, etc, or because of network partition or failure of other validators\).
* `consensus_istanbul_core_round`: : Current consensus round for this validator, i.e the round for which this validator has received a quorum of `RoundChange` messages. Usually this value should be `0`. If this value is less than `consensus_istanbul_core_desiredround` the validator is not connected to a quorum of other validators that are also unable to participate \(for instance, they did see a proposed block, but this validator did not\). If it is equal, it means the validator remains connected to a quorum of other validators but cannot agree on a block.
* `consensus_istanbul_core_sequence`: Current consensus sequence number, i.e the block number currently being proposed.

### Network consensus health metrics

* `consensus_istanbul_blocks_totalsigs`: The number of validators whose signatures were included in the child's parent seal. This can be used to determine how many validators are up and contributing to consensus. If this number falls towards two thirds of validator set size, network block production is at risk.
* `consensus_istanbul_blocks_missedrounds`: Sum of the `round` included in the `parentAggregatedSeal` for the blocks seen. That is, the cumulative number of consensus round changes these blocks needed to make to get to this agreed block. This metric is only incremented when a block is succesfully produced after consensus rounds fails, indicating down validators or network issues.
* `consensus_istanbul_blocks_missedroundsasproposer`: \(_since 1.0.2_\) A meter noting when this validator was elected and could have proposed a block with their signature but did not. In some cases this could be required by the Istanbul BFT protocol.
* `consensus_istanbul_blocks_validators`: \(_since 1.0.2_\) Total number of validators eligible to sign blocks.
* `consensus_istanbul_core_consensus_count`: Count and timer for succesful completions of consensus \(Use `quantile` tag to find percentiles: `0.5`, `0.75`, `0.95`, `0.99`, `0.999`\)

### Management APIs

Celo blockchain inherits and extends go-ethereum's Javascript console, exposing [management APIs](https://geth.ethereum.org/docs/rpc/server) and [web3 DApp APIs](https://github.com/ethereum/wiki/wiki/JavaScript-API).

Connect a client using a variant of the `attach` command line option:

```bash
geth attach --datadir DATADIR
geth attach ipc:PATH/TO/geth.ipc
geth attach http://localhost:8545
geth attach ws://localhost:8546
```

## Monitoring Attestation Service

It is also important to [monitor Attestation Service](attestation-service.md#monitoring) and the full node that it depends on.

## Community Moniting Tools

### [Pretoria Research Lab Mainnet Signed Blocks Map](https://cauldron.pretoriaresearchlab.io/rc1-block-map)

Shows current and historic data on validator signatures collected in each block on Mainnet.

### [Virtual Hive Celo Network Validator Exporter](https://github.com/virtualhive/celo-network-validator-exporter)

Prometheus exporter that scrapes downtime and meta information for a specified validator signer address from the Celo blockchain. All data is collected from a blockchain node via RPC.

_Please raise a Pull Request against_ [_this page_](https://github.com/celo-org/celo-monorepo/blob/master/packages/docs/celo-holder-guide/voting-validators.md) _to add/amend details of any community services!_

