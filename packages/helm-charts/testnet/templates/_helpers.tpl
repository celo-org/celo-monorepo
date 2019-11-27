{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "ethereum.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ethereum.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := "" -}}
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
{{- define "ethereum.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "standard.labels" -}}
{{- include "standard.short_labels" . }}
chart: {{ template "ethereum.chart" . }}
heritage: {{ .Release.Service }}
{{- end -}}

{{- define "standard.short_labels" -}}
app: {{ template "ethereum.name" . }}
release: {{ .Release.Name }}
{{- end -}}


{{- define "celo.init-genesis-container" -}}
- name: init-genesis
  image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
  imagePullPolicy: {{ .Values.imagePullPolicy }}
  args:
  - "init"
  - "/var/geth/genesis.json"
  volumeMounts:
  - name: data
    mountPath: /root/.celo
  - name: config
    mountPath: /var/geth
{{- end -}}

{{- define "celo.get-bootnodes-container" -}}
- name: get-bootnodes
  image: celohq/minimal:latest
  imagePullPolicy: {{ .Values.imagePullPolicy }}
  command: ["/bin/sh"]
  args:
  - "-c"
  - |-
{{ .Files.Get "scripts/get-bootnode.sh" | indent 4 }}
  env:
  - name: BOOTNODE_SVC
    value: {{ template "ethereum.fullname" . }}-bootnode.{{ .Release.Namespace }}
  volumeMounts:
  - name: data
    mountPath: /geth
{{- end -}}

{{- define "celo.node-volumes" -}}
volumes:
- name: data
  persistentVolumeClaim:
    claimName: {{ template "ethereum.fullname" . }}-{{ .node_prefix }}-pvc
- name: config
  configMap:
    name: {{ template "ethereum.fullname" . }}-geth-config
- name: account
  secret:
    secretName: {{ template "ethereum.fullname" . }}-geth-account
{{- end -}}

{{- define "celo.node-pvc" -}}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ template "ethereum.fullname" . }}-{{ .pvc_name }}
  labels:
    app: {{ template "ethereum.name" . }}
    chart: {{ template "ethereum.chart" . }}
    release: {{ .Release.Name }}
    heritage: {{ .Release.Service }}
    component: {{ .pvc_name }}
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ssd
  resources:
    requests:
      storage: 100Gi
{{- end -}}

{{- define "celo.geth-exporter-container" -}}
- name: geth-exporter
  image: "{{ .Values.gethexporter.image.repository }}:{{ .Values.gethexporter.image.tag }}"
  imagePullPolicy: {{ .Values.imagePullPolicy }}
  ports:
    - name: profiler
      containerPort: 9200
  command:
    - /usr/local/bin/geth_exporter
    - -ipc
    - /root/.celo/geth.ipc
    - -filter
    - (.*overall|percentiles_95)
  resources:
    requests:
      memory: 50M
      cpu: 50m
  volumeMounts:
  - name: data
    mountPath: /root/.celo
{{- end -}}

{{- define "celo.prom-to-sd-container" -}}
- name: prom-to-sd
  image: "{{ .Values.promtosd.image.repository }}:{{ .Values.promtosd.image.tag }}"
  imagePullPolicy: {{ .Values.imagePullPolicy }}
  ports:
    - name: profiler
      containerPort: {{ .Values.promtosd.port }}
  command:
    - /monitor
    - --stackdriver-prefix=custom.googleapis.com
    - --source={{ .component }}:http://localhost:{{ .metricsPort }}/{{ .metricsPath | default "metrics" }}?containerNameLabel={{ .containerNameLabel }}
    - --pod-id=$(POD_NAME)
    - --namespace-id=$(POD_NAMESPACE)
    - --scrape-interval={{ .Values.promtosd.scrape_interval }}
    - --export-interval={{ .Values.promtosd.export_interval }}
  resources:
    requests:
      memory: 50M
      cpu: 50m
  env:
    - name: POD_NAME
      valueFrom:
        fieldRef:
          fieldPath: metadata.name
    - name: POD_NAMESPACE
      valueFrom:
        fieldRef:
          fieldPath: metadata.namespace
{{- end -}}
