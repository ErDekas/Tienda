class StorageService {
  constructor() {
    if (!window.localStorage) {
      console.error("localStorage no está disponible en este navegador.");
      return;
    }
    this.storage = localStorage;
  }

  saveCart(cart) {
    try {
      this.storage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Error al guardar el carrito:", error);
    }
  }

  getCart() {
    try {
      const cart = this.storage.getItem("cart");
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error("Error al recuperar el carrito:", error);
      return [];
    }
  }

  clearCart() {
    try {
      // Remove only the cart item, preserving other localStorage data
      this.storage.removeItem("cart");
    } catch (error) {
      console.error("Error al limpiar el carrito:", error);
    }
  }
}