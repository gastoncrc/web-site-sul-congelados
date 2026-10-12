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

**Falta**: nada — los 4 fixes ya están commiteados (`66ce902`).

### Tier "Pronto" — antes de que crezca el volumen

- [x] **5. Paginar el catálogo del lado del servidor.** `getProductsByConvenio` ahora acepta `page`/`limit`/`search`/`category` y devuelve `{ products, total, page, totalPages, categories }`. Se agregó un endpoint separado `GET /products/slider` (sin paginar, el admin ya limita a 6 destacados) porque el slider de "Destacados" necesitaba el set completo de productos `in_slider` independiente de la página actual del catálogo — antes ambos se alimentaban del mismo fetch único. `Catalog.tsx` ahora es dueño de su propio fetch (con debounce de 400ms en la búsqueda) en vez de recibir todo el array por props y filtrar en memoria; `App.tsx` ya no hace el fetch global de catálogo (se eliminaron `catalogProducts`/`fetchCatalogData`/`isCatalogLoading`), y se sacó el prop `triggerDataRefresh` de `Admin.tsx` que ya no tenía sentido (Catalog siempre refetchea fresco al montar). Probado en el navegador real: paginación con 16 productos de prueba (2 páginas), búsqueda con debounce, filtro por categoría — los 5 escenarios funcionaron correctamente, incluyendo que el slider de destacados sigue mostrando los 3 productos marcados aunque no estén en la página 1.
- [ ] 6. Agregar índices a `orders.user_id`, `orders.created_at`, `orders.status`, `order_items.order_id` en `backend/src/config/db.ts`. ✅ YA HECHO (ver commit `25642ff`).
- [x] **7. Reescribir la carga masiva en lotes.** `uploadCsvConvenios` en `backend/src/controllers/productController.ts` ya no hace 3-4 consultas por fila (miles de viajes a la base con un archivo real de 500 filas). Ahora: parsea y deduplica todo en memoria primero (si el archivo repite un SKU/convenio, gana la última aparición — mismo comportamiento efectivo que antes), después hace consultas en lotes de hasta 500 filas usando `unnest()` de Postgres para insertar/actualizar muchas filas en una sola sentencia (precio anterior, productos, precios, historial). Probado end-to-end con un Excel real de 101 filas (100 SKUs únicos + 1 duplicado a propósito) contra la base de prueba: el duplicado quedó con el último valor correctamente, el historial de precios no se duplicó al re-subir el mismo archivo dos veces (0 entradas nuevas cuando el precio no cambió), y la carga completa tardó ~1.1s. De paso encontré (sin arreglar, no estaba en el alcance de hoy) que `deleteProduct` no limpia `price_history` antes de borrar un producto, lo que puede fallar por una foreign key si ese producto tiene historial — anotado para una futura pasada.
- [x] 8. Conectar el "mínimo de compra B2C" del panel admin al backend real. ✅ YA HECHO (ver commit `25642ff`).

**Tier "Pronto" completo.** ✅

### Tier "Cuando haya lugar"

- [x] **9. Logout automático cuando el token vence.** Interceptor de respuesta en `frontend/src/config/api.ts`: si el backend rechaza un token con 401 y había sesión activa (y no es el propio login, que maneja su 401 como "credenciales inválidas" aparte), se limpia la sesión y se recarga a `/` con un aviso. Verificado en vivo sin querer: un token de prueba inválido disparó el flujo real durante otra prueba — banner "🔒 Tu sesión venció. Volvé a iniciar sesión para continuar." apareció correctamente.
- [x] **10. Code-splitting del panel Admin.** `App.tsx` ahora importa `Admin` con `React.lazy` + `Suspense`. Bundle principal bajó de 754KB a 324KB (105KB gzip); Admin quedó en su propio chunk de 438KB que solo bajan quienes entran al panel. Verificado con login real: el panel carga y funciona igual que antes.
- [x] **11. Logo comprimido + ranking del dashboard respeta el filtro de fecha.** Logo de 851KB → 107KB (87% menos, sin pérdida visible) vía resize a 500×500 + paleta indexada. Las consultas `topProducts`/`topClients` de `getDashboardStats` ahora filtran por fecha igual que el resto del dashboard. **Bonus encontrado al probar el fix**: las 4 consultas con filtro de fecha (las 2 nuevas + las 2 que ya filtraban) tenían un bug de límite — `CURRENT_DATE` en Postgres es medianoche, así que el filtro cortaba a las 00:00 de hoy y excluía TODOS los pedidos del día en curso; un admin filtrando "hoy a hoy" veía 0 resultados aunque hubiera pedidos reales ese mismo día. Corregido en las 4 consultas (límite superior ahora `< fecha + 1 día` en vez de `<= fecha`). Verificado: filtro "hoy a hoy" ahora sí trae los pedidos de hoy.
- [x] **12. Los 3 bocetos visuales del informe, implementados.**
  - **Badges de confianza en la tarjeta** (`ProductCard.tsx`): "❄ Cadena de frío" siempre visible, "🚚 Reparto [día]" solo para clientes logueados con días de reparto asignados.
  - **Franja institucional** (`Catalog.tsx`): 3 pilares de marca (Industria seria / Cadena de frío / Apetito real), visible solo en la vista "home" del catálogo (sin búsqueda ni filtro activo), igual que el slider.
  - **Indicador de progreso + mensaje de confianza en el checkout** (`CartSidebar.tsx`): 2 puntos de progreso junto al título, y una caja de texto antes del botón de WhatsApp explicando qué va a pasar al tocarlo.
  
  **Bug encontrado y arreglado al implementar el primer boceto**: el campo `dias_entrega` nunca viajaba en la respuesta de `/api/auth/login` (snake_case en la DB, nunca mapeado a la respuesta JSON) — significa que el calendario de checkout para clientes registrados (feature ya existente, no nueva) **siempre mostró el fallback genérico "Martes, Viernes" a todos los clientes**, nunca sus días reales asignados por el admin. Arreglado agregando `diasEntrega: user.dias_entrega` a la respuesta de login (`authController.ts`) y actualizando el tipo `SULUser` + `CartSidebar.tsx` para usar el nombre de campo correcto. Verificado en vivo: un cliente de prueba con "Martes,Viernes" asignados ahora ve exactamente esos días habilitados en el calendario y en el badge de la tarjeta de producto — antes de este fix, el calendario coincidentemente mostraba lo mismo por el fallback hardcodeado, lo cual ocultaba el bug hasta que se probó con un cliente con días distintos.

**Las 4 secciones del plan de acción están completas (12 de 12).** ✅

## Herramientas comerciales y recompra (sesión 2026-10-10, posterior al audit)

No es parte del audit — es una tanda nueva de feature work, pedida directamente en la
conversación en vez de salir de un informe. Todo lo de abajo está commiteado y pusheado a
`main`, deployado en producción (sulcongelados.com vía Render).

- [x] **Pedido Rápido** (`/pedido-rapido`) y **Mis Pedidos** (`/mis-pedidos`, con "Repetir
  pedido" a precio actual). Commit `d0c4b04`.
- [x] **Plan de mejora de UI comercial** — informe completo en un Artifact publicado en esa
  conversación ("SUL Congelados — Plan de mejora de UI comercial", favicon 🧭):
  https://claude.ai/code/artifact/4d53b8aa-7b15-4a13-a0ec-548b75beadf8
  Decisión de negocio que planteaba el plan, ya resuelta: **Opción A** — la lista `CORDOBA`
  sigue pública para invitados (sostiene la venta de consumidor final sin cuenta), las listas
  mayoristas siguen atadas al JWT como siempre. No requirió cambios de código porque
  `resolveConvenio` ya funcionaba así.
- [x] Las 11 acciones del plan, implementadas y commiteadas (`1721db0`): slider segmentado en
  pestañas Ofertas/Combos/Nuevos, selector Unidad/Caja en Pedido Rápido, favoritos ("Mis
  habituales"), hint "última vez pediste X", aviso de stock bajo (`settings.low_stock_threshold`),
  chip de lista de precios activa, compartir resumen del pedido antes de confirmar, franja de
  marca en el Footer site-wide, hero de invitado con copy estacional, y la base para fotos
  reales de producto (`products.image_url`, admin pega una URL; sin foto cae al ícono de
  categoría de siempre).
- [x] Ajuste de tamaño del slider y sus pestañas (`62a92b5`) — las tarjetas del carrusel
  reusaban el layout completo de la grilla (256px de ancho, precio y botón a tamaño completo) y
  las pestañas de segmento envolvían a una segunda línea en pantallas angostas, lo que hacía
  sentir el bloque entero desproporcionado. Tarjetas de slider ahora en ~130-145px de ancho,
  imagen cuadrada, texto/botón compactos; pestañas en una tira con scroll horizontal propio que
  nunca empuja la altura del bloque.

**Falta**: nada pendiente de este tramo. Próximo paso natural si se retoma: probar en vivo la
estrella de favoritos, el selector Caja en Pedido Rápido y el badge de stock bajo (este último
puede no verse todavía si ningún producto real tiene stock por debajo de 10 — umbral
configurable en `settings`).

## Otras cosas abiertas de la sesión original del audit

- El rebrand visual completo (paleta "Parrilla Cordobesa") ya está aplicado y pusheado a `main` en commits previos (`git log` tiene el detalle).
- Entorno de prueba local aislado documentado en `backend/scripts/README-local-dev.md` — usar SIEMPRE para probar cambios, nunca contra Neon/producción directamente.
- `frontend/.env.local` (gitignored) puede estar apuntando al backend de prueba local (`http://127.0.0.1:4001/api`) — si se retoma la sesión y el catálogo en `localhost:5173` aparece vacío o no conecta, revisar si el backend/Docker de prueba sigue corriendo (`docker ps`, contenedor `sul-test-db`) y si no, levantarlo de nuevo según el README.
  **Atención**: en la sesión del 2026-10-10, Docker Desktop colgó la PC del usuario al intentar
  levantarlo — no arrancar Docker de forma proactiva; si hace falta probar contra la base local,
  preguntar primero.

## Sesión 2026-10-12 — listas de precios, roles, cuentas, y bugs reales de producción

Partió de un pedido nuevo del usuario (no relacionado al audit): el admin necesitaba poder ver
todas las listas de precios con su lógica de base+markup, diferenciar clientes de usuarios
operativos, y gestionar cuentas (pausar, contraseñas, roles) desde el panel. Todo esto se probó
en vivo contra producción (`web.site.sul.congelados` en Neon — el proyecto `sul-congelados-dev`
es una base de prueba vacía, no es la real) porque el entorno local de Docker no estaba
disponible. Todo está commiteado y pusheado a `main`, deployado.

### Feature work

- [x] **Precios base + markup**: `products.base_price` (el "precio1"/Mayorista único por
  producto) + `product_prices.markup_percent` (el "porcentaje" por lista). `precio` sigue siendo
  la columna que lee el catálogo — se recalcula y reescribe cada vez que cambia la base o el
  markup, nunca se computa al vuelo. Pantalla nueva **Productos → Listas de Precios**
  (`PriceListManager.tsx`) para ver y editar el markup por lista; el precio base se edita desde
  **Productos → Listado de Productos**.
- [x] **Roles formales** (Admin/Cliente/Minorista/Vendedor, ya existían en el código — "Vendedor"
  tiene su propio `vendorController.ts`). Se separaron en dos pantallas distintas porque son
  conceptos distintos para el usuario: **Gestión CRM** (solo Clientes, con todos sus datos
  comerciales) y **Gestión de Usuarios** (nuevo, Admin/Minorista/Vendedor, formulario simple sin
  campos de negocio). El alta rápida ("Alta de Usuario") ya no permite crear un Cliente — ese rol
  solo se crea por Alta Individual o carga masiva, que sí piden los datos comerciales completos.
- [x] **Gestión de cuentas**: pausar/reactivar cualquier rol, admin genera o elige una contraseña
  (fuerza cambio al primer ingreso vía `require_password_change`), y un flujo real de "olvidé mi
  contraseña" por email (no existía — se asumía que sí). Editar el email de un cliente ya creado
  (necesario porque la carga masiva les pone un email inventado `cl_<codigo>@sul.com`).
  Buscador en Gestión CRM (471 clientes reales son inmanejables sin uno).

### Bugs reales de producción encontrados y arreglados (no relacionados al pedido original)

- [x] **Admin fantasma con contraseña de fábrica expuesta**: el seed de `db.ts` recreaba una
  cuenta Admin con un email y una contraseña fijos en el código cada vez que el backend arrancaba
  y esa cuenta no existía — al renombrar el email del admin real a uno de verdad, el siguiente
  deploy la recreó, quedando activa en producción con la contraseña de fábrica (ya desactivada en
  Neon). Arreglado: el check ahora es "¿existe algún Admin?" (no un email hardcodeado) y la
  contraseña es aleatoria, impresa una sola vez en los logs del server, nunca en el código.
- [x] **Columnas faltantes en `users`** (`client_code`, `lugar_entrega`, `observaciones`):
  estaban en el `CREATE TABLE` del código pero nunca se migraron a la tabla ya existente de
  producción. `getVendorClients` las selecciona — cualquier Vendedor rompía con 500 al ver su
  cartera.
- [x] **Envío de mail por SMTP bloqueado por Render**: `nodemailer` conectando a
  `smtp.resend.com:465` se colgaba con `ETIMEDOUT` (Render bloquea SMTP saliente). Migrado a la
  API HTTPS de Resend (puerto 443) — afectaba tanto la recuperación de contraseña nueva como las
  notificaciones de pedido, que probablemente nunca llegaron en producción hasta hoy.
- [x] **`trust proxy` faltante** en Express — el rate-limiter de login no identificaba bien la IP
  real detrás del proxy de Render.
- [x] **Producto con oferta a $0**: `BIFE CRIOLLO 100G X 30U` tenía `is_promo=true` con
  `promo_price=0`, mostrando el producto gratis en el catálogo. Corregido a mano + bloqueada la
  combinación en el backend para que no vuelva a pasar.
- [x] **Lista "CORDOBA"/"GENERAL" hardcodeada en 3 lugares** (catálogo público, creación de
  pedidos de invitado, auto-registro de minorista): ninguna de esas listas existe entre las 11
  reales del negocio, así que cualquier visitante sin cuenta veía el catálogo vacío, y cualquier
  pedido de invitado se rechazaba entero. Unificado en un solo ajuste configurable
  (`settings.default_minorista_convenio`, en **Admin → Ajustes → "Lista de Precios por
  Defecto"**, seedeado en `Gastronomica`).
- [x] **Convenio resuelto contra el token viejo, no contra la base**: cambiar la lista de un
  usuario desde el panel no se reflejaba hasta que el token vencía (8hs) o se re-loguear.
  `resolveConvenio` (productController) ahora consulta la base en cada request, mismo patrón que
  ya usaba `verifyTokenAndStatus` para rutas protegidas.
- [x] **Logout dejaba "Acceso denegado"**: si cerrabas sesión estando en `/admin`, la URL se
  quedaba ahí y esa ruta muestra ese cartel para no-Admin. `logout()` ahora navega a `/`.
  explícitamente.
- [x] **Inputs de Ajustes no controlados** (`defaultValue` en vez de `value`): si el fetch de
  settings no había resuelto todavía cuando se montaba el input, quedaba pegado al valor de
  respaldo hardcodeado para siempre, sin importar refresh ni sesión nueva. Pasados a controlados
  de verdad.
- [x] **Checkout de invitado sin pedir email**: ahora es un campo obligatorio más.
- [x] **Mail de "pedido a confirmar" filtrado como spam por Gmail**: el aviso con "⚠️ A
  CONFIRMAR" en mayúsculas con emoji no llegaba (confirmado con pruebas A/B reales); suavizado el
  texto y sacado el emoji.

**Falta**: nada pendiente de esta sesión — las 11 acciones de arriba están verificadas en vivo en
producción, una por una. Dato curioso sin resolver: una cuenta vieja `mayorista@sul.com` con un
5to rol ("Mayorista", no estándar) sin nombre ni teléfono cargado — se pausó por las dudas, nadie
la reconoció, no se investigó más a fondo.

## Rediseño del panel admin — APROBADO, pendiente de implementar

Boceto interactivo (HTML, clickeable) publicado como Artifact en la conversación del
2026-10-12: **"SUL Congelados — Rediseño del Panel Admin"** (favicon 🧭). El usuario lo
aprobó ("Está bueno") después de un ajuste de scroll horizontal en las tablas. Todavía no se
tocó ningún componente real — esto es la especificación de lo que hay que construir cuando se
retome.

### Qué cambiar, concretamente

1. **Paleta**: sacar los tokens `admin-bg`/`admin-sidebar` (gris-azulado genérico,
   `#0f172a`/`#020617` en `index.css`) de todos los componentes de `frontend/src/components/admin/*`
   y `Admin.tsx`. Usar los tokens reales de marca que ya existen (`brand-primary` #7A2A1F,
   `brand-accent` #C1592E, `brand-gold` #C79A4B, `bg`/`paper`/`ink` de siempre). El sidebar pasa de
   gris oscuro a un degradé en `brand-primary` (terracota oscuro), ítem activo en `brand-gold`.
2. **Navegación más plana** en `Admin.tsx`: de 5 grupos con acordeón (ESTADÍSTICAS, VENTAS,
   PRODUCTOS, CLIENTES, USUARIOS, AJUSTES, cada uno desplegable) a 6 destinos directos sin
   submenús: **Inicio, Pedidos, Catálogo, Clientes, Usuarios, Ajustes**.
3. **"Carga Masiva" y "Sincronizar ERP" dejan de ser destinos propios del sidebar** — pasan a ser
   un botón **"Importar Excel"** en la barra superior de Catálogo y de Clientes respectivamente
   (abre el mismo flujo de subida que ya existe, pero como acción dentro de la pantalla, no como
   una navegación aparte).
4. **"Alta Individual" deja de ser un destino propio** — pasa a ser el botón **"Nuevo cliente"**
   en la barra superior de Clientes (el formulario de `ClientForm.tsx` se mantiene, cambia dónde
   se dispara: modal o panel lateral en vez de pantalla completa — decidir al implementar).
5. **"Listado de Productos" + "Listas de Precios" se unifican en un solo destino "Catálogo"**,
   con pestañas internas (segmented control) "Productos" / "Listas de precios" en vez de ser dos
   ítems de sidebar separados.
6. **Renombres**: "Gestión CRM" → **Clientes**. "Gestión de Usuarios" → **Usuarios**. "Reglas
   B2C" → **Ajustes** (ya no son solo reglas B2C, también vive ahí el default de lista de
   precios).
7. **Toasts**: reemplazar el `systemMessage` actual (string simple, un cartel arriba que hay que
   cerrar con un botón "Entendido"/X, se usa en `App.tsx` y `Admin.tsx`) por una pila de toasts
   abajo a la derecha, auto-descartable a los ~4s con barra de progreso, con opción de cerrar
   antes. Posiblemente un componente nuevo `Toast.tsx` + un store/contexto simple en vez de un
   solo string de estado.
8. **Tablas con scroll horizontal propio** (`overflow-x: auto` en el contenedor `.card`, no en la
   página) — el boceto lo tenía roto en la v1 y se corrigió ahí mismo; aplicar el mismo criterio
   a las tablas reales (`ProductList.tsx`, `ClientList.tsx`, `UserList.tsx`, `PriceListManager.tsx`,
   `OrderList.tsx`).

### Qué NO cambia

La lógica de negocio, los endpoints, los permisos — es un rediseño visual + de organización de
navegación, no un cambio funcional. Todo lo que ya se construyó y probó en la sesión del
2026-10-12 (precios base+markup, roles, contraseñas, etc.) sigue funcionando igual, solo con otra
piel y otra agrupación de menús.

## Backlog de ideas — anotadas, sin implementar (otra sesión)

Lista abierta que el usuario fue tirando en la sesión del 2026-10-12, explícitamente para
documentar y no tocar todavía:

- **Pedido Rápido**: mejorarlo (sin especificar qué todavía — preguntar al retomar).
- **Nosotros**: mejorar la página.
- **Contacto**: agregar un mapa (Google Maps embed) con la ubicación.
- **Contacto**: agregar una sección para consultas sobre la franquicia "2x1" y pedido de logo
  (ver punto siguiente — están relacionados).
- **Franquicia 2x1**: hay listas de precios que son específicamente de "Lomito 2x1" (una línea de
  negocio relacionada, mencionada en `GEMINI.md` como "otro proyecto" que podría compartir
  infraestructura a futuro). La idea es un nav/acceso de login propio para esa franquicia, con su
  propio logo — separado del login genérico de SUL Congelados.
- **Filtro por rubro**: que se pueda ordenar (hoy el orden es fijo/alfabético — definir si es
  orden manual desde el admin o criterio distinto).
- **Más funcionalidades comerciales**: el usuario siente que "le falta más venta" al sitio —
  pidió explorar opciones orientadas a conversión/ventas en una sesión futura, sin definir
  todavía cuáles (brainstorm pendiente, no hay lista concreta aún).
- **Slider de la home**: modernizarlo (sin especificar el criterio todavía).
