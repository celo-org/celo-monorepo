{{/*
The name of the deployment
*/}}
{{- define "name" -}}
{{- .Values.environmentName -}}-oracle
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
Label specific to the oracle client component
*/}}
{{- define "oracle-client-component-label" -}}
app.kubernetes.io/component: oracle-client
{{- end -}}
