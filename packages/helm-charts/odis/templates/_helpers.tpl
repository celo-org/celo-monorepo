{{/*
The name of the deployment
*/}}
{{- define "name" -}}
{{- .Values.environment.cluster.name -}}
{{- end -}}

{{/*
Common labels that are recommended to be used by Helm and Kubernetes
*/}}
{{- define "labels" -}}
app.kubernetes.io/name: {{ template "name" . }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Annotations to indicate to the prometheus server that this node should be scraped for metrics
*/}}
{{- define "metric-annotations" -}}
prometheus.io/scrape: "true"
prometheus.io/port: "{{ .Values.relayer.metrics.prometheusPort }}"
{{- end -}}

{{/*
Label specific to the odis signer component
*/}}
{{- define "odis-signer-component-label" -}}
app.kubernetes.io/component: odis-signer
{{- end -}}

{{/*
The name of the azure identity binding for the odis signer
*/}}
{{- define "azure-identity-binding-name" -}}
{{- template "name" . -}}-identity-binding
{{- end -}}

{{/*
The name of the azure identity for the odis signer
*/}}
{{- define "azure-identity-name" -}}
{{- template "name" . -}}-identity
{{- end -}}