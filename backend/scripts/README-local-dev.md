# Entorno local de prueba (aislado de producción)

Para probar cambios de UI/datos sin tocar nunca la base de Neon (compartida
con producción), usar una base Postgres descartable en Docker.

## 1. Levantar la base descartable

```sh
docker run -d --name sul-test-db -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=suldev -p 5444:5432 postgres:16-alpine
```

Si ya existe (de una sesión anterior), simplemente arrancarla de nuevo:

```sh
docker start sul-test-db
```

## 2. Levantar el backend apuntando a esa base (puerto 4001, no 3000 — evita choques con otros proyectos)

Desde `backend/`:

```sh
PORT=4001 DATABASE_URL="postgresql://postgres:testpass@localhost:5444/suldev" npx ts-node src/server.ts
```

El propio `initDB()` crea el esquema y siembra dos cuentas la primera vez:
- Admin: `admin@sul.com` / `admin123`
- Cliente: `cliente@sul.com` / `SULcongelados2026`

## 3. Cargar productos de ejemplo

Desde `backend/`:

```sh
node scripts/seed-local-test-data.js
```

Idempotente — correrlo de nuevo actualiza los mismos SKUs en vez de duplicar.

## 4. Apuntar el frontend ahí

Crear/editar `frontend/.env.local` (gitignored, no se commitea):

```
VITE_API_URL=http://127.0.0.1:4001/api
```

Reiniciar `npm run dev` en `frontend/` para que tome el cambio (Vite no
recarga en caliente las variables de entorno).

## Para volver a producción/Neon

Borrar o comentar `frontend/.env.local` y reiniciar el dev server — vuelve
a usar el `VITE_API_URL` de siempre (o `localhost:3000` por default).

## Limpieza

```sh
docker stop sul-test-db && docker rm sul-test-db
```
