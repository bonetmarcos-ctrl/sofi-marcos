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

La API guarda el estado en `apps/api/data/state.json` por defecto. En produccion puedes cambiarlo con `DATA_FILE`. El frontend mantiene fallback en `localStorage` si la API no esta disponible.

## Deploy Gratuito

El repo incluye `render.yaml` para Render Free. El backend sirve `apps/web/dist` en produccion, asi que un unico servicio Node despliega frontend y API juntos.

Pasos sugeridos para el proximo paso:

1. Subir el repo a GitHub.
2. Crear un Blueprint en Render apuntando al repositorio.
3. Confirmar que Render usa `npm ci && npm run build` y `npm start`.
4. Ajustar persistencia si necesitas datos duraderos fuera del filesystem gratuito.