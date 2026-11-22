// NO toca el DOM: recibe los datos y devuelve los errores.

// Código postal: 5 cifras y las dos primeras (provincia) entre 01 y 52.
//   0[1-9] -> 01 a 09 | [1-4][0-9] -> 10 a 49 | 5[0-2] -> 50 a 52
// Después, tres cifras cualesquiera. Grupo sin captura (?: ) con alternativas |
const PATRON_CP = /^(?:0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/;

// Valores admitidos para la modalidad (no basta con que venga de un radio)
const MODALIDADES = ["recogida", "envio"];

// Cantidad que se quiere añadir al carrito.
// yaEnCarrito: lo que ya hay de ese producto. Devuelve "" si es válida.
function validarCantidad(cantidad, producto, yaEnCarrito = 0) {
  if (producto.stock === 0) {
    return "Producto agotado";
  }
  // valueAsNumber de un campo vacío es NaN: no se toma como 0
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    return "Indica una cantidad entera mayor que 0";
  }
  // Se comprueba la suma: lo que ya hay + lo que se quiere añadir
  if (!producto.hayStock(yaEnCarrito + cantidad)) {
    return "Stock insuficiente: puedes añadir como máximo " + (producto.stock - yaEnCarrito);
  }
  return "";
}

function validarDatosPedido(datos) {
  const errores = [];

  const nombre = datos.nombre.trim();
  if (nombre.length < 2 || nombre.length > 60) {
    errores.push({ campo: "nombre", mensaje: "Entre 2 y 60 caracteres" });
  }

  if (datos.correo.trim() === "") {
    errores.push({ campo: "correo", mensaje: "El correo es obligatorio" });
  }

  if (!MODALIDADES.includes(datos.entrega)) {
    errores.push({ campo: "entrega", mensaje: "Elige recogida o envío" });
  }

  // Los datos postales solo se piden si es envío
  if (datos.entrega === "envio") {
    const direccion = datos.direccion.trim();
    if (direccion.length < 5 || direccion.length > 100) {
      errores.push({ campo: "direccion", mensaje: "La dirección debe tener entre 5 y 100 caracteres" });
    }
    if (!PATRON_CP.test(datos.cp)) {
      errores.push({ campo: "cp", mensaje: "Cinco cifras y provincia entre 01 y 52" });
    }
  }

  if (datos.observaciones.length > 200) {
    errores.push({ campo: "observaciones", mensaje: "Máximo 200 caracteres" });
  }

  if (datos.acepto !== true) {
    errores.push({ campo: "acepto", mensaje: "Debes confirmar los datos del pedido" });
  }

  return errores;
}
