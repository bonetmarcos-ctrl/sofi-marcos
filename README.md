# Sofi Marqui

Monorepo con React en frontend, Node.js/Express en backend y un paquete de dominio compartido para reglas de negocio testeables.

## Estructura

- `apps/web`: aplicacion React + Vite.
- `apps/api`: API Node.js con capas `application`, `infrastructure` e `interfaces/http`.
- `packages/domain`: datos iniciales, esquemas Zod y calculos puros de presupuesto/deudas.

## Comandos

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
npm start
```

En desarrollo, Vite corre en `http://localhost:5173` y la API en `http://localhost:4000`. El frontend usa proxy para `/api`.

## Persistencia

La API usa una interfaz de repositorio. En local, si no existe `DATABASE_URL`, guarda el estado en `apps/api/data/state.json`. En produccion, si defines `DATABASE_URL`, usa PostgreSQL automaticamente.

Variables relevantes:

```bash
DATABASE_URL=postgresql://usuario:password@host/database?sslmode=require
DATA_FILE=./apps/api/data/state.json
```

El frontend mantiene fallback en `localStorage` si la API no esta disponible, pero en uso normal los datos reales se guardan desde la API.

## Base de Datos Gratuita

Opcion recomendada: Neon PostgreSQL Free.

1. Crea una cuenta en `https://neon.tech`.
2. Crea un proyecto nuevo.
3. Copia la connection string de PostgreSQL con SSL.
4. En Render, anade esa connection string como variable de entorno `DATABASE_URL`.
5. Arranca el servicio: la API creara automaticamente la tabla `app_state`.

La persistencia actual guarda el estado de la aplicacion como `jsonb` dentro de PostgreSQL. Es simple, robusta para esta fase y mantiene el codigo desacoplado. Cuando necesites consultas avanzadas, se puede evolucionar a tablas normalizadas por entidad (`eventos`, `viajes`, `deudas`, etc.) sin cambiar el frontend.

## Deploy Gratuito

El repo incluye `render.yaml` para Render Free. El backend sirve `apps/web/dist` en produccion, asi que un unico servicio Node despliega frontend y API juntos.

Pasos sugeridos para el proximo paso:

1. Subir el repo a GitHub.
2. Crear una base PostgreSQL gratis en Neon y copiar su `DATABASE_URL`.
3. Crear un Blueprint en Render apuntando al repositorio.
4. En Render, configurar `DATABASE_URL` como variable secreta.
5. Confirmar que Render usa `npm ci && npm run build` y `npm start`.
6. Abrir la URL publica de Render y probar crear/editar datos.

Render Free puede dormir el servicio cuando no se usa. Neon Free mantiene los datos fuera del filesystem de Render, asi que los datos no se pierden aunque el servicio se reinicie.