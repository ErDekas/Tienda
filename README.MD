# Tienda en Línea

Este proyecto consiste en el desarrollo de una tienda en línea funcional. Incluye código fuente para el frontend y scripts básicos para la administración del sitio.

## Tecnologías utilizadas

- **HTML**: Estructura de las páginas web.
- **CSS**: Estilizado del contenido.
  - Archivos: `style.css`, `admin.css`
- **JavaScript**: Lógica interactiva del sitio.
  - Archivos: `app.js`, `admin.js`

## Descripción de funcionalidades

### Página principal

El archivo `index.html` define la estructura básica del sitio, mientras que `style.css` establece los estilos visuales. Además, `app.js` proporciona interactividad y gestión del carrito de compras.

### Administración

Archivos como `admin.css` y `admin.js` permiten gestionar elementos de la tienda, como productos, inventario o configuraciones.

## Despliegue

El proyecto está desplegado en [Vercel](https://tienda-deka.vercel.app), lo que facilita su acceso público para pruebas y uso.

## Estructura del proyecto

```
Tienda/
├── index.html
├── style.css
├── app.js
├── admin.css
├── admin.js
└── services/
  ├── auth.js
  ├── storage.js
  └── api.js
```

## Resumen del CSS

#### Variables CSS
- **Paleta de colores:** Define colores primarios, secundarios y de texto, además de colores para fondos y bordes.
- **Tipografía:** Fuente principal personalizada.
- **Puntos de quiebre:** Para diseño responsivo en dispositivos móviles, tabletas y escritorio.

#### Reset CSS
- Estilo base para `margin`, `padding` y `box-sizing`.

#### Estilos Globales
- **Body:** Fondo, fuente y espaciado global.
- **Aplicación:** Contenedor principal centrado.

#### Componentes Principales
1. **Header (Estilo Amazon):**
   - Diseño en cuadrícula.
   - Elementos como filtros, íconos, y botones.
2. **Contenedor de Productos:**
   - Diseño de tarjetas con transiciones y elementos como imágenes, precios, y botones de compra.
3. **Botón "Cargar Más":**
   - Estilo de botón interactivo.

4. **Modales:**
   - Efecto de desenfoque para fondo.
   - Botones y contenido estilizados para interacción.

5. **Footer:**
   - Diseño en cuadrícula para columnas de información.
   - Iconos de redes sociales y sección de derechos reservados.

#### Funcionalidades Responsivas
- Adaptaciones para pantallas de diferentes tamaños (ej. compactar cuadrículas, ajustar márgenes).

#### Animaciones y Detalles Visuales
- **Keyframes:** Para rotación y efectos de carga.
- **Hover y Active:** Mejoras visuales al interactuar con botones.

#### Formularios y Validaciones
- **Estilo de inputs:** Cambios de color en estados `focus` y `valid`.
- **Formularios de login y registro:** Efectos visuales y mensajes de error personalizados.

#### Botones y Controles
- Estilos avanzados con transiciones, sombras y transformaciones.

# Resumen del Código JavaScript

## admin.js
Este archivo gestiona la interfaz administrativa de una tienda online. A continuación se resumen sus principales características:

### Configuración y Variables Globales
- **URL de la API**: `https://api.escuelajs.co/api/v1`.
- **Estado Inicial**:
  - `currentSection`: Determina la sección actual (`products` por defecto).
  - `categories`: Lista de categorías obtenidas de la API.
- **Elementos del DOM**:
  - Botones, tablas y modales que se manejan mediante `document.getElementById` o `querySelector`.

### Funciones Clave
- **fetchData**: Recupera datos de la API según la sección actual.
- **fetchCategories**: Obtiene las categorías disponibles para poblar un selector.
- **renderTable**: Genera filas en una tabla con los datos obtenidos.
- **changeSection**: Cambia entre secciones y actualiza la interfaz.
- **openModal / closeModal**: Muestra u oculta el modal de formularios.
- **handleSubmit**: Envía los datos de un formulario a la API para crear un nuevo recurso.
- **deleteItem / editItem**: Elimina o edita elementos mediante la API.

### Características Adicionales
- Manejo básico de errores en operaciones `fetch`.
- Modales para agregar o editar elementos.
- Navegación dinámica entre secciones (`products`, `categories`, etc.).

---

## app.js
Este archivo implementa la lógica principal de la tienda online, incluyendo funcionalidades de usuarios, productos y carrito de compras.

### Clase `OnlineStore`
Centraliza toda la lógica de la aplicación. Los principales atributos y métodos son:

#### Atributos
- **Servicios**:
  - `apiService`: Manejo de API.
  - `authService`: Autenticación.
  - `storageService`: Manejo del carrito en el almacenamiento local.
- **Estado**:
  - `productos`: Lista de productos cargados.
  - `carrito`: Productos añadidos al carrito.
  - `currentPage`: Página actual para paginación.
  - `isLoading / hasMoreProducts`: Controlan la carga de datos.
  - `loadedProductIds`: Evita cargar productos duplicados.

#### Métodos Clave
- **Inicialización**:
  - `initializeDOM`: Asocia elementos del DOM a la lógica de la aplicación.
  - `setupEventListeners`: Configura eventos (clics, formularios, scroll infinito, etc.).
  - `checkInitialAccess`: Comprueba el estado de autenticación del usuario.
- **Productos**:
  - `loadProducts`: Carga productos desde la API con paginación.
  - `renderizarProductos`: Renderiza tarjetas de productos en la interfaz.
  - `applyFilters`: Filtra productos por categoría, precio o búsqueda.
- **Carrito de Compras**:
  - Métodos para agregar, eliminar y actualizar productos en el carrito.
  - Cálculo y visualización del total de la compra.
- **Autenticación**:
  - `iniciarSesion / registrarUsuario`: Manejan el login y registro de usuarios.
  - `cerrarSesion`: Cierra la sesión actual.
- **Pago**:
  - `iniciarProcesoCompra`: Valida el carrito y muestra el formulario de pago.
  - `procesarPago`: Procesa el pago y envía un correo de confirmación.

#### Características Adicionales
- **Modales**:
  - Login, registro, detalles de productos y pago.
- **Carrusel**:
  - Visualización dinámica de imágenes de productos.
- **Scroll Infinito**:
  - Carga automática de productos al desplazarse al final de la página.

---

## Comparativa
| Aspecto             | `admin.js`                     | `app.js`                  |
|---------------------|---------------------------------|---------------------------|
| **Objetivo**        | Administración de la tienda    | Interacción con usuarios  |
| **Gestión de Datos**| CRUD de recursos               | Filtrado y paginación     |
| **Interfaz**        | Modales y tablas               | Tarjetas y modales        |
| **Autenticación**   | Básica (cerrar sesión)         | Completa (login/registro) |
| **Carrito de Compras** | No implementado             | Implementado              |

### Notas
- Ambos archivos usan técnicas modernas de JavaScript, como `async/await` y manipulación avanzada del DOM.
- Podrían integrarse mejoras como validación adicional en formularios y una mejor separación de responsabilidades para mayor mantenibilidad.


## Instalación y ejecución

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/ErDekas/Tienda.git
   ```
2. Abrir el archivo `index.html` en un navegador web para visualizar la página.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un *issue* o envía un *pull request* para proponer mejoras o correcciones.

## Autor

[ErDekas](https://github.com/ErDekas)

##
