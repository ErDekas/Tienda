// Configuración inicial de EmailJS
(function() {
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
document.getElementById('registro-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Obtener los valores del formulario
    const nombre = document.getElementById('registro-nombre').value;
    const correo = document.getElementById('registro-correo').value;
    const contrasena = document.getElementById('registro-contrasena').value;
    const repetirContrasena = document.getElementById('registro-repetir-contrasena').value;

    // Validar que las contraseñas coincidan
    if (contrasena !== repetirContrasena) {
        alert('Las contraseñas no coinciden');
        return;
    }

    // Crear objeto con los datos del usuario
    const userData = {
        nombre: nombre,
        correo: correo
    };

    // Enviar email de confirmación
    sendRegistrationEmail(userData)
        .then(success => {
            if (success) {
                alert('¡Registro exitoso! Te hemos enviado un correo de confirmación.');
                this.reset();
                // Aquí puedes agregar código para cerrar el modal si lo deseas
                document.getElementById('registro-modal').classList.add('hidden');
            } else {
                alert('Hubo un error al procesar tu registro. Por favor, intenta nuevamente.');
            }
        });

    // Aquí puedes agregar el código para guardar los datos del usuario en tu base de datos
});