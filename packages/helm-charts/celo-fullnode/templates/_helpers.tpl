{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "celo-fullnode.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "celo-fullnode.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "celo-fullnode.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "celo-fullnode.labels" -}}
{{ include "common.standard.labels" . }}
component: celo-fullnode
{{- end -}}

{{- define "celo-fullnode.rpc-ports" -}}
- port: 8545
  targetPort: rpc
  protocol: TCP
  name: rpc
- port: 8546
  targetPort: ws
  protocol: TCP
  name: ws
{{- end -}}

{{/*
Annotations to indicate to the prometheus server that this node should be scraped for metrics
*/}}
{{- define "prometheus-annotations" -}}
prometheus.io/scrape: "true"
prometheus.io/path:  "{{ .Values.pprof.path }}"
prometheus.io/port: "{{ .Values.pprof.port }}"
{{- end -}}
