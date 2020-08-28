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
 * AWS requires a network load balancer to have a distinct public IP address for
 * each public subnet the cluster is in. A subnet can only exist in one availability zone.
 * Geth only supports advertising itself with one IP with the `--nat` flag.
 * Because a pod will be assigned to a node in a single availability zone, we
 * want geth to use the IP address that corresponds to the particular availability zone
 * the pod is scheduled in.
*/}}
{{- define "celo-fullnode.aws-subnet-specific-nat-ip" -}}
{{- if .Values.aws -}}
PUBLIC_IP=$(wget https://ipinfo.io/ip -O - -q)
NAT_FLAG="--nat=extip:${PUBLIC_IP}"
{{- end -}}
{{- end -}}
