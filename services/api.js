class ApiService {
  constructor() {
    this.baseUrl = "https://api.escuelajs.co/api/v1/products";
    this.categoriesUrl = "https://api.escuelajs.co/api/v1/categories"; // Endpoint para categorías
  }

  // Función para obtener productos con paginación y categoría
  async fetchProducts(page = 1, limit = 10, category = "") {
    try {
      const offset = (page - 1) * limit;
      let urlWithPagination = `${this.baseUrl}?offset=${offset}&limit=${limit}`;

      // Si hay una categoría, ajustar el URL para filtrar
      if (category) {
        urlWithPagination = `https://api.escuelajs.co/api/v1/categories/${category}/products?offset=${offset}&limit=${limit}`;
      }

      const response = await fetch(urlWithPagination);
      const products = await response.json();

      return products.map((product) => ({
        id: product.id,
        nombre: product.title,
        precio: product.price,
        imagen: product.images[0], // Primera imagen del producto
        descripcion: product.description,
        stock: Math.floor(Math.random() * 50) + 10, // Stock aleatorio
        imagenes: product.images, // Array completo de imágenes
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  // Función para obtener todas las categorías
  async fetchCategories() {
    try {
      const response = await fetch(this.categoriesUrl);
      if (!response.ok) throw new Error("Error al obtener categorías");

      const categories = await response.json();

      return categories.map((category) => ({
        id: category.id,
        name: category.name,
      }));
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  // Función para obtener las imágenes por producto
  async obtenerImagenesProducto() {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) throw new Error("Error al obtener productos");

      const productos = await response.json();

      // Mapear los productos para incluir sus imágenes en un array específico por producto
      return productos.map((producto) => ({
        id: producto.id,
        nombre: producto.title,
        imagenes: producto.images, // Array de imágenes del producto
      }));
    } catch (error) {
      console.error("Error al obtener imagenes de productos:", error);
      return [];
    }
  }
}