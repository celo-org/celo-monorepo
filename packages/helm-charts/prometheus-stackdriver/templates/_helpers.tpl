{{- define "prometheus-stackdriver.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "prometheus-stackdriver.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels that are recommended to be used by Helm and Kubernetes
*/}}
{{- define "prometheus-stackdriver.labels" -}}
app.kubernetes.io/name: {{ template "prometheus-stackdriver.name" . }}
helm.sh/chart: {{ template "prometheus-stackdriver.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
