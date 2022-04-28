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
 * The easiest way to get the public IP for the node (VM) that a EKS pod is on
 * is to just make a web request. Unfortunately it is not possible to get it
 * from the downward k8s API.
*/}}
{{- define "celo-fullnode.aws-subnet-specific-nat-ip" -}}
{{- if .Values.aws -}}
PUBLIC_IP=$(wget https://ipinfo.io/ip -O - -q)
NAT_FLAG="--nat=extip:${PUBLIC_IP}"
{{- end -}}
{{- end -}}

{{/*
 * Blockscout indexer requests can take longer than default
 * request timeouts.
 * Adding a dummy comment (template .extra_setup) because helm indenting problems if this template is empty
*/}}
{{- define "celo-fullnode.extra_setup" }}
# template .extra_setup
{{- include  "celo-fullnode.aws-subnet-specific-nat-ip" . }}
{{- if .Values.geth.increase_timeouts }}
ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --http.timeout.read 600 --http.timeout.write 600 --http.timeout.idle 2400"
{{- end -}}
{{- end -}}

{{/*
 * This will create an HTTP server at .server_port
 * that is intended for GCP NEG health checks. It will
 * ensure that TCP at port .tcp_check_port works and
 * that the /health-check.sh script passes. This script
 * ensures that the node is not syncing and its most recent
 * block is at most 30 seconds old.
*/}}
{{- define "celo-fullnode.health-checker-server" -}}
- name: health-checker-server-{{ .protocol_name }}
  image: gcr.io/celo-testnet/health-checker:0.0.5
  imagePullPolicy: IfNotPresent
  args:
  - --script=/health-check.sh
  - --listener=0.0.0.0:{{ .server_port }}
  - --port={{ .tcp_check_port }}
  ports:
  - name: health-check
    containerPort: {{ .server_port }}
  volumeMounts:
  - name: health-check
    mountPath: /health-check.sh
    subPath: health-check.sh
{{- end -}}
