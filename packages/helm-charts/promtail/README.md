# Promtail

Helm chart values to manage the Promtail deployment used to ingest k8s logs into Grafana Cloud's Loki instance.

- Documentation:
  - <https://grafana.com/docs/loki/latest/>
  - <https://grafana.com/docs/loki/latest/clients/promtail/>
- Helm repo: <https://artifacthub.io/packages/helm/grafana/promtail>
- Code: <https://github.com/grafana/helm-charts/tree/main/charts/promtail>

## Configuration

- Promtail ingests Kubernetes logs from allow-listed namespaces.
- Nothing else gets scraped (eg: <https://grafana.com/docs/loki/latest/clients/promtail/scraping/>) — to be re-evaluated.
- Promtail exposes metrics to Prometheus, which can scrape them. See <https://grafana.com/docs/loki/latest/clients/promtail/stages/metrics/>.
- Each k8s cluster has its own ServiceAccount.

## Querying logs

Head to <https://clabs.grafana.net/explore> and select the logs datasource.
Have a look at the LogQL specs: <https://grafana.com/docs/loki/latest/logql/>.

## Deployment

Use `celotool`:

```sh
celotool deploy {initial,upgrade,destroy} promtail -e <ENV> [--context <CONTEXT>]
```
