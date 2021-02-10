{{- define "name" -}}
{{- .Values.environment.name -}}-{{- .Values.environment.currencyPair -}}-oracle-rbac-{{- .index -}}
{{- end -}}

{{- define "oracle-pod-name" -}}
{{- .Values.environment.name -}}-{{- .Values.environment.currencyPair -}}-oracle-{{- .index -}}
{{- end -}}
