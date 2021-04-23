{{- define "eksportisto.name" -}}
{{- .Values.environment -}}-eksportisto-{{- .Values.deploymentSuffix -}}
{{- end -}}
