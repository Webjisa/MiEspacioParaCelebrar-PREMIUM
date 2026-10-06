# Auditoría inicial de la base nueva

Fecha: 2026-10-06
Versión: 0.1.0

## Hallazgos de la versión anterior que esta base evita

### Frontend

- Se evita cargar múltiples hojas CSS que compitan entre sí.
- Se evita cargar múltiples capas JS sobre los mismos componentes.
- No hay archivos `.bak` en producción.
- No se utilizan grids con anchos mínimos imposibles para móvil.
- Los botones están diseñados para poder envolver texto y ocupar el ancho disponible.

### Dependencias

- No hay CDN externo en esta base.
- No hay Google Fonts remoto.
- No hay Leaflet remoto.
- No hay scripts de terceros.

Esto reduce superficie de suministro y hace el comportamiento inicial más predecible. La integración de mapas y Supabase se añade de forma deliberada después.

### Seguridad

- No hay claves ni tokens.
- `.gitignore` bloquea `.env` y logs.
- GitHub Actions usa el flujo oficial de Pages con permisos mínimos para el despliegue.
- El frontend no pretende hacer cumplir permisos de negocio.

## Pendientes antes de producción

1. Auditar todas las tablas Supabase y sus políticas RLS.
2. Auditar `SECURITY DEFINER`, `search_path`, `GRANT` y `REVOKE` de todas las RPC.
3. Verificar que una reserva sea atómica y que dos solicitudes concurrentes no puedan ocupar el mismo intervalo.
4. Probar que un propietario solo puede operar sobre sus propios espacios.
5. Revisar tokens de confirmación/rechazo y su expiración/uso único.
6. Incorporar rate limiting o mitigación anti-spam para formularios públicos.
7. Revisar exposición de datos personales y enumeración por referencia/email.
8. Integrar cabeceras de seguridad en el hosting final. GitHub Pages no permite definir libremente cabeceras HTTP del servidor mediante este repositorio.
9. Realizar pruebas funcionales y responsive en dispositivos reales.
10. Ejecutar una revisión final de accesibilidad y rendimiento.

## Veredicto

Esta base está preparada para reconstrucción, no certificada como aplicación de producción. La certificación depende de la auditoría del backend y de las pruebas finales.
