---
description: "Crear una aplicacion full stack con arquitectura tipo Sofi Marqui: monorepo TypeScript, dominio compartido, API Express, React, tests y deploy"
---

# Prompt para crear una app con esta arquitectura

Actua como un senior full-stack engineer y arquitecto de software. Quiero que construyas o adaptes una aplicacion nueva usando la misma arquitectura, principios y metodologia de la app Sofi Marqui, pero aplicada a las logicas de negocio que te voy a pasar en este repo o en el chat.

Tu objetivo no es copiar pantallas ni nombres de Sofi Marqui. Tu objetivo es replicar el enfoque tecnico: monorepo TypeScript, dominio compartido, reglas de negocio testeables, API desacoplada, frontend modular, persistencia intercambiable, autenticacion segura, cobertura de tests y despliegue simple.

## Contexto que debes tomar como referencia

La app de referencia usa esta idea central:

- Un monorepo npm workspaces con `apps/web`, `apps/api` y `packages/domain`.
- Un paquete `domain` compartido que contiene schemas Zod, datos iniciales y funciones puras de negocio.
- Una API Node.js + Express con capas `application`, `infrastructure` e `interfaces/http`.
- Un frontend React + Vite + TypeScript organizado por features, hooks, servicios, componentes y constantes.
- Persistencia desacoplada mediante interfaces de repositorio: memoria para tests, JSON local para desarrollo y PostgreSQL para produccion.
- Autenticacion con usuario/contrasena, hash bcrypt cuando aplique, JWT y cookie HTTP-only.
- Tests por capas: dominio con Vitest, API con Vitest + Supertest, frontend con Testing Library y E2E con Cypress.
- Deploy sencillo donde la API puede servir el `dist` del frontend en produccion y usar PostgreSQL si existe `DATABASE_URL`.

## Antes de implementar

Primero analiza cuidadosamente el repo actual y cualquier logica de negocio que te pase. Luego confirma brevemente:

- Cuales son las entidades principales del dominio.
- Que colecciones o agregados hacen falta.
- Que reglas de negocio deben vivir en `packages/domain` como funciones puras.
- Que datos iniciales o fixtures hacen falta.
- Que workflows reales debe cubrir el frontend.
- Que endpoints necesita la API.
- Que persistencia conviene para desarrollo, tests y produccion.
- Que datos vienen importados desde tablas, Excel, CSV, JSON u otra fuente inicial, y como se van a editar desde la app.

Si falta algun detalle, no bloquees el avance. Define supuestos razonables, dejalos explicitos y construye una primera version funcional.

## Datos importados siempre editables

Todos los datos que yo pase en tablas, Excel, CSV, JSON, capturas o cualquier formato estructurado deben quedar como datos editables de la aplicacion, no como contenido estatico de solo lectura.

Reglas obligatorias:

- Si una tabla inicial se carga como fixture o seed, despues debe guardarse dentro del estado persistente del usuario.
- Cada fila importada debe corresponder a una entidad o item editable.
- Cada coleccion importada debe tener CRUD completo de punta a punta: listar, crear, editar, eliminar y resetear/importar de nuevo cuando aplique.
- El frontend debe incluir una forma clara de editar esos datos: formulario, modal, tabla editable, panel de detalle o pantalla feature.
- La API debe validar y persistir cambios sobre esos datos usando los schemas del dominio.
- No dejes datos de negocio reales bloqueados dentro de constantes de frontend si el usuario espera modificarlos.
- Las constantes del frontend deben usarse solo para labels, colores, categorias visuales, opciones cerradas o configuracion de UI; los datos operativos deben vivir en el estado editable.
- Si hay datos base como ingresos, gastos fijos, categorias, tarifas, inventario, clientes, tareas, productos, reglas, calendarios o cualquier tabla de negocio, deben tener una superficie de edicion si afectan el resultado de la app.
- Si una regla necesita valores iniciales, usa defaults o seeds, pero permite modificarlos y persistirlos por usuario.
- Conserva IDs cuando existan para evitar duplicados al reimportar; si no existen, genera IDs estables o documenta la estrategia.

No aceptes una solucion donde las tablas importadas solo se muestran en dashboards o reportes. Los reportes son derivados; la fuente debe poder editarse.

## Arquitectura obligatoria

Crea o adapta el proyecto con esta estructura base:

```text
.
├─ package.json
├─ tsconfig.base.json
├─ eslint.config.mjs
├─ cypress.config.ts
├─ render.yaml
├─ README.md
├─ apps/
│  ├─ web/
│  │  ├─ package.json
│  │  ├─ vite.config.ts
│  │  └─ src/
│  │     ├─ App.tsx
│  │     ├─ main.tsx
│  │     ├─ components/
│  │     ├─ constants/
│  │     ├─ data/
│  │     ├─ features/
│  │     ├─ hooks/
│  │     ├─ services/
│  │     └─ utils/
│  └─ api/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        ├─ app.ts
│        ├─ main.ts
│        ├─ application/
│        ├─ config/
│        ├─ infrastructure/
│        └─ interfaces/http/
├─ packages/
│  └─ domain/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        ├─ index.ts
│        ├─ schemas.ts
│        ├─ demoData.ts
│        └─ business-rules.ts
└─ cypress/
   ├─ e2e/
   └─ support/
```

Usa otros nombres de archivo cuando el dominio lo pida, pero conserva la separacion de responsabilidades.

## Principios de diseno tecnico

Sigue estos principios durante toda la implementacion:

- El dominio no debe importar React, Express, fetch, fs, pg ni APIs del navegador.
- Las reglas de negocio deben ser funciones puras, deterministas y testeables.
- Los schemas Zod deben ser la frontera de validacion y normalizacion de datos.
- La API no debe contener reglas de negocio complejas. Debe orquestar servicios, validar y persistir.
- La infraestructura debe depender de interfaces, no al reves.
- El frontend debe consumir servicios y hooks, no hablar con `fetch` desde componentes feature.
- Evita duplicar logica entre frontend y backend. Si una regla se usa en ambos lados, va en `packages/domain`.
- Usa configuracion por variables de entorno para auth, CORS, puerto, archivos de datos y base de datos.
- Mantiene una experiencia usable aunque la API falle cuando sea razonable: fallback local con `localStorage` y estado visible.
- Mantiene cambios pequenos y coherentes; no agregues abstracciones que no ayuden.

## Package root

Configura el root como monorepo privado con npm workspaces:

- Workspaces: `apps/*` y `packages/*`.
- Node `20.x` y npm `10.x`.
- TypeScript en modo ESM.
- Scripts esperados:
  - `npm run dev`: compila dominio y levanta API + web en paralelo.
  - `npm run dev:api`.
  - `npm run dev:web`.
  - `npm run build`: dominio, web y API.
  - `npm run test`: dominio + todos los workspaces.
  - `npm run test:coverage`.
  - `npm run lint`.
  - `npm run e2e`.
  - `npm run e2e:open`.
  - `npm run check`: lint, tests, build y E2E.
  - `npm start`: arranca la API compilada.

Usa `concurrently`, `cross-env`, `start-server-and-test`, `tsx`, `typescript`, `eslint`, `prettier`, `vitest` y `cypress` cuando corresponda.

## Paquete domain

Construye `packages/domain` como la fuente de verdad de la logica de negocio.

Debe contener:

- `schemas.ts` con un schema Zod por coleccion o entidad.
- `collectionSchemas` y `collectionNames` para que la API pueda validar CRUD generico.
- `demoData.ts` con `BASE`, datos iniciales o fixtures reales adaptados al nuevo negocio.
- `createInitialState()` para generar el estado inicial completo.
- Modulos de funciones puras para calculos, derivaciones, normalizaciones o reglas del dominio.
- `index.ts` exportando solo la superficie publica.

Si el dominio incluye datos base modificables, no los dejes solo como `BASE` estatico. Modelalos como una o varias colecciones editables dentro del estado inicial, por ejemplo `configuracion`, `ingresosFijos`, `gastosFijos`, `categorias`, `tarifas`, `clientes`, `productos` o el nombre que corresponda al negocio.

Patron recomendado para schemas:

- IDs aceptan string o number cuando haga falta migrar datos.
- Campos numericos usan `z.coerce.number().finite().default(0)` si llegan desde formularios.
- Textos opcionales usan `z.string().optional().default("")`.
- Booleans usan `z.coerce.boolean().default(false)`.
- Fechas se guardan como strings ISO `YYYY-MM-DD` o meses `YYYY-MM`, segun el caso.

Las reglas de negocio deben tener tests que cubran:

- Casos felices.
- Bordes de fechas, meses, importes, estados o periodos.
- Datos incompletos o importados desde formularios.
- Reglas de prorrateo, acumulados, estados derivados o totales si existen.

## API

Construye `apps/api` con Express y TypeScript ESM.

Capas esperadas:

- `application/`: servicios de caso de uso, tipos e interfaces.
- `infrastructure/`: repositorios concretos y adaptadores externos.
- `interfaces/http/`: routers, middleware de auth, errores y request handlers.
- `config/`: variables de entorno parseadas en un objeto `env`.

Patrones obligatorios:

- `createApp({ repository, userRepository, authConfig })` debe crear la app Express con dependencias inyectadas.
- `AppStateService` debe operar contra una interfaz `StateRepository`.
- `StateRepository` debe exponer `read(ownerId?: string)` y `write(state, ownerId?: string)`.
- Implementa `MemoryStateRepository` para tests.
- Implementa `JsonStateRepository` para desarrollo local.
- Implementa `PostgresStateRepository` para produccion si existe `DATABASE_URL`.
- La seleccion del repositorio debe ocurrir en `main.ts` o en una factory clara.
- Implementa errores HTTP con `statusCode` y un middleware centralizado.

Endpoints minimos:

- `GET /api/health` devuelve `{ ok: true }`.
- `GET /api/auth/me` devuelve la sesion si la cookie es valida.
- `POST /api/auth/login` crea sesion.
- `POST /api/auth/register` registra usuario si hay repositorio de usuarios.
- `POST /api/auth/logout` limpia cookie.
- `GET /api/state` devuelve el estado del usuario autenticado.
- `PUT /api/state` reemplaza estado validando cada coleccion con schemas del dominio.
- `POST /api/state/reset` vuelve al estado inicial del dominio.
- `GET /api/:collection` lista una coleccion valida.
- `POST /api/:collection` crea item validado.
- `PUT /api/:collection/:id` actualiza item validado.
- `DELETE /api/:collection/:id` elimina item.

Auth esperada:

- Cookie HTTP-only.
- `sameSite: "lax"`.
- `secure: true` en produccion.
- JWT firmado con `AUTH_JWT_SECRET`.
- Password plano solo como fallback local de desarrollo; en produccion usar variables secretas o hash.
- `bcryptjs` para registrar o verificar hashes.
- `crypto.timingSafeEqual` para comparaciones sensibles cuando aplique.

Variables de entorno esperadas:

```bash
PORT=4000
CORS_ORIGIN=http://localhost:5173
DATA_FILE=./apps/api/data/state.json
USERS_FILE=./apps/api/data/users.json
DATABASE_URL=postgresql://...
AUTH_USERNAME=admin
AUTH_PASSWORD=admin
AUTH_PASSWORD_HASH=
AUTH_JWT_SECRET=dev-secret-change-me
AUTH_COOKIE_NAME=app_session
AUTH_SESSION_TTL_SECONDS=604800
```

## Frontend

Construye `apps/web` con React + Vite + TypeScript.

Patrones esperados:

- `App.tsx` funciona como shell autenticado: login primero, app despues.
- `services/apiClient.ts` centraliza `fetch`, `credentials: "include"`, errores HTTP y `VITE_API_URL`.
- `hooks/useAuth.ts` maneja sesion, login, registro, logout y errores.
- `hooks/useAppState.ts` hidrata desde API, persiste cambios con debounce y usa `localStorage` como fallback.
- Un hook de datos derivados por dominio, por ejemplo `useDatosMes`, `useDashboardData` o equivalente, debe llamar funciones puras de `packages/domain`.
- `features/<modulo>/` contiene pantallas, paneles y modales de cada workflow real.
- `components/` contiene elementos reutilizables como modal, login, menus o controles comunes.
- `constants/` contiene colores, categorias, estados, labels o configuracion visual no dinamica.
- `utils/` contiene fechas, formato y helpers pequenos.

Cada feature que muestre datos importados debe permitir editarlos. Si una pantalla tiene una tabla o lista de datos operativos, debe tener acciones visibles para agregar, editar y eliminar registros. Si hay datos base que alimentan KPIs o calculos, incluye una pantalla o seccion de configuracion para modificarlos sin tocar codigo.

El frontend debe estar orientado a uso real, no a landing page:

- La primera pantalla tras login debe ser la herramienta usable.
- Usa tabs o navegacion clara para los workflows principales.
- Incluye KPIs, listas, formularios, modales, estados vacios y feedback de sincronizacion.
- La UI debe ser responsive para movil, tablet y desktop.
- No mezcles reglas de negocio complejas dentro de JSX; deriva datos en hooks o dominio.
- Evita que los componentes feature hagan llamadas HTTP directas.

## Persistencia y sincronizacion

Implementa una estrategia similar a esta:

- En frontend, cargar primero estado local si existe para tener respuesta inmediata.
- Intentar hidratar desde `/api/state`.
- Si la API responde, guardar remoto y cachear local.
- Si la API falla, continuar en modo local y mostrar estado de sincronizacion.
- Al cambiar una coleccion, actualizar estado local inmediatamente.
- Persistir estado completo con debounce a `/api/state`.
- En API, aislar datos por usuario autenticado usando `ownerId`.
- En JSON local, soportar migracion de estado unico a estado por usuario.
- En PostgreSQL, guardar inicialmente como JSONB por usuario para simplicidad, con posibilidad futura de normalizar tablas.
- Los seeds iniciales solo deben usarse para crear el primer estado o para resetear bajo accion explicita; despues, los cambios del usuario mandan.
- No sobrescribas cambios editados por el usuario cada vez que arranca la app.

## Tests obligatorios

Cubre el proyecto por capas:

### Domain

- Tests de schemas y coerciones.
- Tests de reglas puras.
- Tests de datos iniciales si hay invariantes importantes.

### API

- Tests de servicios con `MemoryStateRepository`.
- Tests HTTP con Supertest.
- Auth: login valido, login invalido, logout, `/me` y rutas protegidas.
- Estado aislado por usuario.
- CRUD de colecciones.
- Validacion 422 para payloads invalidos.
- 404 para colecciones o items inexistentes.

### Web

- Tests de hooks con mocks de `apiClient`.
- Tests de componentes criticos con Testing Library.
- Tests de modales/formularios principales.
- Test de shell autenticado.

### E2E

- Login completo.
- Navegacion por secciones principales.
- Crear un item real desde UI y verificar persistencia via API.
- Editar y eliminar al menos un item importado desde datos iniciales y verificar persistencia via API.
- Reset de estado para aislar cada test.

## Deploy

Incluye `render.yaml` para desplegar un unico servicio Node:

- Build: `npm ci --include=dev && npm run build`.
- Start: `npm start`.
- `NODE_ENV=production`.
- `DATABASE_URL` como secret opcional.
- `AUTH_USERNAME`, `AUTH_PASSWORD` y `AUTH_JWT_SECRET` como variables.

En produccion, la API debe servir `apps/web/dist` con `express.static` y fallback a `index.html`.

## README

Documenta como minimo:

- Que es la app y que problema resuelve.
- Estructura del monorepo.
- Comandos principales.
- Variables de entorno.
- Como correr dev, tests, coverage, build y E2E.
- Persistencia local vs PostgreSQL.
- Auth local vs produccion.
- Pasos de deploy.

## Metodo de trabajo esperado

Trabaja de forma incremental:

1. Lee el repo y las logicas de negocio disponibles.
2. Propone el modelo de dominio y confirma supuestos.
3. Crea el monorepo y configs base.
4. Implementa `packages/domain` primero con tests.
5. Implementa API con repositorios, auth, routers y tests.
6. Implementa frontend con shell, hooks, features y tests.
7. Implementa E2E.
8. Ejecuta `npm run check` o, si tarda demasiado, al menos `npm run lint`, `npm run test` y `npm run build`.
9. Entrega un resumen con archivos clave, comandos ejecutados y pendientes reales.

## Criterios de aceptacion

La tarea esta terminada cuando:

- El repo instala dependencias sin errores.
- `npm run dev` levanta API y web.
- El usuario puede registrarse o iniciar sesion.
- La app muestra una experiencia funcional del dominio, no una pagina de marketing.
- Los datos se pueden crear, editar, eliminar, resetear y persistir.
- Los datos importados desde tablas o seeds iniciales no son solo lectura: todos tienen una ruta clara de edicion en la UI y se guardan en la persistencia.
- La logica de negocio principal vive en `packages/domain` y esta testeada.
- La API valida con Zod y devuelve errores consistentes.
- El frontend usa hooks y servicios, no llamadas HTTP dispersas.
- Hay tests unitarios, API, frontend y E2E representativos.
- `npm run build` funciona.
- El README permite a otra persona correr y desplegar la app.

## Importante

- No copies datos personales, nombres, categorias o textos de Sofi Marqui salvo que yo lo pida expresamente.
- Adapta todo al nuevo dominio que te pase.
- Si la nueva app tiene otra logica de negocio, conserva la arquitectura y cambia las entidades, reglas, workflows y UI.
- No metas reglas criticas solo en componentes React.
- No dejes tablas importadas como arrays hardcodeados de solo lectura si el usuario debe poder cambiarlas.
- No dejes secrets hardcodeados para produccion.
- No uses una base de datos obligatoria para desarrollo local: debe haber fallback JSON o memoria.
- No termines con solo scaffolding: deja una aplicacion usable de punta a punta.

Ahora empieza analizando las logicas de negocio disponibles y construye la aplicacion siguiendo esta arquitectura.