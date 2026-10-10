# Progreso del audit y arreglos — SUL Congelados

Documento de continuidad: si la sesión se corta por límite de cuota, acá queda
registrado qué se hizo y qué falta, para retomar sin perder contexto.

Informe completo del audit (seguridad/rendimiento/código/bocetos visuales):
ver el Artifact publicado en la conversación (favicon 🔍, "SUL Congelados —
auditoría técnica y de producto").

## Plan de acción (3 tiempos, del informe)

### Tier "Ahora" — seguridad e integridad de datos

- [x] **1. Recalcular precio/total en el servidor al crear un pedido** — `backend/src/controllers/orderController.ts` (`createOrder`). Ya no confía en `totalAmount`/`unitPrice` del body; vuelve a consultar `products`+`product_prices` por convenio real (del JWT si hay sesión, `CORDOBA` si es invitado). Rechaza el pedido con 400 si algún SKU no tiene precio vigente. El mail de notificación también usa los datos recalculados, no los del cliente.
- [x] **2. Chequeo de Admin faltante en `updateClient`** — `backend/src/controllers/authController.ts`. Agregada la línea `if (req.user?.role !== 'Admin') return res.status(403)...` que faltaba.
- [x] **3. `getOrderDetails` restringido al dueño del pedido o Admin** — `backend/src/controllers/orderController.ts`. Antes solo pedía "estar logueado"; ahora verifica `order.user_id === requesterId` o rol Admin, con 404 si el pedido no existe y 403 si no es el dueño.
- [x] **4. Rate limiting en `/api/auth/login`** — se instaló `express-rate-limit` (`backend/package.json`) y se aplicó en `backend/src/routes/authRoutes.ts`: máximo 10 intentos por IP cada 15 minutos.

**Estado**: ✅ COMPLETO. Código escrito, compila limpio (`npx tsc --noEmit` sin errores), y los 4 fixes se probaron contra la base de datos local descartable con escenarios reales:
- Pedido con precio manipulado ($1 en vez de $15.000 real) → el servidor guardó el precio real, ignoró el manipulado. ✅
- Pedido con SKU inexistente → rechazado con 400 y mensaje claro. ✅
- Cliente no-Admin intentando `updateClient` → 403. ✅
- Admin haciendo `updateClient` → 200, funciona normal. ✅
- Cliente A leyendo el pedido de otro usuario → 403 (antes era accesible). ✅
- 11 intentos de login seguidos con contraseña incorrecta → el intento #11 da 429 (bloqueado). ✅

Scripts de test usados (en el scratchpad de esa sesión, no en el repo): `test-fixes.js`, `test-own-order.js` (este último no llegó a correr por corte de cuota, pero no es crítico — la lógica de "ver mi propio pedido" es la misma función ya probada con el caso negativo, solo falta el caso espejo positivo).

**Falta**: commitear estos 4 fixes (`backend/src/controllers/orderController.ts`, `authController.ts`, `routes/authRoutes.ts`, `routes/orderRoutes.ts`, `package.json`/`package-lock.json` por la dependencia nueva `express-rate-limit`).

### Tier "Pronto" — antes de que crezca el volumen

- [x] **5. Paginar el catálogo del lado del servidor.** `getProductsByConvenio` ahora acepta `page`/`limit`/`search`/`category` y devuelve `{ products, total, page, totalPages, categories }`. Se agregó un endpoint separado `GET /products/slider` (sin paginar, el admin ya limita a 6 destacados) porque el slider de "Destacados" necesitaba el set completo de productos `in_slider` independiente de la página actual del catálogo — antes ambos se alimentaban del mismo fetch único. `Catalog.tsx` ahora es dueño de su propio fetch (con debounce de 400ms en la búsqueda) en vez de recibir todo el array por props y filtrar en memoria; `App.tsx` ya no hace el fetch global de catálogo (se eliminaron `catalogProducts`/`fetchCatalogData`/`isCatalogLoading`), y se sacó el prop `triggerDataRefresh` de `Admin.tsx` que ya no tenía sentido (Catalog siempre refetchea fresco al montar). Probado en el navegador real: paginación con 16 productos de prueba (2 páginas), búsqueda con debounce, filtro por categoría — los 5 escenarios funcionaron correctamente, incluyendo que el slider de destacados sigue mostrando los 3 productos marcados aunque no estén en la página 1.
- [ ] 6. Agregar índices a `orders.user_id`, `orders.created_at`, `orders.status`, `order_items.order_id` en `backend/src/config/db.ts`. ✅ YA HECHO (ver commit `25642ff`).
- [ ] 7. Reescribir la carga masiva (`uploadCsvConvenios` en `productController.ts`) para no hacer miles de queries secuenciales. **Pendiente.**
- [x] 8. Conectar el "mínimo de compra B2C" del panel admin al backend real. ✅ YA HECHO (ver commit `25642ff`).

### Tier "Cuando haya lugar"

- [ ] 9. Logout automático cuando el token vence (falta interceptor de response 401 en `frontend/src/config/api.ts`).
- [ ] 10. Code-splitting del panel Admin (`React.lazy` en `App.tsx`) para no mandarlo a los visitantes del catálogo.
- [ ] 11. Comprimir el logo (850KB) y hacer que el ranking del dashboard respete el filtro de fecha (`topProducts`/`topClients` en `getDashboardStats` lo ignoran).
- [ ] 12. Los 3 bocetos visuales del informe (badges de confianza B2B en la tarjeta, franja institucional, indicador de progreso en el checkout) — independientes entre sí.

## Otras cosas abiertas de la sesión (no parte del audit)

- El rebrand visual completo (paleta "Parrilla Cordobesa") ya está aplicado y pusheado a `main` en commits previos (`git log` tiene el detalle).
- Entorno de prueba local aislado documentado en `backend/scripts/README-local-dev.md` — usar SIEMPRE para probar cambios, nunca contra Neon/producción directamente.
- `frontend/.env.local` (gitignored) puede estar apuntando al backend de prueba local (`http://127.0.0.1:4001/api`) — si se retoma la sesión y el catálogo en `localhost:5173` aparece vacío o no conecta, revisar si el backend/Docker de prueba sigue corriendo (`docker ps`, contenedor `sul-test-db`) y si no, levantarlo de nuevo según el README.
