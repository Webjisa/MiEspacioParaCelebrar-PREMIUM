# Arquitectura propuesta

## Regla principal

Una responsabilidad, un lugar.

- `css/main.css`: sistema visual completo.
- `js/app.js`: navegación y comportamiento público común.
- `js/calendar.js`: calendario y estados visuales.
- Supabase: autorización y reglas de negocio.

## Capas

```text
HTML semántico
    ↓
CSS único
    ↓
JS de interfaz
    ↓
RPC autorizadas de Supabase
    ↓
RLS + restricciones de base de datos
```

El navegador nunca debe ser la autoridad para decidir si una operación está permitida.

## Convenciones

- Clases reutilizables en vez de IDs con estilos únicos.
- `data-*` para comportamiento.
- Sin estilos inline salvo casos excepcionales y justificados.
- Sin HTML generado masivamente con concatenaciones complejas.
- Un componente debe tener una sola definición visual.
