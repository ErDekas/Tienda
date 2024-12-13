class OnlineStore {
  constructor() {
    this.apiService = new ApiService();
    this.authService = new AuthService();
    this.storageService = new StorageService();

    this.productos = [];
    this.mostrarModal = false;
    this.tipoModal = "login"; // or 'registro'
    this.loadCategories();
    this.carrito = this.storageService.getCart() || [];
    this.currentPage = 1; // Página actual para la paginación
    this.isLoading = false; // Evitar múltiples solicitudes
    this.hasMoreProducts = true; // Controlar si quedan productos
    this.loadedProductIds = new Set(); // Almacenar IDs ya cargados

    this.initializeDOM();
    // Actualizar el contador del carrito inmediatamente después de inicializar el DOM
    this.actualizarCarrito();
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
    this.loadMoreButton = document.getElementById("loadMore");
    this.loader = document.getElementById("wifi-loader");
    this.carritoContenedor = document.getElementById("cart-modal");

    // Filtros
    this.searchInput = document.getElementById("search-input");
    this.categoryFilter = document.getElementById("category-filter");
    this.priceFilter = document.getElementById("price-filter");

    // Elementos de control
    this.checkoutBtn = document.getElementById("checkout-btn");
    this.loginBtn = document.getElementById("login-btn");
    this.logoutBtn = document.getElementById("logout-btn");
    this.registerBtn = document.getElementById("register-btn");
    this.carritoItems = document.getElementById("cart-items");
    this.carritoTotal = document.getElementById("cart-total");
    this.contadorCarrito = document.getElementById("cart-count");
    this.pagar = document.getElementById("pagar-btn");
    this.populateCategoryFilter();

    // Formularios
    this.loginForm = document.getElementById("login-form");
    this.registroForm = document.getElementById("registro-form");
    this.pagoForm = document.getElementById("pago-form");
  }

  setupEventListeners() {
    this.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const correo = document.getElementById("login-correo").value;
      const contrasena = document.getElementById("login-contrasena").value;

      try {
        await this.iniciarSesion(correo, contrasena);

        // After successful login, check if there's a product waiting to be added
        if (this.productoParaAgregar) {
          this._agregarProductoAlCarrito(this.productoParaAgregar);
          this.productoParaAgregar = null; // Reset
        }

        // Desbloquear acceso a la aplicación
        this.desbloquearAccesoAplicacion();
      } catch (error) {
        alert(error.message);
      }
    });
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
    this.logoutBtn.addEventListener("click", () => this.cerrarSesion());
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
        this.mostrarModalRegistro();
      });

    document.getElementById("mostrar-login").addEventListener("click", (e) => {
      e.preventDefault();
      this.mostrarModalLogin();
    });
    document.getElementById("pagar-btn").addEventListener("click", (e) => {
      e.preventDefault();
      this.procesarPago();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const pagoModal = document.getElementById("pago-modal");
        if (pagoModal && pagoModal.style.display === "flex") {
          pagoModal.style.display = "none";
        }

        const detallesModal = document.getElementById("product-details-modal");
        if (detallesModal && detallesModal.style.display === "flex") {
          this.cerrarModal();
        }
      }
    });
    document.addEventListener("DOMContentLoaded", () => {
      const cartLink = document.getElementById("cart-link");
      const cartModal = document.getElementById("cart-modal");
      const closeCartBtn = document.getElementById("close-cart");

      // Open modal when clicking the cart link
      cartLink.addEventListener("click", (e) => {
        e.preventDefault();
        cartModal.style.display = "flex";
      });

      // Close modal when clicking the close button
      closeCartBtn.addEventListener("click", () => {
        cartModal.style.display = "none";
      });

      // Close modal when clicking outside the modal content
      cartModal.addEventListener("click", (e) => {
        if (e.target === cartModal) {
          cartModal.style.display = "none";
        }
      });
    });
    this.loginBtn.addEventListener("click", () => {
      console.log("Click en botón login");
      this.mostrarModalLogin();
    });
    this.loginModal.addEventListener("click", (e) => {
      if (e.target === this.loginModal) {
        this.loginModal.style.display = "none";
      }
    });
    this.registroModal.addEventListener("click", (e) => {
      if (e.target === this.registroModal) {
        this.registroModal.style.display = "none";
      }
    });
    // Register button event listener
    this.registerBtn.addEventListener("click", () => {
      console.log("Click en botón register");
      this.mostrarModalRegistro();
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

        try {
          await this.loadProducts(this.currentPage);
        } catch (error) {
          console.error("Error en scroll infinito:", error);
          this.hideLoader();
          this.isLoading = false;
        }
      }
    });
  }

  showLoader() {
    this.loader.style.display = "flex";
  }

  hideLoader() {
    this.loader.style.display = "none";
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
    const usuarioGuardado = this.authService.getCurrentUser();

    if (usuarioGuardado) {
      try {
        this.authService.currentUser = usuarioGuardado;
        this.desbloquearAccesoAplicacion();
        // Ensure loadProducts is called with the initial page
        this.loadProducts(1)
          .then(() => {
            // Hide loader after initial load
            this.hideLoader();
          })
          .catch((error) => {
            console.error("Error loading initial products:", error);
            this.hideLoader(); // Ensure loader is hidden even if there's an error
            this.mostrarModalLogin();
          });
      } catch (error) {
        this.mostrarModalLogin();
        this.hideLoader();
      }
    } else {
      // If no user is saved, still try to load products
      this.loadProducts(1)
        .then(() => {
          this.hideLoader();
        })
        .catch((error) => {
          console.error("Error loading initial products:", error);
          this.hideLoader();
        });
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
    this.loginModal.style.display = "none";
    // Ocultar modales de login
    this.loginModal.classList.add("hidden");
    this.registroModal.classList.add("hidden");
  }

  mostrarModalLogin() {
    const loginModal = document.getElementById("login-modal");
    loginModal.style.display = "flex";
    loginModal.classList.remove("hidden");
    console.log(
      "Modal login visible:",
      !loginModal.classList.contains("hidden")
    );
  }

  mostrarModalRegistro() {
    const registroModal = document.getElementById("registro-modal");
    registroModal.style.display = "flex";
    registroModal.classList.remove("hidden");
    console.log(
      "Modal registro visible:",
      !registroModal.classList.contains("hidden")
    );
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
      this.isLoading = true;
      this.showLoader(); // Always show loader at start

      const nuevosProductos = await this.apiService.fetchProducts(
        page,
        10,
        category
      );

      if (page === 1) {
        this.productosContenedor.innerHTML = "";
        this.loadedProductIds.clear();
      }

      if (nuevosProductos.length === 0) {
        this.hasMoreProducts = false;
        this.hideLoader(); // Hide loader if no products

        if (page === 1) {
          this.productosContenedor.innerHTML =
            "<p>No hay productos disponibles.</p>";
        }
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

      // Hide loader after successful load
      this.hideLoader();
      this.isLoading = false;
    } catch (error) {
      console.error("Error al cargar productos:", error);
      alert("Error al cargar productos. Por favor, inténtalo de nuevo.");
      this.hideLoader();
      this.isLoading = false;
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
      this.productosContenedor.innerHTML = "";
    }

    const imagenPorDefecto = "https://placehold.co/300x400?text=Without+Image";

    const productosHTML = nuevosProductos
      .map((producto) => {
        const stockDisponible = this.obtenerStockDisponible(producto.id);
        return `
          <div class="product-card ${stockDisponible === 0 ? "sin-stock" : ""}" 
               onclick="store.mostrarDetallesProducto(${producto.id})">
              <img 
                  src="${producto.imagen}" 
                  alt="${producto.nombre}" 
                  onerror="this.onerror=null;this.src='${imagenPorDefecto}';"
              >
              <h3>${producto.nombre}</h3>
              <p>$${producto.precio.toFixed(2)}</p>
              <p>Stock: ${stockDisponible}</p>
          </div>
        `;
      })
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
    modalStock.textContent = `Stock: ${this.obtenerStockDisponible(
      idProducto
    )}`;

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

      // Agregar evento onerror para cambiar la imagen por defecto si no se puede cargar
      imagenActiva.onerror = () => {
        imagenActiva.src = imagenPorDefecto;
      };

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
        imagenActiva.onerror = () => {
          imagenActiva.src = imagenPorDefecto;
        };
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

  handleRegistro(e) {
    e.preventDefault();
    const correo = document.getElementById("registro-correo").value;
    const contrasena = document.getElementById("registro-contrasena").value;
    const repetirContrasena = document.getElementById(
      "registro-repetir-contrasena"
    ).value;

    // Validar que las contraseñas coincidan
    if (contrasena !== repetirContrasena) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      // Usar el método existente de registrarUsuario
      this.registrarUsuario(correo, correo, contrasena)
        .then((usuario) => {
          // Ocultar modal de registro
          this.registroModal.classList.add("hidden");

          // Desbloquear acceso a la aplicación
          this.desbloquearAccesoAplicacion();

          // Intentar agregar el producto pendiente si existe
          if (this.productoParaAgregar) {
            this._agregarProductoAlCarrito(this.productoParaAgregar);
            this.productoParaAgregar = null; // Reset
          }
        })
        .catch((error) => {
          alert(error.message);
        });
    } catch (error) {
      alert(error.message);
    }
  }

  agregarAlCarrito(idProducto) {
    // Close the product details modal first
    this.cerrarModal();

    // Check if user is logged in before adding to cart
    const usuarioActual = this.authService.getCurrentUser();

    if (!usuarioActual) {
      // If not logged in, show login modal
      this.mostrarModalLogin();

      // Store the product ID to add to cart after login
      this.productoParaAgregar = idProducto;

      return;
    }

    this._agregarProductoAlCarrito(idProducto);
  }

  _agregarProductoAlCarrito(idProducto) {
    const producto = this.productos.find((p) => p.id === idProducto);
    const productoExistente = this.carrito.find((p) => p.id === idProducto);

    // Check if we have enough stock
    const stockActual = this.obtenerStockDisponible(idProducto);

    if (stockActual <= 0) {
      alert("No hay stock disponible");
      return;
    }

    if (productoExistente) {
      if (productoExistente.cantidad < stockActual) {
        productoExistente.cantidad++;
        this.actualizarVistaStock(idProducto);
      } else {
        alert("No hay más stock disponible");
        return;
      }
    } else {
      this.carrito.push({ ...producto, cantidad: 1 });
      this.actualizarVistaStock(idProducto);
    }

    this.actualizarCarrito();
  }

  // New method to calculate available stock
  obtenerStockDisponible(idProducto) {
    const producto = this.productos.find((p) => p.id === idProducto);
    const itemCarrito = this.carrito.find((p) => p.id === idProducto);
    const cantidadEnCarrito = itemCarrito ? itemCarrito.cantidad : 0;
    return producto.stock - cantidadEnCarrito;
  }

  // New method to update stock display
  actualizarVistaStock(idProducto) {
    const stockDisponible = this.obtenerStockDisponible(idProducto);

    // Update stock in product cards
    const productCards = document.querySelectorAll(".product-card");
    productCards.forEach((card) => {
      if (card.getAttribute("onclick")?.includes(`${idProducto}`)) {
        const stockElement = card.querySelector("p:last-child");
        if (stockElement) {
          stockElement.textContent = `Stock: ${stockDisponible}`;
        }
      }
    });

    // Update stock in product details modal if it's open
    const modalStock = document.querySelector(".modal-stock");
    if (
      modalStock &&
      document.getElementById("product-details-modal").style.display === "flex"
    ) {
      modalStock.textContent = `Stock: ${stockDisponible}`;
    }
  }

  // Métodos para manejar login y registro
  async iniciarSesion(correo, contrasena) {
    try {
      if (correo === "admin@gmail.com" && contrasena === "admin") {
        // Modo administrador: Ocultar app y mostrar admin
        document.getElementById("app").style.display = "none";
        document.getElementById("admin").style.display = "block";
        alert("Bienvenido Administrador");
      } else {
        const usuario = await this.authService.login(correo, contrasena);
        this.mostrarModal = false;
        alert(`Bienvenido, ${usuario.name}!`);
        this.loginBtn.style.display = "none";
        this.logoutBtn.style.display = "block";
      }
    } catch (error) {
      alert(error.message);
    }
  }  

  async registrarUsuario(nombre, correo, contrasena) {
    try {
      const usuario = await this.authService.registrarUsuario(
        nombre,
        correo,
        contrasena
      );
      this.mostrarModal = false;
      alert(`Registro exitoso, bienvenido ${usuario.name}!`);
      // Mandar correo de bienvenida
      // Configuración inicial de EmailJS
      (function () {
        // Reemplaza "YOUR_PUBLIC_KEY" con tu clave pública de EmailJS
        emailjs.init("77V4-gSSreUvCfKT8");
      })();

      // Función para enviar el email de confirmación de registro
      const sendRegistrationEmail = async (userData) => {
        try {
          const response = await emailjs.send(
            "service_vl9m76m", // Tu Service ID de EmailJS
            "template_loraic8", // Tu Template ID
            {
              to_name: userData.nombre,
              user_email: userData.correo,
              // Puedes agregar más variables según tu template
              // Por seguridad, no enviamos la contraseña por email
            }
          );

          if (response.status === 200) {
            console.log("¡Email de registro enviado exitosamente!");
            return true;
          }
        } catch (error) {
          console.error("Error al enviar el email de registro:", error);
          return false;
        }
      };

      // Manejo del formulario de registro
      document
        .getElementById("registro-form")
        .addEventListener("submit", function (event) {
          event.preventDefault();

          // Obtener los valores del formulario
          const nombre = document.getElementById("registro-nombre").value;
          const correo = document.getElementById("registro-correo").value;
          const contrasena = document.getElementById(
            "registro-contrasena"
          ).value;
          const repetirContrasena = document.getElementById(
            "registro-repetir-contrasena"
          ).value;

          // Validar que las contraseñas coincidan
          if (contrasena !== repetirContrasena) {
            alert("Las contraseñas no coinciden");
            return;
          }

          // Crear objeto con los datos del usuario
          const userData = {
            nombre: nombre,
            correo: correo,
          };

          // Enviar email de confirmación
          sendRegistrationEmail(userData).then((success) => {
            if (success) {
              alert(
                "¡Registro exitoso! Te hemos enviado un correo de confirmación."
              );
              this.reset();
              // Aquí puedes agregar código para cerrar el modal si lo deseas
              document.getElementById("registro-modal").classList.add("hidden");
            } else {
              alert(
                "Hubo un error al procesar tu registro. Por favor, intenta nuevamente."
              );
            }
          });

          // Aquí puedes agregar el código para guardar los datos del usuario en tu base de datos
        });

      // Intentar agregar el producto pendiente si existe
      if (this.productoParaAgregar) {
        this._agregarProductoAlCarrito(this.productoParaAgregar);
        this.productoParaAgregar = null; // Reset
      }

      return usuario;
    } catch (error) {
      throw error;
    }
  }

  // Método para cerrar sesión
  cerrarSesion() {
    this.authService.logout();
    this.logoutBtn.style.display = "none";
    this.loginBtn.style.display = "block";
    // Lógica adicional después de cerrar sesión
    alert("Sesión cerrada");
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
                      <button class="btn-control btn-reducir" onclick="store.reducirCantidad(${
                        producto.id
                      })">
                        &#x2796; <!-- Símbolo de menos -->
                      </button>
                      <span class="cantidad">${producto.cantidad}</span>
                      <button class="btn-control btn-aumentar" onclick="store.aumentarCantidad(${
                        producto.id
                      })">
                        &#x2795; <!-- Símbolo de más -->
                      </button>
                      <button class="btn-control btn-eliminar" onclick="store.eliminarDelCarrito(${
                        producto.id
                      })">
                        &#x1F5D1; <!-- Icono de papelera -->
                      </button>
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

  aumentarCantidad(idProducto) {
    const producto = this.carrito.find((p) => p.id === idProducto);
    const stockDisponible = this.obtenerStockDisponible(idProducto);

    if (stockDisponible > 0) {
      producto.cantidad++;
      this.actualizarCarrito();
      this.actualizarVistaStock(idProducto);
    } else {
      alert("No hay más stock disponible");
    }
  }

  reducirCantidad(idProducto) {
    const producto = this.carrito.find((p) => p.id === idProducto);
    if (producto.cantidad > 1) {
      producto.cantidad--;
      this.actualizarVistaStock(idProducto);
    } else {
      this.eliminarDelCarrito(idProducto);
    }
    this.actualizarCarrito();
  }

  eliminarDelCarrito(idProducto) {
    this.carrito = this.carrito.filter(
      (producto) => producto.id !== idProducto
    );
    this.actualizarVistaStock(idProducto);
    this.actualizarCarrito();
  }

  iniciarProcesoCompra() {
    // Check if user is logged in
    if (!this.authService.getCurrentUser()) {
      // If not logged in, show login modal and prevent checkout
      this.mostrarModalLogin();
      return;
    }
    this.carritoContenedor.style.display = "flex";
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

  procesarPago() {
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
        // Configuración inicial de EmailJS
        (function () {
          // Reemplaza "YOUR_PUBLIC_KEY" con tu clave pública de EmailJS
          emailjs.init("77V4-gSSreUvCfKT8");
        })();

        // Función para enviar el email de confirmación de compra
        const sendPurchaseConfirmationEmail = async (purchaseData) => {
          try {
            const response = await emailjs.send(
              "service_vl9m76m", // Tu Service ID de EmailJS
              "template_zhsjskh", // Tu Template ID para confirmación de compra
              {
                to_name: purchaseData.nombre,
                user_email: purchaseData.correo,
                order_id: purchaseData.idPedido,
                total_amount: purchaseData.montoTotal,
                items: purchaseData.articulos, // Si los artículos se envían como una lista, ajusta el template para recibirlos correctamente
              }
            );

            if (response.status === 200) {
              console.log(
                "¡Email de confirmación de compra enviado exitosamente!"
              );
              return true;
            }
          } catch (error) {
            console.error(
              "Error al enviar el email de confirmación de compra:",
              error
            );
            return false;
          }
        };

        // Función para manejar el proceso después de una compra
        const handlePurchase = async (purchaseDetails) => {
          // Datos de ejemplo del pedido
          const purchaseData = {
            nombre: purchaseDetails.nombre,
            correo: purchaseDetails.correo,
            idPedido: purchaseDetails.idPedido,
            montoTotal: purchaseDetails.montoTotal,
            articulos: purchaseDetails.articulos.map(
              (item) => `\n- ${item.cantidad} x ${item.nombre}`
            ),
          };

          // Enviar email de confirmación de compra
          const emailSent = await sendPurchaseConfirmationEmail(purchaseData);
          if (emailSent) {
            alert(
              "¡Gracias por tu compra! Te hemos enviado un correo de confirmación."
            );
            // Aquí puedes agregar lógica adicional, como redirigir a una página de agradecimiento
          } else {
            alert(
              "Hubo un problema al enviar el correo de confirmación. Por favor, revisa tu compra."
            );
          }
        };

        // Ejemplo de llamada a la función handlePurchase cuando se completa una compra
        const completarCompra = () => {
          const purchaseDetails = {
            nombre: "Juan Pérez",
            correo: "juan.perez@example.com",
            idPedido: "12345",
            montoTotal: "$150.00",
            articulos: [
              { nombre: "Producto A", cantidad: 2 },
              { nombre: "Producto B", cantidad: 1 },
            ],
          };

          handlePurchase(purchaseDetails);
        };

        // Llamar a la función completarCompra cuando se completa la compra
        completarCompra();
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
}

// Inicialización de la tienda
const store = new OnlineStore();
