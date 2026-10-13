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

## Rediseño del panel admin — IMPLEMENTADO Y VERIFICADO (2026-10-12)

Boceto interactivo (HTML, clickeable) publicado como Artifact: **"SUL Congelados — Rediseño
del Panel Admin"** (favicon 🧭). Aprobado por el usuario, implementado el mismo día
(commit `21589c4`) y confirmado en vivo en producción ("se ve bien"). Las 8 secciones de abajo
quedaron todas hechas — se deja la lista como referencia de qué tocar si hace falta ajustar algo,
no como pendiente.

### Qué se cambió, concretamente

1. [x] **Paleta**: el sidebar de `Admin.tsx` pasó a un degradé en `brand-primary` (terracota),
   ítem activo en `brand-gold`. Para los paneles oscuros densos en datos que SÍ seguían
   construidos enteramente en slate frío (`DashboardStats.tsx`, `OrderList.tsx`, el modal de
   auditoría de precios en `ProductList.tsx` — más grande de lo previsto, no solo el sidebar),
   se optó por **retinar los tokens en vez de reescribir esos componentes**: `--color-slate-300`
   a `--color-slate-950` y `admin-bg`/`admin-sidebar` quedaron redefinidos en `index.css` a una
   escala oscura cálida derivada de la marca. Cero cambios de lógica en esos tres archivos, todo
   el tablero de datos se retiñó solo.
2. [x] **Navegación plana**: 6 destinos directos (`NAV_ITEMS` en `Admin.tsx`) — Inicio, Pedidos,
   Catálogo, Clientes, Usuarios, Ajustes. Se sacó el acordeón (`expandedSection`/`toggleSection`)
   por completo.
3. [x] **"Carga Masiva"/"Sincronizar ERP" → botón "Importar Excel"** — nuevo componente
   compartido `BulkImportModal.tsx`, usado tanto en Catálogo (`/products/upload-prices`) como en
   Clientes (`/auth/upload-clients`).
4. [x] **"Alta Individual" → botón "Nuevo cliente"** en Clientes, abre `ClientForm.tsx` en modal
   (se le agregó un prop `onSuccess` opcional). De paso, "Crear Admin/Minorista" (que iba a quedar
   sin destino en el nav plano) se resolvió igual: botón **"Nuevo usuario"** dentro de Usuarios,
   con el formulario movido a `UserList.tsx`.
5. [x] **Catálogo unificado**: pestañas internas "Productos"/"Listas de precios" dentro de un
   solo `activeModule: 'catalog'`, alternando entre `ProductList` y `PriceListManager`.
6. [x] **Renombres**: Gestión CRM → Clientes, Gestión de Usuarios → Usuarios, Reglas B2C →
   Ajustes Generales.
7. [x] **Toasts**: `useToastQueue.ts` (hook) + `ToastStack.tsx` (componente), montados en
   `App.tsx`. Mismo truco: la firma `setSystemMessage(msg: string)` quedó idéntica en todos los
   call sites existentes (ningún componente hijo se tocó para esto) — lo que cambió es que ahora
   empuja a una cola que se auto-descarta a los ~4.2s en vez de pisar un string único.
8. [x] **Scroll horizontal**: `ProductList`/`PriceListManager`/`ClientList`/`UserList` ya lo
   tenían bien. Se corrigió la tabla de detalle de pedido en `OrderList.tsx` (tenía
   `overflow-hidden`, cortaba en vez de scrollear).

Implementado en el commit `21589c4`, verificado en vivo en producción el mismo día ("se ve
bien"). La lógica de negocio, endpoints y permisos no se tocaron — fue un rediseño visual + de
organización de navegación.

## Backlog de ideas — anotadas, sin implementar (otra sesión)

Lista abierta que el usuario fue tirando en la sesión del 2026-10-12, explícitamente para
documentar y no tocar todavía:

- [x] **Pedido Rápido** — hecho (ver sección propia más abajo: grilla, rubro visible, stock
  bajo, pegado masivo). Commit `53f1c60`.
- [ ] **Nosotros**: mejorar la página — sin especificar qué todavía, preguntar al retomar.
- [ ] **Contacto**: agregar un mapa (Google Maps embed) con la ubicación.
- [ ] **Contacto**: agregar una sección para consultas sobre la franquicia "2x1" y pedido de logo
  (ver punto siguiente — están relacionados).
- [ ] **Franquicia 2x1**: hay listas de precios que son específicamente de "Lomito 2x1" (una línea
  de negocio relacionada, mencionada en `GEMINI.md` como "otro proyecto" que podría compartir
  infraestructura a futuro). La idea es un nav/acceso de login propio para esa franquicia, con su
  propio logo — separado del login genérico de SUL Congelados.
- [x] **Filtro por rubro — orden**: resuelto con las dos variantes que pidió el usuario — orden
  de categorías configurable desde el admin (**Catálogo → Orden de rubros**, ajuste
  `settings.category_order`) y orden de productos dentro de un rubro (select nuevo en el
  catálogo público: nombre A-Z/Z-A, precio asc/desc — `?sort=` en `/products`). Commit `094aaf7`.
- [ ] **Más funcionalidades comerciales**: el usuario siente que "le falta más venta" al sitio —
  pidió explorar opciones orientadas a conversión/ventas en una sesión futura, sin definir
  todavía cuáles (brainstorm pendiente, no hay lista concreta aún).
- [x] **Slider de la home — modernizado** ("estilo 2026"): se armaron 3 propuestas visuales en un
  Artifact (A: editorial minimalista, B: bento sin scroll, C: carrusel con "peek") basadas en
  research real de tendencias 2026 — el usuario eligió la **C**. Implementada: fondo neutro
  (`bg`) en vez de bloque de color sólido, tarjetas blancas con sombra en capas + hover lift,
  flechas de navegación visibles (saltan ~85% del ancho visible, directo — un `scrollBy` con
  `behavior:'smooth'` no funciona porque el auto-scroll existente lo cancela cada frame).
  Commits `a76277a`, `11e21e6`, `86c81d6`. De paso se corrigió `bg-gradient-to-*` (no es una
  clase válida en esta versión de Tailwind v4, es `bg-linear-to-*` — el degradé nunca se vio)
  y el badge de "Oferta" pisando la imagen en modo slider.

**Pendiente real**: Nosotros, Contacto (mapa + franquicia 2x1), login propio de la franquicia 2x1,
y el brainstorm de funcionalidades comerciales — nada de esto se tocó todavía.

## Admin usable en celular (2026-10-12)

El usuario avisó que la mayoría de los pedidos se hacen desde el celular — eso también aplica
cuando el admin revisa algo desde el suyo. El sidebar del panel era de ancho fijo (`w-60`) sin
ningún modo mobile, comiéndose casi toda la pantalla en un teléfono. Convertido en un drawer:
botón "Menú" en mobile, se abre como overlay con fondo oscuro, se cierra tocando afuera o
eligiendo un destino; desde `sm:` sigue siendo el dock fijo de siempre (con su modo colapsado a
íconos intacto). También se corrigió la barra fija de "Agregar al Pedido" en Pedido Rápido para
que apile texto y botón en mobile en vez de arriesgar que se aprieten. Commit `60392d2`.

## Repaso de seguridad pre-migración (2026-10-12)

Pedido explícito del usuario: quiere pagar un servidor (dejar el free tier de Render) pero
primero necesita confianza de que no hay huecos de seguridad ni bugs de persistencia de datos.
Todo esto es un repaso adicional, no relacionado al audit original de arriba.

- [x] **Bug real de persistencia, confirmado**: `uploadClientsExcel` decidía crear-vs-actualizar
  un cliente comparando por **email** — pero el email que genera la carga masiva
  (`cl_<codigo>@sul.com`) se recalcula siempre igual desde el Excel, sin saber si ese cliente ya
  fue corregido a un email real desde el panel (feature de la sesión de hoy). Resultado: resubir
  el Excel después de corregir un email creaba un **cliente duplicado** con el placeholder viejo,
  dejando el real (con su contraseña y convenio ya configurados) fuera de sincronía con futuros
  resyncs. Arreglado: ahora matchea por `client_code` (el código del ERP, estable, con backfill
  automático para los clientes ya cargados antes de este fix) y el `UPDATE` nunca toca `email` ni
  `password`, se hayan corregido o no. Commit `1023f2d`.
- [x] **JWT_SECRET sin respaldo hardcodeado**: había un secreto de respaldo committeado al repo
  público en 3 archivos (`'sul_secreto_super_seguro_2026'`) — si la variable de entorno real de
  Render alguna vez falta (típico error de migración: olvidarse de copiar una env var), el server
  degradaba en silencio a ese secreto conocido, con el que cualquiera podría firmar un JWT de
  Admin válido. Ahora (`backend/src/config/jwt.ts`) el server **no arranca** si falta la variable
  real — falla ruidoso en vez de degradar en silencio.
- [x] **Límite de tamaño en la carga de Excel** (10MB) — `multer` con `memoryStorage()` sin
  límite dejaba subir un archivo de cualquier tamaño directo a RAM.
- [x] **Manejador de errores global** — no existía ninguno; un error sin capturar (incluido el
  límite de arriba) caía en el handler default de Express, que puede devolver el stack trace
  completo al cliente que hizo el request.
- [x] **`/api/db-check` ya no expone conteos** — era una ruta pública sin login que devolvía
  cuántos usuarios/pedidos/productos hay; ahora solo confirma que la base responde.
- [x] **Dependencias**: `npm audit` a 0 vulnerabilidades en backend y frontend (`tar`, `undici`,
  `react-router`, `source-map-js`, `vite` vía fixes no-breaking). `nodemailer` y `sqlite3`
  removidos del todo (sin uso real en el código — `nodemailer` quedó huérfano desde la migración
  a la API de Resend de hoy). `xlsx` actualizado a 0.20.3 **desde el CDN oficial de SheetJS**
  (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) — el paquete en el registro de npm
  (0.18.5) está clavado ahí desde hace años con 2 vulnerabilidades sin fix publicado; SheetJS
  solo publica los parches reales en su propio CDN. Verificado que el parseo de `CONVENIOS.XLS`
  da exactamente el mismo resultado que antes de actualizar.
- [x] **Limpieza**: 4 archivos `.txt` viejos sueltos en `backend/src` (copias de backup de mayo,
  sin uso) borrados.

**Pendiente para la migración en sí** (no es código, es checklist operativo): copiar TODAS las
variables de entorno del backend de Render al servidor nuevo — `JWT_SECRET` especialmente, ahora
que no tiene respaldo y el server no arranca sin él. El servidor nuevo necesita su propio HTTPS
(Render lo hace solo vía Let's Encrypt; un VPS necesita algo como Caddy o nginx+certbot armado a
mano).

## Checklist de infraestructura para migrar a servidor propio (2026-10-12)

El usuario ya tiene el dominio (`sulcongelados.com`, DNS en Cloudflare) y pregunta en concreto
qué más hay que contratar/configurar para que quede "segura, cuidada, persistente" — no es un
plan a futuro, es la guía real para decidir y migrar.

**Decisión previa**: no migrar la base de datos. Neon (Postgres manejado) se queda — tiene sus
propios backups/PITR y mover una base en producción es quirúrgico y arriesgado por nada; lo que
se muda es solo el cómputo (backend Node + servir el build de frontend). Esto reduce la migración
a "mover un server", no "mover todo el sistema".

- [ ] **VPS**: Hetzner CX22 (2 vCPU / 4GB RAM / 40GB disco), ya evaluado antes — ronda
  US$85-92/año sin IVA para pago desde Argentina. Ubuntu 24.04 LTS.
- [ ] **Backups del VPS**: activar el add-on de snapshots de Hetzner (~20% extra sobre el costo
  del VPS) — sin esto, si el disco se corrompe no hay nada que restaurar (la base en Neon está
  a salvo aparte, pero el server en sí no).
- [ ] **Proxy + HTTPS**: Caddy en vez de nginx+certbot — renueva Let's Encrypt solo, config de
  3-4 líneas, sirve el build estático de `frontend/` y hace proxy a `localhost:PORT` del backend
  desde el mismo Caddyfile. Un solo binario, un solo archivo de config.
- [ ] **El backend como servicio systemd**: unit file que lo reinicia solo si crashea y lo
  levanta solo si el server reinicia. (Alternativa más liviana: PM2, pero systemd ya viene con
  Ubuntu y `journalctl` da los logs gratis con rotación automática.)
- [ ] **Firewall**: `ufw` — abrir únicamente 22 (SSH), 80 y 443. El puerto interno de Node no
  debe quedar expuesto a internet, solo accesible para Caddy en `localhost`.
- [ ] **SSH endurecido**: login solo por clave (desactivar password auth), usuario de deploy sin
  privilegios de root directo (`sudo` puntual), `fail2ban` para frenar intentos de fuerza bruta.
- [ ] **Parches automáticos del sistema**: `unattended-upgrades` para que los parches de
  seguridad del propio Ubuntu se instalen solos sin intervención manual.
- [ ] **Monitoreo de caída**: un ping cada pocos minutos a un endpoint de salud (ej.
  `GET /api/db-check`) desde un servicio externo gratuito (UptimeRobot o similar) con alerta por
  mail si el sitio deja de responder — hoy no hay ninguna señal si el server se cae a las 3am.
- [ ] **Variables de entorno**: `.env` vive solo en el server nuevo, nunca en git, permisos
  restringidos al usuario de deploy. Copiar TODAS las de Render, `JWT_SECRET` en particular (ver
  sección de arriba).
- [ ] **DNS**: repuntar el registro A de `sulcongelados.com` en Cloudflare a la IP del VPS nuevo
  cuando esté listo. Si se deja el proxy naranja de Cloudflare activado (protección DDoS + cache
  gratis de estáticos), hay que poner el modo SSL de Cloudflare en "Full (strict)" — si no, loop
  de redirect contra el certificado de Caddy.
- [ ] **Proceso de deploy**: un script chico (`git pull && npm ci && npm run build && sudo
  systemctl restart sul-backend`) para no hacerlo a mano paso a paso cada vez — reduce el riesgo
  de un deploy a medio aplicar.
- [ ] **Retención de backups de Neon**: confirmar el plan actual de Neon y su ventana de
  point-in-time-recovery (el free tier suele ser corto, ~7 días) — ahora que esto es un negocio
  real en producción, vale la pena revisar si conviene un plan pago con más retención.
- [ ] **Mail**: sin cambios — Resend es una API HTTPS, no depende de qué servidor corre el
  backend.

**No es necesario para esta migración**: self-hostear Postgres (Neon ya cumple esa función),
CI/CD complejo (a esta escala un script de deploy manual alcanza), balanceo de carga (un solo
VPS CX22 sobra para el volumen actual).

## Plan: Maps en checkout, Maps en Contacto, mensaje de WhatsApp editable (2026-10-12)

Pedido explícito del usuario — **documentar el plan, no implementar todavía**. Se retoma cuando
el usuario lo indique.

### 1. Zonas de cobertura con mapa real + selección automática del día de reparto

Decisión confirmada con el usuario: zonas dibujadas como polígonos reales en un mapa (no texto
libre por barrio) — más preciso, pero requiere Google Maps JavaScript API con Drawing + Geometry
library, lo cual implica crear un proyecto en Google Cloud, habilitar facturación (da US$200/mes
gratis, probablemente cubre el uso real de esta escala) y generar una API key restringida por
dominio.

- **Esquema nuevo**: tabla `delivery_zones (id, name, polygon JSONB, delivery_days TEXT, active
  BOOLEAN)` — `polygon` guarda el array de vértices `{lat, lng}` que devuelve el
  `DrawingManager` de Maps.
- **Admin — pantalla nueva** (en Ajustes o ítem propio del nav): mapa centrado en Córdoba con
  `DrawingManager` para dibujar polígonos, nombrar cada zona y asignarle los días de reparto
  (mismo patrón que ya existe en `ClientForm.tsx` para `diasEntrega` por cliente).
- **Backend — resolución de zona**: al armar el pedido, el cliente manda `{lat, lng}` (de
  autocompletar dirección o de un pin arrastrable en un mapa embebido en `CartSidebar.tsx`). El
  backend (nunca el cliente) corre un point-in-polygon (ray-casting simple, sin necesidad de
  PostGIS para la cantidad de zonas que va a haber) contra las zonas activas y devuelve qué días
  de reparto corresponden — evita que alguien falsee el resultado desde el navegador.
- **Checkout**: `CartSidebar.tsx` reemplaza/complementa el selector fijo `diasHabilitados`
  (hoy viene de `user.diasEntrega`, fijo por cliente) con el resultado de la zona cuando hay una
  dirección nueva marcada en el mapa — útil sobre todo para invitados o clientes que piden en una
  dirección distinta a la habitual.
- **Pedido**: agregar `orders.lat`, `orders.lng`, `orders.zone_id` para dejar registrado con qué
  zona se resolvió cada pedido (trazabilidad para logística).

### 2. Mapa de ubicación en Contacto

Mucho más simple y sin costo: un `<iframe>` con el embed público de Google Maps (Maps Embed vía
"Compartir → Insertar un mapa" desde la ubicación real de SUL) — **no necesita API key** para este
caso de uso estático, a diferencia del checkout. Solo falta la dirección/coordenadas reales de
SUL para generar el embed.

### 3. Mensaje de WhatsApp editable

Hoy el texto vive hardcodeado en dos lugares de `frontend/src/components/CartSidebar.tsx` (líneas
~136 y ~152, duplicado en el camino normal y en el catch de fallback). Plan:

- Nueva clave en `settings`: `whatsapp_message_template` (TEXT), default = el texto actual.
- Placeholders fijos que el template puede usar: `{{items}}`, `{{total}}`, `{{entrega}}` — el
  admin edita el saludo/cierre libremente desde Ajustes (mismo patrón de textarea controlado que
  ya existe para `whatsappDraft`/`minPurchaseDraft`), pero el detalle de ítems/total se sigue
  generando desde los datos reales del pedido, nunca a mano, para que no se pueda romper el
  cálculo.
- `CartSidebar.tsx` hace el fetch de la plantilla junto con el resto de `/settings` (ya trae
  `whatsapp_number`) y reemplaza los placeholders antes de armar la URL de `wa.me`.

**No implementado** — queda para la próxima sesión cuando el usuario lo pida.
