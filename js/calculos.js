// Estas funciones NO tocan el DOM: reciben datos y devuelven un resultado.

const UMBRAL_DESCUENTO = 100;
const PORCENTAJE_DESCUENTO = 10;

function calcularSubtotal(carrito, catalogo) {
  let subtotal = 0;
  carrito.forEach(linea => {
    const producto = catalogo.find(p => p.id === linea.productoId);
    if (producto) {
      subtotal += producto.precio * linea.cantidad;
    }
  });
  return subtotal;
}

function calcularDescuento(subtotal, porcentaje = 0) {
  return subtotal * porcentaje / 100;
}

function calcularTotal(subtotal, descuento) {
  return subtotal - descuento;
}

function contarUnidades(carrito) {
  let unidades = 0;
  carrito.forEach(linea => {
    unidades += linea.cantidad;
  });
  return unidades;
}

// Unidades de un producto que ya están en el carrito (0 si no está)
function cantidadEnCarrito(carrito, productoId) {
  const linea = carrito.find(l => l.productoId === productoId);
  return linea ? linea.cantidad : 0;
}

// Único sitio donde se decide el descuento (10 % desde 100 €).
// La usan vista.js (para pintar) y app.js (para crear el pedido).
function calcularResumen(carrito, catalogo) {
  const subtotal = calcularSubtotal(carrito, catalogo);
  const porcentaje = subtotal >= UMBRAL_DESCUENTO ? PORCENTAJE_DESCUENTO : 0;
  const descuento = calcularDescuento(subtotal, porcentaje);
  return {
    subtotal: subtotal,
    descuento: descuento,
    total: calcularTotal(subtotal, descuento),
    unidades: contarUnidades(carrito)
  };
}

// Comprueba el stock de todo el carrito antes de confirmar.
// Devuelve un array de mensajes; vacío si todo está bien.
function comprobarStockCarrito(carrito, catalogo) {
  const errores = [];
  carrito.forEach(linea => {
    const producto = catalogo.find(p => p.id === linea.productoId);
    if (!producto) {
      errores.push("Hay un producto que ya no existe en el catálogo");
    } else if (!producto.hayStock(linea.cantidad)) {
      errores.push(producto.nombre + ": pides " + linea.cantidad + " y quedan " + producto.stock);
    }
  });
  return errores;
}

// Copia de las líneas con el nombre y el precio de este momento,
// para que el historial no dependa del catálogo actual.
function crearLineasPedido(carrito, catalogo) {
  return carrito.map(linea => {
    const producto = catalogo.find(p => p.id === linea.productoId);
    return {
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: linea.cantidad,
      importe: producto.precio * linea.cantidad
    };
  });
}

// Búsqueda por nombre (sin distinguir mayúsculas) + filtro por categoría
function filtrarCatalogo(catalogo, texto, categoria) {
  const buscado = texto.trim().toLowerCase();
  return catalogo.filter(producto => {
    const coincideNombre = producto.nombre.toLowerCase().includes(buscado);
    const coincideCategoria = categoria === "todas" || producto.categoria === categoria;
    return coincideNombre && coincideCategoria;
  });
}

function filtrarPedidos(pedidos, modalidad) {
  if (modalidad === "todos") {
    return pedidos;
  }
  return pedidos.filter(pedido => pedido.entrega === modalidad);
}

// Número de pedidos y suma de sus totales, sobre la lista que se le pase
function resumirPedidos(lista) {
  let suma = 0;
  lista.forEach(pedido => {
    suma += pedido.total;
  });
  return { cantidad: lista.length, suma: suma };
}
