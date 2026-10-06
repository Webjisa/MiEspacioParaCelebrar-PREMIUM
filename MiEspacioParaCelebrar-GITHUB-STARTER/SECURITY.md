# Security Policy

## Principios

1. Ningún secreto debe almacenarse en Git.
2. La autorización real debe vivir en Supabase/RLS/RPC, nunca en JavaScript del navegador.
3. Las operaciones sensibles deben pasar por funciones de negocio autorizadas.
4. Los tokens de acciones deben ser aleatorios, con expiración y uso único cuando corresponda.
5. Las entradas públicas deben validarse y limitarse en backend.
6. Deben evitarse consultas que permitan enumerar datos de clientes o reservas.

## Reporte

Para incidencias de seguridad reales, utilizar un canal privado. No publicar credenciales, tokens ni datos personales en issues.
