class OnlineStore {
  constructor() {
    this.apiService = new ApiService();
    this.authService = new AuthService();
    this.storageService = new StorageService();

    this.productos = [];
    this.loadCategories();
    this.carrito = this.storageService.getCart() || [];
    this.currentPage = 1; // Página actual para la paginación
    this.isLoading = false; // Evitar múltiples solicitudes
    this.hasMoreProducts = true; // Controlar si quedan productos
    this.loadedProductIds = new Set(); // Almacenar IDs ya cargados

    this.initializeDOM();
    this.setupEventListeners();
    this.setupInfiniteScroll();
    this.checkInitialAccess();
  }

  initializeDOM() {
    // Contenedores principales
    this.appContainer = document.getElementById("app");
    this.loginModal = document.getElementById("login-modal");
    this.registroModal = document.getElementById("registro-modal");
    this.productosContenedor = document.getElementById("products-container");
    this.loadMoreButton = document.getElementById("loadMore"); // Botón para cargar más
    this.loader = document.getElementById("wifi-loader"); // Referencia al loader
    this.carritoContenedor = document.getElementById("cart-container");

    // Filtros
    this.searchInput = document.getElementById("search-input");
    this.categoryFilter = document.getElementById("category-filter");
    this.priceFilter = document.getElementById("price-filter");

    // Elementos de control
    this.checkoutBtn = document.getElementById("checkout-btn");
    this.carritoItems = document.getElementById("cart-items");
    this.carritoTotal = document.getElementById("cart-total");
    this.contadorCarrito = document.getElementById("cart-count");
    this.populateCategoryFilter();

    // Formularios
    this.loginForm = document.getElementById("login-form");
    this.registroForm = document.getElementById("registro-form");
    this.pagoForm = document.getElementById("pago-form");
  }

  setupEventListeners() {
    this.loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    this.registroForm.addEventListener("submit", (e) => this.handleRegistro(e));
    if (this.loadMoreButton) {
      this.loadMoreButton.addEventListener("click", async () => {
        if (!this.isLoading && this.hasMoreProducts) {
          this.isLoading = true;
          this.showLoader();
          this.currentPage++;
          await this.loadProducts(this.currentPage);
          this.isLoading = false;
          this.hideLoader();
        }
      });
    }
    // Filtro de categoría
    this.categoryFilter.addEventListener("change", async (e) => {
      const selectedCategory = e.target.value;

      // Reiniciar el estado de productos y paginación
      this.productos = [];
      this.currentPage = 1;
      this.hasMoreProducts = true;

      // Cargar productos según la categoría seleccionada
      await this.loadProducts(this.currentPage, selectedCategory || "");
    });
    this.priceFilter.addEventListener("change", () => this.applyFilters());
    this.searchInput.addEventListener("input", () => this.applyFilters());
    document
      .getElementById("mostrar-registro")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.loginModal.classList.add("hidden");
        this.registroModal.classList.remove("hidden");
      });

    document.getElementById("mostrar-login").addEventListener("click", (e) => {
      e.preventDefault();
      this.registroModal.classList.add("hidden");
      this.loginModal.classList.remove("hidden");
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const pagoModal = document.getElementById("pago-modal");
        if (pagoModal && pagoModal.style.display === 'flex') {
          pagoModal.style.display = 'none';
        }
        
        const detallesModal = document.getElementById("product-details-modal");
        if (detallesModal && detallesModal.style.display === 'flex') {
          this.cerrarModal();
        }
      }
    });

    this.checkoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.mostrarModalLogin();
    });

    this.checkoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.iniciarProcesoCompra();
    });
  }

  setupInfiniteScroll() {
    window.addEventListener("scroll", async () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;

      if (
        scrollTop + clientHeight >= scrollHeight - 50 &&
        !this.isLoading &&
        this.hasMoreProducts
      ) {
        this.isLoading = true;
        this.showLoader();
        this.currentPage++;
        await this.loadProducts(this.currentPage);
        this.isLoading = false;
        this.hideLoader();
      }
    });
  }

  showLoader() {
    this.loader.classList.remove("hidden");
  }

  hideLoader() {
    this.loader.classList.add("hidden");
  }

  applyFilters() {
    const categoriaSeleccionada = this.categoryFilter.value;
    const ordenPrecio = this.priceFilter.value;
    const textoBusqueda = this.searchInput.value.toLowerCase();

    const productosFiltrados = this.productos
      .filter((producto) => {
        const coincideCategoria =
          !categoriaSeleccionada ||
          producto.categoria === categoriaSeleccionada;
        const coincideBusqueda =
          !textoBusqueda ||
          producto.nombre.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideBusqueda;
      })
      .sort((a, b) => {
        if (ordenPrecio === "asc") {
          return a.precio - b.precio;
        } else if (ordenPrecio === "desc") {
          return b.precio - a.precio;
        }
        return 0;
      });

    // Renderizar productos filtrados
    this.renderizarProductos(productosFiltrados, true); // true para limpiar el contenedor
  }

  checkInitialAccess() {
    // Bloquear toda la aplicación por defecto
    this.bloquearAccesoAplicacion();

    // Verificar si hay un usuario guardado
    const usuarioGuardado = this.authService.getCurrentUser();

    if (usuarioGuardado) {
      try {
        // Intentar iniciar sesión con el usuario guardado
        this.authService.currentUser = usuarioGuardado;
        this.desbloquearAccesoAplicacion();
        this.loadProducts();
      } catch (error) {
        // Si falla la validación, mostrar login
        this.mostrarModalLogin();
      }
    } else {
      // No hay usuario guardado, mostrar login
      this.mostrarModalLogin();
    }
  }

  bloquearAccesoAplicacion() {
    // Ocultar secciones principales
    this.productosContenedor.innerHTML = "";
    this.carritoContenedor.classList.add("hidden");
    // Mostrar solo el login
    this.loginModal.classList.remove("hidden");
  }

  desbloquearAccesoAplicacion() {
    // Mostrar secciones principales
    this.carritoContenedor.classList.remove("hidden");

    // Ocultar modales de login
    this.loginModal.classList.add("hidden");
    this.registroModal.classList.add("hidden");
  }

  mostrarModalLogin() {
    this.bloquearAccesoAplicacion();
    this.loginModal.classList.remove("hidden");
  }

  async populateCategoryFilter() {
    try {
      const categories = await this.apiService.fetchCategories();
      if (categories.length > 0) {
        this.categoryFilter.innerHTML = `<option value="">Todas las categorías</option>`;
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.name;
          this.categoryFilter.appendChild(option);
        });
      } else {
        this.categoryFilter.innerHTML = `<option value="">Sin categorías disponibles</option>`;
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      this.categoryFilter.innerHTML = `<option value="">Error al cargar categorías</option>`;
    }
  }

  async loadProducts(page = 1, category = "") {
    try {
      // Llamar a la API con filtro de categoría si existe
      const nuevosProductos = await this.apiService.fetchProducts(
        page,
        10,
        category
      );

      if (page === 1) {
        this.productosContenedor.innerHTML = ""; // Limpiar el contenedor si es la primera página
        this.loadedProductIds.clear(); // Reiniciar el set de IDs cargados
      }

      if (nuevosProductos.length === 0) {
        this.hasMoreProducts = false;
        return;
      }

      // Filtrar productos duplicados
      const productosFiltrados = nuevosProductos.filter(
        (producto) => !this.loadedProductIds.has(producto.id)
      );

      productosFiltrados.forEach((producto) =>
        this.loadedProductIds.add(producto.id)
      );
      this.productos.push(...productosFiltrados);

      this.renderizarProductos(productosFiltrados);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      alert("Error al cargar productos. Por favor, inténtalo de nuevo.");
    }
  }

  async loadCategories() {
    try {
      const categorias = await this.apiService.fetchCategories(); // Supón que existe este método
      const optionsHTML = categorias
        .map(
          (categoria) => `<option value="${categoria}">${categoria}</option>`
        )
        .join("");
      this.categoryFilter.innerHTML =
        `<option value="">Todas las categorías</option>` + optionsHTML;
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      this.categoryFilter.innerHTML = `<option value="">Error al cargar categorías</option>`;
    }
  }

  renderizarProductos(nuevosProductos, limpiar = false) {
    if (limpiar) {
      this.productosContenedor.innerHTML = ""; // Limpiar productos existentes
    }

    const imagenPorDefecto = "https://placehold.co/300x400?text=Without+Image"; // Cambia esto a la ruta de tu imagen por defecto

    const productosHTML = nuevosProductos
      .map(
        (producto) => `
        <div class="product-card ${
          producto.stock === 0 ? "sin-stock" : ""
        }" onclick="store.mostrarDetallesProducto(${producto.id})">
            <img 
                src="${producto.imagen}" 
                alt="${producto.nombre}" 
                onerror="this.onerror=null;this.src='${imagenPorDefecto}';"
            >
            <h3>${producto.nombre}</h3>
            <p>$${producto.precio.toFixed(2)}</p>
            <p>Stock: ${producto.stock}</p>
        </div>
      `
      )
      .join("");

    this.productosContenedor.insertAdjacentHTML("beforeend", productosHTML);

    if (!this.hasMoreProducts) {
      this.loadMoreButton?.classList.add("hidden");
    }
  }
  mostrarDetallesProducto(idProducto) {
    const producto = this.productos.find((p) => p.id === idProducto);
    if (!producto) {
      console.error("Producto no encontrado");
      return;
    }

    const modalDetalles = document.getElementById("product-details-modal");
    if (!modalDetalles) {
      console.error("Modal no encontrado en el DOM.");
      return;
    }

    const modalTitle = modalDetalles.querySelector(".modal-title");
    const modalDescription = modalDetalles.querySelector(".modal-details p");
    const modalPrice = modalDetalles.querySelector(".modal-price");
    const modalStock = modalDetalles.querySelector(".modal-stock");
    const addToCartButton = modalDetalles.querySelector(".modal-add-to-cart");
    const botonCerrar = modalDetalles.querySelector(".close");
    const carruselContenedor = modalDetalles.querySelector(
      ".carrusel-contenedor"
    );
    const imagenActiva = carruselContenedor.querySelector(".imagen-activa");
    const botonAnterior =
      carruselContenedor.querySelector(".carrusel-anterior");
    const botonSiguiente = carruselContenedor.querySelector(
      ".carrusel-siguiente"
    );

    if (!imagenActiva) {
      console.error(
        "No se encontró el elemento de la imagen activa en el carrusel."
      );
      return;
    }

    // Llenar los datos del modal
    modalTitle.textContent = producto.nombre;
    modalDescription.textContent = producto.descripcion;
    modalPrice.textContent = `$${producto.precio.toFixed(2)}`;
    modalStock.textContent = `Stock: ${producto.stock}`;

    // Configurar botón de añadir al carrito
    addToCartButton.onclick = () => this.agregarAlCarrito(producto.id);

    // Configurar botón de cerrar
    botonCerrar.onclick = () => this.cerrarModal();

    // Mostrar modal cambiando el display
    modalDetalles.style.display = "flex";

    // Imagen predeterminada
    const imagenPorDefecto = "https://placehold.co/300x400?text=Without+Image";

    // Inicializar carrusel con las imágenes del producto
    const imagenesProducto = producto.imagenes; // Aquí obtenemos las imágenes del producto específico
    if (imagenesProducto && imagenesProducto.length > 0) {
      let indiceImagenActual = 0;
      imagenActiva.src = imagenesProducto[indiceImagenActual];

      // Mostrar botones de navegación si hay más de una imagen
      botonAnterior.style.display =
        imagenesProducto.length > 1 ? "block" : "none";
      botonSiguiente.style.display =
        imagenesProducto.length > 1 ? "block" : "none";

      // Función para cambiar la imagen
      const cambiarImagen = (direccion) => {
        if (direccion === "siguiente") {
          indiceImagenActual =
            (indiceImagenActual + 1) % imagenesProducto.length;
        } else {
          indiceImagenActual =
            (indiceImagenActual - 1 + imagenesProducto.length) %
            imagenesProducto.length;
        }
        imagenActiva.src = imagenesProducto[indiceImagenActual];
      };

      botonSiguiente.onclick = () => cambiarImagen("siguiente");
      botonAnterior.onclick = () => cambiarImagen("anterior");
    } else {
      // Si no hay imágenes del producto, asignar la imagen por defecto
      imagenActiva.src = imagenPorDefecto;
      botonAnterior.style.display = "none";
      botonSiguiente.style.display = "none";
    }
  }

  generarContenidoModalDetalles(producto) {
    const imagenPorDefecto = "https://placehold.co/300x400?text=Without+Image"; // Cambia esto a la ruta de tu imagen por defecto
    return `
      <div class="producto-detalle-contenedor">
        <button class="cerrar-modal" onclick="cerrarModal()">×</button>
        <div class="carrusel-imagenes">
          <div class="carrusel-contenedor">
            <img src="${producto.imagenes[0] || imagenPorDefecto}"
              alt="${producto.nombre}" 
              class="imagen-activa"
              onerror="this.src='${imagenPorDefecto}';"
            >
          </div>
          <button class="carrusel-anterior">&#10094;</button>
          <button class="carrusel-siguiente">&#10095;</button>
        </div>
        <div class="producto-info">
          <h2>${producto.nombre}</h2>
          <p class="producto-descripcion">${producto.descripcion}</p>
          <div class="producto-detalles">
            <span class="producto-precio">$${producto.precio.toFixed(2)}</span>
            <span class="producto-stock">Stock: ${producto.stock}</span>
          </div>
          <button onclick="store.agregarAlCarrito(${
            producto.id
          })">Agregar al Carrito</button>
        </div>
      </div>
    `;
  }

  inicializarCarrusel() {
    const carrusel = document.querySelector(".carrusel-contenedor");
    const botonAnterior = document.querySelector(".carrusel-anterior");
    const botonSiguiente = document.querySelector(".carrusel-siguiente");
    const imagenActiva = carrusel.querySelector(".imagen-activa");

    // Fetch más imágenes del producto
    this.apiService
      .obtenerImagenesProducto()
      .then((imagenes) => {
        if (imagenes.length > 0) {
          botonAnterior.style.display = "block";
          botonSiguiente.style.display = "block";

          let indiceImagenActual = 0;

          // Inicializa la primera imagen
          imagenActiva.src = imagenes[indiceImagenActual];

          // Función para cambiar la imagen
          const cambiarImagen = (direccion = "siguiente") => {
            if (direccion === "siguiente") {
              indiceImagenActual = (indiceImagenActual + 1) % imagenes.length;
            } else {
              indiceImagenActual =
                (indiceImagenActual - 1 + imagenes.length) % imagenes.length;
            }
            imagenActiva.src = imagenes[indiceImagenActual];
          };

          // Cambio automático cada 3 segundos
          let intervaloCambio = setInterval(() => {
            cambiarImagen();
          }, 3000);

          botonSiguiente.addEventListener("click", () => {
            clearInterval(intervaloCambio);
            cambiarImagen("siguiente");
            // Reiniciar el intervalo
            intervaloCambio = setInterval(() => {
              cambiarImagen();
            }, 3000);
          });

          botonAnterior.addEventListener("click", () => {
            clearInterval(intervaloCambio);
            cambiarImagen("anterior");
            // Reiniciar el intervalo
            intervaloCambio = setInterval(() => {
              cambiarImagen();
            }, 3000);
          });
        } else {
          botonAnterior.style.display = "none";
          botonSiguiente.style.display = "none";
        }
      })
      .catch((error) => {
        console.error("Error al inicializar el carrusel:", error);
      });
  }

  // Método para cerrar modal
  cerrarModal() {
    const modalDetalles = document.getElementById("product-details-modal");
    modalDetalles.style.display = "none";

    // Detener cualquier intervalo de carrusel si existe
    const intervaloCambio = document.querySelector(".carrusel-contenedor")
      .dataset.intervaloCambio;
    if (intervaloCambio) {
      clearInterval(parseInt(intervaloCambio));
    }
  }

  agregarAlCarrito(idProducto) {
    const producto = this.productos.find((p) => p.id === idProducto);
    const productoExistente = this.carrito.find((p) => p.id === idProducto);

    if (productoExistente) {
      if (productoExistente.cantidad < producto.stock) {
        productoExistente.cantidad++;
      } else {
        alert("No hay más stock disponible");
        return;
      }
    } else {
      this.carrito.push({ ...producto, cantidad: 1 });
    }

    this.actualizarCarrito();
  }

  actualizarCarrito() {
    this.carritoItems.innerHTML = this.carrito
      .map(
        (producto) => `
                <div class="carrito-item">
                    ${producto.nombre} - $${producto.precio.toFixed(2)} x ${
          producto.cantidad
        }
                    <div class="carrito-controles">
                        <button onclick="store.reducirCantidad(${
                          producto.id
                        })">-</button>
                        <button onclick="store.aumentarCantidad(${
                          producto.id
                        })">+</button>
                        <button onclick="store.eliminarDelCarrito(${
                          producto.id
                        })">🗑️</button>
                    </div>
                </div>
            `
      )
      .join("");

    const total = this.carrito.reduce(
      (sum, producto) => sum + producto.precio * producto.cantidad,
      0
    );
    this.carritoTotal.textContent = `Total: $${total.toFixed(2)}`;
    this.contadorCarrito.textContent = this.carrito.reduce(
      (sum, producto) => sum + producto.cantidad,
      0
    );

    if (this.carrito.length > 0) {
      this.storageService.saveCart(this.carrito);
    } else {
      // Si está vacío, usar el método de limpiar carrito
      this.storageService.clearCart();
    }
  }

  reducirCantidad(idProducto) {
    const producto = this.carrito.find((p) => p.id === idProducto);
    if (producto.cantidad > 1) {
      producto.cantidad--;
    } else {
      this.eliminarDelCarrito(idProducto);
    }
    this.actualizarCarrito();
  }

  aumentarCantidad(idProducto) {
    const producto = this.carrito.find((p) => p.id === idProducto);
    const productoOriginal = this.productos.find((p) => p.id === idProducto);

    if (producto.cantidad < productoOriginal.stock) {
      producto.cantidad++;
      this.actualizarCarrito();
    } else {
      alert("No hay más stock disponible");
    }
  }

  eliminarDelCarrito(idProducto) {
    this.carrito = this.carrito.filter(
      (producto) => producto.id !== idProducto
    );
    this.actualizarCarrito();
  }

  iniciarProcesoCompra() {
    // if (!this.authService.currentUser) {
    //   alert("Debes iniciar sesión para finalizar la compra");
    //   this.loginModal.classList.remove("hidden");
    //   return;
    // }

    const compraValida = this.carrito.every((itemCarrito) => {
      const productoOriginal = this.productos.find(
        (p) => p.id === itemCarrito.id
      );
      return itemCarrito.cantidad <= productoOriginal.stock;
    });

    if (!compraValida) {
      alert("Algunos productos no tienen suficiente stock");
      return;
    }

    // Mostrar formulario de pago
    const pagoModal = document.getElementById("pago-modal");
    if (pagoModal) {
      pagoModal.style.display = "flex"; // Mostrar el modal con display: flex
      const totalCompra = this.carrito.reduce(
        (sum, producto) => sum + producto.precio * producto.cantidad,
        0
      );
      const totalPagoElement = document.getElementById("total-pago");
      if (totalPagoElement) {
        totalPagoElement.textContent = `Total a pagar: $${totalCompra.toFixed(
          2
        )}`;
      }
    }
  }

  procesarPago(e) {
    e.preventDefault();
  
    const numero = document.getElementById("numero-tarjeta").value;
    const fechaExpiracion = document.getElementById("fecha-expiracion").value;
    const cvv = document.getElementById("cvv").value;
    const nombreTitular = document.getElementById("nombre-titular").value;
  
    const totalCompra = this.carrito.reduce(
      (sum, producto) => sum + producto.precio * producto.cantidad,
      0
    );
  
    try {
      const datosPago = {
        numero,
        fechaExpiracion,
        cvv,
        nombreTitular,
        monto: totalCompra,
      };
  
      // Añadir console.log para debugging
      console.log("Datos de pago:", datosPago);
  
      // Procesar pago
      const resultadoPago = this.authService.procesarPago(datosPago);
  
      console.log("Resultado de pago:", resultadoPago);
  
      if (resultadoPago.estado === "APROBADO") {
        // Actualizar stock de productos
        this.carrito.forEach((itemCarrito) => {
          const productoOriginal = this.productos.find(
            (p) => p.id === itemCarrito.id
          );
          productoOriginal.stock -= itemCarrito.cantidad;
        });
  
        alert(
          `¡Compra realizada con éxito! ID de transacción: ${resultadoPago.transaccionId}`
        );
  
        // Limpiar carrito en memoria y localStorage
        this.carrito = []; 
        this.storageService.clearCart(); 
        
        // Actualizar la interfaz
        this.actualizarCarrito();
  
        // Ocultar modal de pago
        const pagoModal = document.getElementById("pago-modal");
        if (pagoModal) {
          pagoModal.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Error en el pago:", error);
      alert(`Error en el pago: ${error.message}`);
    }
  }

  handleLogin(e) {
    e.preventDefault();
    const correo = document.getElementById("login-correo").value;
    const contrasena = document.getElementById("login-contrasena").value;

    try {
      const usuario = this.authService.login(correo, contrasena);
      this.desbloquearAccesoAplicacion();
      this.loadProducts();
      this.actualizarCarrito();
    } catch (error) {
      alert(error.message);
    }
  }

  handleRegistro(e) {
    e.preventDefault();
    const correo = document.getElementById("registro-correo").value;
    const contrasena = document.getElementById("registro-contrasena").value;
    const repetirContrasena = document.getElementById(
      "registro-repetir-contrasena"
    ).value;

    try {
      const nuevoUsuario = this.authService.registrarUsuario(
        correo,
        contrasena,
        repetirContrasena
      );
      alert("Usuario registrado con éxito");

      // Iniciar sesión automáticamente
      this.authService.currentUser = nuevoUsuario;
      this.desbloquearAccesoAplicacion();
      this.loadProducts();
    } catch (error) {
      alert(error.message);
    }
  }

  checkAuthStatus() {
    const user =
      this.authService.currentUser ||
      JSON.parse(localStorage.getItem("usuarioActual"));
    if (user) {
      this.authService.currentUser = user;
      this.loginModal.classList.add("hidden");
    }
  }
}

// Inicialización de la tienda
const store = new OnlineStore();
