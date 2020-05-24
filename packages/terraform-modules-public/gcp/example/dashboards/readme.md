# Stackdriver Monitoring Dashboard

There presently is no support for creating Stackdriver monitoring dashboards via Terraform
So instead we have use the gcloud cli to import the dashboard from a json file

`gcloud monitoring dashboards create --config-from-file=dashboards/hud.json`
