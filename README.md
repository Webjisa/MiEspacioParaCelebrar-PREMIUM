# MiEspacioParaCelebrar — GitHub Starter

Versión inicial limpia para reconstruir **MiEspacioParaCelebrar** sin arrastrar capas históricas de CSS/JS.

## Objetivos de esta base

- GitHub Pages desde el primer commit.
- HTML semántico y accesible.
- Responsive real: una columna en móvil, filtros apilables y botones que nunca dependen de anchos fijos.
- Un único CSS global y un único punto de entrada JS para la interfaz pública.
- Sin librerías externas ni fuentes externas en esta fase.
- Sin claves, secretos ni credenciales en el repositorio.
- Calendario preparado para los estados de diseño aprobados: disponible, seleccionada, ocupada, retenida, pasada y otro mes.
- Backend desacoplado: la integración de Supabase se hará después de auditar RLS/RPC.

## Estructura

```text
.
├── .github/workflows/pages.yml
├── assets/
├── css/main.css
├── docs/AUDITORIA-INICIAL.md
├── docs/ARQUITECTURA.md
├── js/app.js
├── js/calendar.js
├── 404.html
├── acceso.html
├── admin.html
├── area-privada.html
├── disponibilidad.html
├── espacio.html
├── espacios.html
├── index.html
├── reservar.html
├── seguimiento.html
├── SECURITY.md
└── .gitignore
```

## Despliegue en GitHub Pages

1. Crear un repositorio vacío.
2. Subir estos archivos a `main`.
3. En GitHub: **Settings → Pages → Source: GitHub Actions**.
4. El workflow de `.github/workflows/pages.yml` publica el contenido estático.

## Siguiente fase

No conectes todavía las funciones de reserva ni Supabase directamente. Primero hay que auditar la base de datos existente y definir una única superficie de RPC autorizada.
