// Funciones que crean o modifican el DOM (sin innerHTML).

function formatearImporte(importe) {
  return importe.toFixed(2) + " €";
}

function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";

  const titulo = document.createElement("h3");
  titulo.textContent = producto.nombre;

  const datos = document.createElement("p");
  datos.textContent = NOMBRES_CATEGORIA[producto.categoria] + " · " + formatearImporte(producto.precio) +
    " · Stock: " + producto.stock;

  const etiqueta = document.createElement("label");
  etiqueta.setAttribute("for", "cantidad-" + producto.id);
  etiqueta.textContent = "Cantidad";

  const cantidad = document.createElement("input");
  cantidad.type = "number";
  cantidad.id = "cantidad-" + producto.id;
  cantidad.min = "1";
  cantidad.step = "1";
  cantidad.value = "1";

  const aviso = document.createElement("small");
  aviso.className = "aviso";
  aviso.setAttribute("aria-live", "polite");

  const boton = document.createElement("button");
  boton.type = "button";
  boton.dataset.accion = "agregar";
  boton.dataset.id = String(producto.id);
  boton.textContent = "Añadir";

  if (producto.stock === 0) {
    tarjeta.classList.add("agotado");
    cantidad.disabled = true;
    boton.disabled = true;
  }

  tarjeta.append(titulo, datos, etiqueta, cantidad, boton, aviso);
  return tarjeta;
}

function pintarCatalogo(lista) {
  const contenedor = document.querySelector("#lista-productos");
  contenedor.textContent = "";
  lista.forEach(producto => contenedor.append(crearTarjetaProducto(producto)));
  document.querySelector("#catalogo-vacio").hidden = lista.length > 0;
}

function pintarCarrito(carrito, catalogo) {
  const lista = document.querySelector("#lineas-carrito");
  lista.textContent = "";

  carrito.forEach(linea => {
    const producto = catalogo.find(p => p.id === linea.productoId);
    const li = document.createElement("li");
    li.textContent = producto.nombre + " · " + linea.cantidad + " × " +
      formatearImporte(producto.precio) + " = " +
      formatearImporte(producto.precio * linea.cantidad) + " ";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.dataset.accion = "retirar";
    boton.dataset.id = String(producto.id);
    boton.textContent = "Retirar";

    li.append(boton);
    lista.append(li);
  });

  document.querySelector("#carrito-vacio").hidden = carrito.length > 0;

  const resumen = calcularResumen(carrito, catalogo);
  document.querySelector("#unidades").textContent = String(resumen.unidades);
  document.querySelector("#subtotal").textContent = formatearImporte(resumen.subtotal);
  document.querySelector("#descuento").textContent = formatearImporte(resumen.descuento);
  document.querySelector("#total").textContent = formatearImporte(resumen.total);
}

// Muestra el aviso de una tarjeta (error o confirmación)
function mostrarAvisoTarjeta(tarjeta, texto) {
  tarjeta.querySelector(".aviso").textContent = texto;
}

// Campos del formulario que se validan. Cada uno tiene su <small id="e-...">
const CAMPOS = ["nombre", "correo", "entrega", "direccion", "cp", "observaciones", "acepto"];

// Control al que se asigna el error. Los dos radios comparten mensaje,
// así que el error de "entrega" se pone en el primero (#recogida).
function obtenerControl(campo) {
  if (campo === "entrega") {
    return document.querySelector("#recogida");
  }
  return document.querySelector("#" + campo);
}

// Constraint Validation API:
// 1. se limpian los errores anteriores con setCustomValidity("")
// 2. se pone el mensaje en los campos que tienen error
// 3. el texto del <small> sale de validationMessage
// campos: los que se revisan (por defecto todos; al editar, solo uno)
function mostrarErrores(errores, campos = CAMPOS) {
  campos.forEach(campo => obtenerControl(campo).setCustomValidity(""));
  errores.forEach(error => {
    obtenerControl(error.campo).setCustomValidity(error.mensaje);
  });
  campos.forEach(campo => {
    document.querySelector("#e-" + campo).textContent = obtenerControl(campo).validationMessage;
  });
}

// Quita el error de un campo cuando se corrige o deja de pedirse
function limpiarErrorCampo(campo) {
  obtenerControl(campo).setCustomValidity("");
  document.querySelector("#e-" + campo).textContent = "";
}

function mostrarEstado(texto) {
  document.querySelector("#estado-pedido").textContent = texto;
}

// Contador de observaciones y bloque de envío.
// Se llama al editar y también después de form.reset(),
// porque cambiar valores por código no dispara input ni change.
function actualizarFormulario(form) {
  const observaciones = form.elements.namedItem("observaciones");
  document.querySelector("#contador").textContent = observaciones.value.length + "/200";

  const esEnvio = document.querySelector("#envio").checked;
  document.querySelector("#datos-envio").hidden = !esEnvio;
  form.elements.namedItem("direccion").disabled = !esEnvio;
  form.elements.namedItem("cp").disabled = !esEnvio;

  // Al pasar a recogida no deben conservar ningún error
  if (!esEnvio) {
    limpiarErrorCampo("direccion");
    limpiarErrorCampo("cp");
  }
}

function crearEntradaPedido(pedido) {
  const li = document.createElement("li");

  const cabecera = document.createElement("p");
  cabecera.textContent = "Pedido nº " + pedido.id + " · " +
    new Date(pedido.fecha).toLocaleString("es-ES") + " · " + pedido.nombre + " · " +
    NOMBRES_MODALIDAD[pedido.entrega] + " · " + formatearImporte(pedido.total);

  // Detalle desplegable con las líneas compradas
  const detalle = document.createElement("details");
  const resumen = document.createElement("summary");
  resumen.textContent = "Ver detalle";

  const lineas = document.createElement("ul");
  pedido.lineas.forEach(linea => {
    const item = document.createElement("li");
    item.textContent = linea.nombre + " · " + linea.cantidad + " × " +
      formatearImporte(linea.precio) + " = " + formatearImporte(linea.importe);
    lineas.append(item);
  });

  const importes = document.createElement("p");
  importes.textContent = "Subtotal: " + formatearImporte(pedido.subtotal) +
    " · Descuento: " + formatearImporte(pedido.descuento) +
    " · Total: " + formatearImporte(pedido.total);

  detalle.append(resumen, lineas, importes);
  li.append(cabecera, detalle);
  return li;
}

// lista: pedidos ya filtrados; totalPedidos: tamaño del historial completo
function pintarHistorial(lista, totalPedidos) {
  const contenedor = document.querySelector("#lista-pedidos");
  contenedor.textContent = "";
  lista.forEach(pedido => contenedor.append(crearEntradaPedido(pedido)));

  const vacio = document.querySelector("#historial-vacio");
  if (totalPedidos === 0) {
    vacio.textContent = "Todavía no hay pedidos.";
  } else {
    vacio.textContent = "Ningún pedido cumple el filtro.";
  }
  vacio.hidden = lista.length > 0;

  const datos = resumirPedidos(lista);
  document.querySelector("#resumen-historial").textContent =
    "Pedidos: " + datos.cantidad + " · Importe: " + formatearImporte(datos.suma);
}
