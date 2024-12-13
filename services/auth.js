class AuthService {
  constructor() {
    this.baseUrl = "https://api.escuelajs.co/api/v1/users";
  }

  // Validaciones de registro
  validarCorreo(correo) {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCorreo.test(correo);
  }

  validarContrasena(contrasena) {
    const regexContrasena =
      /^.{6,}$/;
    return regexContrasena.test(contrasena);
  }

  // Registro de usuario mediante API
  async registrarUsuario(nombre, correo, contrasena) {
    // Validaciones
    if (!this.validarCorreo(correo)) {
      throw new Error("Correo electrónico inválido");
    }

    if (!this.validarContrasena(contrasena)) {
      throw new Error(
        "La contraseña debe tener al menos 6 caracteres"
      );
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nombre,
          email: correo,
          password: contrasena,
          avatar: 'https://api.lorem.space/image/face?w=640&h=480&r=867'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar usuario");
      }

      const usuarioRegistrado = await response.json();
      
      // Guardar información básica en sessionStorage
      sessionStorage.setItem('usuarioActual', JSON.stringify({
        id: usuarioRegistrado.id,
        nombre: usuarioRegistrado.name,
        correo: usuarioRegistrado.email
      }));

      return usuarioRegistrado;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    }
  }

  // Login de usuario
  async login(correo, contrasena) {
    try {
      const response = await fetch('https://api.escuelajs.co/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: correo,
          password: contrasena
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en el inicio de sesión");
      }

      const loginData = await response.json();

      // Obtener información del perfil del usuario
      const profileResponse = await fetch('https://api.escuelajs.co/api/v1/auth/profile', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });

      if (!profileResponse.ok) {
        throw new Error("No se pudo obtener la información del perfil");
      }

      const perfil = await profileResponse.json();

      // Guardar información en sessionStorage
      sessionStorage.setItem('usuarioActual', JSON.stringify({
        id: perfil.id,
        nombre: perfil.name,
        correo: perfil.email,
        token: loginData.access_token
      }));

      return perfil;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }

  // Cerrar sesión
  logout() {
    sessionStorage.removeItem('usuarioActual');
  }

  // Obtener usuario actual
  getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('usuarioActual'));
  }

  // Validación de tarjeta de crédito (similar a la implementación anterior)
  validarTarjetaCredito(numero, fechaExpiracion, cvv, nombreTitular) {
    // Algoritmo de Luhn para validación de número de tarjeta
    const validarNumeroTarjeta = (numero) => {
      numero = numero.replace(/\s/g, "");
      if (!/^\d+$/.test(numero)) return false;

      let suma = 0;
      let esSegundoDigito = false;

      for (let i = numero.length - 1; i >= 0; i--) {
        let digito = parseInt(numero.charAt(i), 10);

        if (esSegundoDigito) {
          digito *= 2;
          if (digito > 9) {
            digito -= 9;
          }
        }

        suma += digito;
        esSegundoDigito = !esSegundoDigito;
      }

      return suma % 10 === 0;
    };

    // Validación de fecha de expiración
    const validarFechaExpiracion = (fecha) => {
      const [mes, año] = fecha.split("/");
      const fechaExpiracion = new Date(`20${año}`, mes - 1);
      return fechaExpiracion > new Date();
    };

    // Validación de CVV
    const validarCVV = (cvv) => {
      return /^\d{3,4}$/.test(cvv);
    };

    // Validación de nombre del titular (no debe contener letras minúsculas)
    const validarNombreTitular = (nombre) => {
      return /^[^a-z]+$/.test(nombre);
    };

    return {
      numeroValido: validarNumeroTarjeta(numero),
      fechaValida: validarFechaExpiracion(fechaExpiracion),
      cvvValido: validarCVV(cvv),
      nombreTitularValido: validarNombreTitular(nombreTitular),
    };
  }

  // Procesamiento de pago
  procesarPago(datosPago) {
    const { numero, fechaExpiracion, cvv, nombreTitular, monto } = datosPago;

    const validacion = this.validarTarjetaCredito(numero, fechaExpiracion, cvv, nombreTitular);

    // Validaciones
    if (!validacion.numeroValido) {
      throw new Error("Número de tarjeta inválido");
    }

    if (!validacion.fechaValida) {
      throw new Error("Tarjeta expirada");
    }

    if (!validacion.cvvValido) {
      throw new Error("CVV inválido");
    }

    if (!validacion.nombreTitularValido) {
      throw new Error("Nombre del titular inválido");
    }

    // Simulación de procesamiento de pago
    return {
      estado: "APROBADO",
      transaccionId: `TRANS-${Date.now()}`,
      monto,
      fechaProcesamiento: new Date().toISOString(),
    };
  }
}