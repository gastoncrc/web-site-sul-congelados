# Proyecto: SUL Congelados - Plataforma B2B/B2C

Este documento sirve como contexto técnico y funcional para el desarrollo de la plataforma de SUL Congelados.

## 🚀 Stack Tecnológico

### Frontend
- **Framework:** React 19 (TypeScript)
- **Herramienta de Construcción:** Vite 8
- **Estilos:** Tailwind CSS v4 (Moderno, sin dependencias de PostCSS pesadas)
- **Enrutado:** React Router 7
- **Iconografía:** Lucide React
- **Gráficos:** Recharts (Para panel administrativo)
- **Estado:** Context API (Auth) + Hooks locales

### Backend
- **Entorno:** Node.js (TypeScript)
- **Framework:** Express v5
- **Base de Datos:** PostgreSQL (Compatible con Neon.tech o local)
- **Autenticación:** JSON Web Tokens (JWT) + Bcryptjs
- **Gestión de Archivos:** Multer (Para subidas de Excel/CSV)
- **Email:** Nodemailer
- **Procesamiento de Datos:** XLSX / CSV-Parser

---

## 📂 Estructura del Proyecto

### Backend (`/backend/src`)
- `config/db.ts`: Inicialización de la base de datos y scripts de migración automática de columnas.
- `controllers/`:
  - `authController.ts`: Gestión de usuarios, login, registro masivo y cambios de contraseña.
  - `productController.ts`: CRUD de productos, matriz de precios por convenio e importación masiva.
  - `orderController.ts`: Gestión de pedidos y flujo de checkout.
- `routes/`: Definición de endpoints de la API.
- `utils/mailer.ts`: Servicio de envío de notificaciones por email.

### Frontend (`/frontend/src`)
- `components/`: Componentes modulares (Cart, Header, Admin forms).
- `context/`: Manejo de estado global de autenticación.
- `pages/`: Vistas principales (Catálogo, Panel Admin, Nosotros, Contacto).
- `types/`: Definiciones de interfaces TypeScript para consistencia en todo el proyecto.

---

## ✅ Funcionalidades Implementadas

### Catálogo y Compra
- **Catálogo Dinámico:** Precios personalizados según el "Convenio" (Lista de precios) asignado al usuario.
- **Buscador y Filtros:** Búsqueda por nombre y filtros por categorías/rubros.
- **Carrito de Compras:** Persistencia en LocalStorage y validación de stock (simulada/base).
- **Checkout:** Selección de método de pago, tipo de entrega (Envío/Retiro) y dirección.
- **Promociones:** Soporte para precios promocionales y destacados en slider principal.

### Administración (Panel Control)
- **Gestión Logística de Productos:** Carga masiva desde Excel sincronizando SKU, precios y categorías.
- **Gestión de Clientes:** Importación masiva de clientes desde logística, permitiendo la creación automática de cuentas.
- **Control de Precios:** Matriz de precios que permite que un mismo SKU tenga distintos valores según el cliente.
- **Gestión de Pedidos:** Visualización de pedidos entrantes y estados.
- **Configuración:** Ajustes dinámicos como el número de WhatsApp para contacto.

### Seguridad
- **Roles:** Admin, Cliente, Minorista.
- **Primer Acceso:** Obligatoriedad de cambiar la contraseña genérica al iniciar sesión por primera vez.
- **Protección de Rutas:** Middleware de autenticación JWT.
- **CORS:** Configuración de orígenes permitidos dinámica.

---

## 🛠 Variables de Entorno Necesarias (.env)

### Backend
```env
PORT=3000
DATABASE_URL=postgres://...
JWT_SECRET=tu_secreto_aqui
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.ejemplo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@sul.com
EMAIL_PASS=tu-password
ADMIN_EMAIL=pedidos@sul.com
```

---

## 📋 Decisiones Técnicas Importantes

1. **Inyector Automático de DB:** El sistema detecta si faltan columnas en la base de datos PostgreSQL y las crea al iniciar el servidor (`initDB` en `db.ts`), facilitando despliegues continuos sin scripts de migración manuales pesados.
2. **Matriz de Precios:** Se utiliza una tabla relacional `product_prices` para separar el producto (entidad base) de su valor comercial, permitiendo una escalabilidad infinita de listas de precios (Convenios).
3. **Login por Email de Sistema:** Para clientes importados masivamente, se genera un email técnico `cl_CODIGO@sul.com` para asegurar que todos tengan una credencial única de acceso inmediata.
4. **Tailwind 4:** Se optó por la versión 4 para aprovechar el nuevo motor de alto rendimiento y la simplificación de la configuración mediante CSS puro.
5. **Persistencia Local:** El carrito se mantiene en el navegador del usuario para evitar pérdida de datos por cierres accidentales.

---

## 🛡️ Mandatos de Ingeniería y Buenas Prácticas

Para garantizar la integridad y el crecimiento del proyecto, todas las sesiones de desarrollo deben adherirse a los siguientes principios:

1.  **Buenas Prácticas y Estándares:** Se debe seguir un desarrollo profesional utilizando tipado estricto (TypeScript), manejo de errores robusto y convenciones de nombres claras (Conventional Commits).
2.  **Reutilización Profesional de Código:** Antes de crear una nueva función o componente, se debe auditar el código existente para reutilizar lógica. Se prioriza la composición sobre la duplicación.
3.  **Eliminación de Código Muerto (Surgical Cleanup):** Es obligatorio identificar y eliminar importaciones, variables, funciones o archivos que ya no se utilicen.
    *   **Por qué:** Mejora el rendimiento de los builds, reduce la deuda técnica y evita confusiones en futuras sesiones.
    *   **Seguridad:** La eliminación debe ser validada mediante herramientas de análisis estático (linters/compiladores) para asegurar que no existan dependencias ocultas.
4.  **Escalabilidad Arquitectónica:** El código debe diseñarse pensando en el futuro. Las APIs deben ser granulares y los componentes de frontend deben ser modulares, permitiendo añadir nuevas funcionalidades sin reescribir la lógica base.
5.  **Seguridad y Contexto:** El uso de variables de entorno (`.env`) es obligatorio para configuraciones sensibles o dinámicas. Nunca se deben "hardcodear" URLs o credenciales en el código fuente.

---

## ⏳ Funcionalidades Pendientes / Roadmap

- [ ] Sistema de recuperación de contraseña vía email.
- [ ] Historial de pedidos detallado para el cliente final.
- [ ] Dashboard de estadísticas avanzado (ventas por rubro, clientes top).
- [ ] Gestión real de stock vinculada a facturación.
- [ ] Integración de pasarela de pago (Mercado Pago / Otros).
