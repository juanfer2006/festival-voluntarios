# Módulo 04 — Turnos de Voluntarios (Festival Picnic 2026)

API backend para la gestión de turnos de voluntarios del Festival Picnic 2026.

## Tecnologías

- Node.js (v18+)
- Express
- TypeScript
- Prisma 7 (@prisma/client@7, @prisma/adapter-pg, pg)
- PostgreSQL (Supabase)

## Arquitectura de 4 Capas

- `src/domain/`: Entidad `Turno`, tipos del módulo y contrato del repositorio.
- `src/application/`: Casos de uso y reglas de negocio; depende del contrato del dominio.
- `src/infrastructure/`: Implementación del repositorio con Prisma y conexión a PostgreSQL.
- `src/presentation/`: Controladores y rutas HTTP de Express.
- `src/app.ts`: Punto de composición que conecta las capas y arranca el servidor.

El flujo de una petición es: ruta/controlador → caso de uso → contrato del dominio → repositorio Prisma.
Las reglas de negocio no acceden directamente a Express ni a Prisma.

## Variables de Entorno (.env)

```env
PORT=3000
DATABASE_URL="postgresql://postgres.bvrtfkhqlmdsysfjcjtw:aX6h9H57YuL81M4f@aws-0-ca-central-1.pooler.supabase.com:5432/postgres"
```

## Comandos

```bash
npm run dev     # Inicia la API en desarrollo con recarga automática
npm run build   # Compila el proyecto con tsc
npm run sync    # Sincroniza esquema de base de datos compartida
```

Para correr las pruebas desde la raíz:

```bash
node pruebas/correr.mjs voluntarios http://localhost:3000
```