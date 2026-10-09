# Proyecto: SUL Congelados - Plataforma B2B/B2C

Este documento sirve como contexto técnico y funcional para el desarrollo de la plataforma de SUL Congelados.

## 🚀 Stack Tecnológico

### Frontend
- **Framework:** React 19 (TypeScript)
- **Herramienta de Construcción:** Vite 8
- **Estilos:** Tailwind CSS v4 (Moderno, sin dependencias de PostCSS pesadas)
- **Enrutado:** React Router 7
- **Iconografía:** Lucide React
- **Gráficos:** Recharts (Analítica avanzada)
- **Estado:** Context API (Auth) + Hooks locales

### Backend
- **Entorno:** Node.js (TypeScript)
- **Framework:** Express v5
- **Base de Datos:** PostgreSQL (Postgres 16+)
- **Autenticación:** JSON Web Tokens (JWT) + Bcryptjs
- **Gestión de Archivos:** Multer (Para subidas de Excel/CSV)
- **Email:** Nodemailer
- **Procesamiento de Datos:** XLSX / CSV-Parser

---

## 📂 Estructura del Proyecto (Monorepo)

### Backend (`/backend/src`)
- `config/db.ts`: Inicialización de la base de datos y scripts de migración automática de columnas.
- `controllers/`:
  - `authController.ts`: Gestión de usuarios, login, registro masivo y cambios de contraseña.
  - `productController.ts`: CRUD de productos, matriz de precios, auditoría e importación masiva.
  - `orderController.ts`: Gestión de pedidos, flujo de checkout y motor de analítica (BI).
- `routes/`: Definición de endpoints de la API.
- `utils/mailer.ts`: Servicio de envío de notificaciones por email.

### Frontend (`/frontend/src`)
- `components/`: Componentes modulares (Cart, Header, Admin Dashboard, Order History).
- `context/`: Manejo de estado global de autenticación.
- `pages/`: Vistas principales (Catálogo, Panel Admin, Nosotros, Contacto).
- `types/`: Definiciones de interfaces TypeScript para consistencia en todo el proyecto.

---

## ✅ Funcionalidades Implementadas

### Inteligencia de Negocios (BI) y Analítica
- **Dashboard Profesional:** Visualización de KPIs (Facturación, Pedidos, CRM).
- **Gráficos Dinámicos:** Curva de ventas con filtros de fecha y granularidad (Día, Semana, Mes).
- **Ranking de Rendimiento:** Top 5 Clientes por facturación y Ranking de rotación de productos.
- **Comparativa de Listas:** Análisis visual de ventas por Convenio (Lista de precios).

### Administración y Logística (Panel Control)
- **Control de Pedidos Pro:** Historial con filtros avanzados por cliente, producto, fecha y estado.
- **Gestión de Estados:** Actualización en tiempo real del flujo logístico (Pendiente, Enviado, Completado, Cancelado).
- **Auditoría de Precios ("Time Machine"):** Historial técnico de cambios de precios indicando autor, fecha, valor anterior y nuevo.
- **Configuración Comercial:** Ajuste dinámico del número de WhatsApp y mínimos de compra desde el panel.
- **Gestión de Productos y Clientes:** Carga masiva desde Excel sincronizando SKU, precios y categorías.

### Experiencia de Compra (B2B/B2C)
- **Catálogo Dinámico:** Precios personalizados según el "Convenio" asignado al usuario.
- **Carrito de Compras:** Persistencia en LocalStorage y validación de stock base.
- **Checkout Multi-canal:** Envío de pedidos vía WhatsApp y almacenamiento en base de datos.

### Seguridad
- **Roles:** Admin, Cliente, Minorista.
- **Sesión Robusta:** Protección de rutas con JWT y validación estricta de estado de cuenta.
- **Primer Acceso:** Obligatoriedad de cambio de contraseña.

---

## 🛠 Variables de Envorno Necesarias

### Backend (.env)
```env
PORT=3000
DATABASE_URL=postgres://...
JWT_SECRET=tu_secreto_aqui
FRONTEND_URL=https://web-site-sul-congelados-1.onrender.com
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=resend
EMAIL_PASS=tu_api_key_de_resend
EMAIL_FROM=notificaciones@sulcongelados.com
ADMIN_EMAIL=sulcongelados.arg@gmail.com
```

### Frontend (Render Environment)
- `VITE_API_URL`: https://web-site-sul-congelados-backend.onrender.com/api

---

## 📋 Decisiones Técnicas Importantes

1. **Inyector Automático de DB:** El sistema detecta cambios en el esquema PostgreSQL y crea tablas/columnas dinámicamente (`initDB`).
2. **Arquitectura de Auditoría:** Se implementó una tabla `price_history` para garantizar la trazabilidad total de los márgenes comerciales.
3. **Analítica en Caliente:** Los datos del dashboard se calculan mediante agregaciones SQL optimizadas para responder en milisegundos.
4. **Monorepo Profesional:** El proyecto se unificó en una estructura única para garantizar la sincronización atómica entre Frontend y Backend.
5. **CORS Dinámico:** Soporte para múltiples entornos mediante variables de entorno y listas de confianza.

---

## 🛡️ Mandatos de Ingeniería y Buenas Prácticas

1.  **Buenas Prácticas:** Tipado estricto (TypeScript), manejo de errores robusto y Conventional Commits.
2.  **Reutilización:** Priorizar la composición y auditación de código previo antes de crear nueva lógica.
3.  **Eliminación de Código Muerto:** Obligatoriedad de limpiar variables/imports no usados para optimizar el build de producción.
4.  **Escalabilidad:** Diseño de APIs granulares y componentes modulares.
5.  **Seguridad:** Uso estricto de variables de entorno; prohibido hardcodear credenciales o URLs.

---

## ⏳ Funcionalidades Pendientes / Roadmap

- [ ] Sistema de recuperación de contraseña vía email (Token de reset).
- [ ] Historial de pedidos detallado para el cliente final (Vista Mis Compras).
- [ ] Gestión real de stock vinculada a facturación automática.
- [ ] Integración de pasarela de pago (Mercado Pago).
- [ ] Sistema de notificaciones en tiempo real vía WebSockets (Socket.io).

---

## 🌐 Estado de Deploy / Infraestructura (actualizado 2026-10-09)

### Dominio — compartido con otro proyecto, cuidado al tocar DNS
`sulcongelados.com` está registrado y gestionado en **Cloudflare** (misma cuenta que el panel interno de MRC, proyecto completamente aparte). El subdominio `panel.sulcongelados.com` ya está ocupado por un túnel de Cloudflare que sirve ese otro dashboard — **no tocar ese registro DNS**. Este proyecto (SUL ecommerce) debe usar el dominio raíz (`sulcongelados.com` / `www`) u otro subdominio distinto.

### Mail — resuelto, migrado a Resend
El dominio ya está verificado en **Resend** (cuenta creada, registros DKIM/SPF/DMARC agregados en Cloudflare, API key activa) para mandar desde `notificaciones@sulcongelados.com`. `utils/mailer.ts` y `backend/.env` ya están migrados a SMTP de Resend (`smtp.resend.com`, user `resend`, misma API key que usa el otro proyecto MRC) y se probó con un envío real exitoso a `sulcongelados.arg@gmail.com` (casilla configurada en `ADMIN_EMAIL` para recibir notificaciones de pedidos).

### Base de datos — ya existe, ya persiste
Postgres real ya provisionado en **Neon** (plan gratis), `DATABASE_URL` ya en `backend/.env`. Los datos ya viven en la nube, no en ninguna PC física — esto ya estaba resuelto antes de pensar en hosting.

`JWT_SECRET` ya generado como secreto real (96 caracteres hex, 48 bytes de entropía) y aplicado en `backend/.env` — pendiente copiar el mismo valor como env var en Render al crear el servicio.

### Plan de hosting (decidido, pendiente de ejecutar)
Opciones evaluadas: Render+Neon pago (~US$22/mes, caro), Fly.io+Neon gratis (~US$2-8/mes), VPS propio en Hetzner Cloud (CX22, 2vCPU/4GB RAM, ~US$85-92/año todo incluido con backups — sin IVA porque Argentina no está en la lista de países que Hetzner le cobra IVA).

**Plan acordado**: arrancar gratis primero — Render free (backend) + Render Static o Cloudflare Pages (frontend) + Neon free (ya existe) — para probar todo en vivo en `sulcongelados.com` sin gastar nada. Limitación conocida: el backend gratis "duerme" tras 15 min sin uso, primera visita después de eso tarda 30-50s. Migrar a Hetzner (siempre activo, sin ese problema) cuando se decida lanzar en serio a clientes reales — mismo código, sin perder nada.

Incertidumbre sin resolver: pago en euros a Hetzner desde una tarjeta argentina podría generar impuesto PAIS/percepción de Ganancias — depende del banco, no verificable de antemano.

### Relacionado
"Lomitos 2x1" (otra línea de negocio, de otro proyecto) podría alojarse a futuro en el mismo servidor/VPS que este ecommerce una vez armado el VPS — un servidor admite múltiples dominios distintos, no solo subdominios. No armado todavía, solo planeado.
