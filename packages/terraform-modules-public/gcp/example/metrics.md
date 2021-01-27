# metrics

## geth exporter
The geth exporter is no longer needed, since Geth now includes the ability to export metrics natively.
Previously, the proxy, validator and tx-node services included the geth-exporter service to export geth metrics for Prometheus. Serving at port 9200, you could configure your Prometheus server to collect the metrics at endpoint http://:9200/metrics

This has been deprecated and removed.

## geth metrics
geth is now invoked started with --metrics and --pprof
which exposes metrics on http://localhost:6060/debug/metrics

## prometheus
[prometheus](https://prometheus.io/) style metrics are now exposed and can be accessed at
http://localhost:6060/debug/metrics/prometheus
prometheus data can be scraped by prometheus using a static config target specified in
prometheus.yml, as follows:

```
global:
  scrape_interval:     15s # By default, scrape targets every 15 seconds.

  # Attach these labels to any time series or alerts when communicating with
  # external systems (federation, remote storage, Alertmanager).
  external_labels:
    monitor: 'codelab-monitor'

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s

    static_configs:
      - targets: ['localhost:9090']
```


## visualization
grafana is a good choice for graphing
`docker run --rm -it --net=host grafana/grafana`

## further reading
See https://blog.ethereum.org/2019/07/10/geth-v1-9-0/#metrics-collection for more information


