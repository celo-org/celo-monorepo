{{- define "prometheus-stackdriver.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "prometheus-stackdriver.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "prometheus-stackdriver.short_labels" -}}
app: {{ template "prometheus-stackdriver.name" . }}
release: {{ .Release.Name }}
{{- end -}}


{{- define "prometheus-stackdriver.labels" -}}
{{- include "prometheus-stackdriver.short_labels" . }}
chart: {{ template "prometheus-stackdriver.chart" . }}
heritage: {{ .Release.Service }}
{{- end -}}
