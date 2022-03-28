# GKE Workload Metrics

Helm charts to manage `PodMonitors` to scrape GCP workload metrics.
See the [GCP documentation](https://cloud.google.com/stackdriver/docs/solutions/gke/managing-metrics#workload-metrics) for more details and requirements.

This is an alternative to collecting and sending Prometheus metrics to Google Cloud Monitoring as explained [here](https://cloud.google.com/stackdriver/docs/solutions/gke/prometheus).

## Examples

- <https://github.com/GoogleCloudPlatform/kubernetes-engine-samples/tree/master/workload-metrics>
- <https://github.com/GoogleCloudPlatform/oss-test-infra/blob/02791e3e38dc0ca0654081d13cb35f47fc978d0e/prow/oss/cluster/monitoring/prow_podmonitors.yaml>
