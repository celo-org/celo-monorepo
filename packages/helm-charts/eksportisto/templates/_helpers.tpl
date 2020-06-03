{{- define "sensitive-acccounts-json" -}}
apiVersion: v1
kind: ConfigMap
data:
  sensitive-accounts.json: {{ .Values.sensitiveAccountsBase64 | b64dec | quote }}
{{- end -}}
