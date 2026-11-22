// Punto de entrada: eventos y conexión de todo.

const form = document.querySelector("#form-pedido");
const listaProductos = document.querySelector("#lista-productos");
const lineasCarrito = document.querySelector("#lineas-carrito");
const busqueda = document.querySelector("#busqueda");
const filtroCategoria = document.querySelector("#filtro-categoria");
const filtroModalidad = document.querySelector("#filtro-modalidad");
let siguienteId = 1;

// ---------- Repintar con los filtros actuales ----------

function actualizarCatalogo() {
  // No nos fiamos del valor del select: se comprueba con la lista admitida
  const categoria = CATEGORIAS_VALIDAS.includes(filtroCategoria.value) ? filtroCategoria.value : "todas";
  pintarCatalogo(filtrarCatalogo(catalogo, busqueda.value, categoria));
}

function actualizarHistorial() {
  const modalidad = MODALIDADES_FILTRO.includes(filtroModalidad.value) ? filtroModalidad.value : "todos";
  pintarHistorial(filtrarPedidos(pedidos, modalidad), pedidos.length);
}

// ---------- Catálogo ----------

busqueda.addEventListener("input", actualizarCatalogo);
filtroCategoria.addEventListener("change", actualizarCatalogo);

// Delegación: un solo manejador para todos los botones "Añadir"
listaProductos.addEventListener("click", e => {
  if (!(e.target instanceof Element)) return;
  const boton = e.target.closest('button[data-accion="agregar"]');
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const producto = catalogo.find(p => p.id === id);
  const tarjeta = boton.closest(".tarjeta");
  const cantidad = tarjeta.querySelector("input").valueAsNumber;

  // Se tiene en cuenta lo que ya hay en el carrito
  const error = validarCantidad(cantidad, producto, cantidadEnCarrito(carrito, id));
  if (error !== "") {
    mostrarAvisoTarjeta(tarjeta, error);
    return;
  }

  const linea = carrito.find(l => l.productoId === id);
  if (linea) {
    linea.cantidad += cantidad;
  } else {
    carrito.push({ productoId: id, cantidad: cantidad });
  }
  mostrarAvisoTarjeta(tarjeta, "Añadido al carrito");
  pintarCarrito(carrito, catalogo);
});

// ---------- Carrito ----------

// Delegación: un solo manejador para todos los botones "Retirar"
lineasCarrito.addEventListener("click", e => {
  if (!(e.target instanceof Element)) return;
  const boton = e.target.closest('button[data-accion="retirar"]');
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const posicion = carrito.findIndex(l => l.productoId === id);
  if (posicion !== -1) {
    carrito.splice(posicion, 1);
  }
  pintarCarrito(carrito, catalogo);
});

// ---------- Formulario ----------

function leerDatosFormulario() {
  const datos = new FormData(form);
  return {
    nombre: datos.get("nombre") ?? "",
    correo: datos.get("correo") ?? "",
    entrega: datos.get("entrega") ?? "",
    direccion: datos.get("direccion") ?? "",
    cp: datos.get("cp") ?? "",
    observaciones: datos.get("observaciones") ?? "",
    acepto: datos.has("acepto")
  };
}

// Errores de validarDatosPedido + formato del correo (lo comprueba type="email")
function obtenerErrores(datos) {
  const errores = validarDatosPedido(datos);
  if (form.elements.namedItem("correo").validity.typeMismatch) {
    errores.push({ campo: "correo", mensaje: "El correo no tiene un formato válido" });
  }
  return errores;
}

// Al editar se vuelve a validar, pero solo se muestran los errores del campo
// editado. Así el error desaparece justo cuando el dato pasa a ser válido.
function revisarEdicion(e) {
  actualizarFormulario(form);
  mostrarEstado("");
  const campo = e.target.name;
  if (!CAMPOS.includes(campo)) return;

  const errores = obtenerErrores(leerDatosFormulario());
  const erroresCampo = errores.filter(error => error.campo === campo);
  mostrarErrores(erroresCampo, [campo]);
}
form.addEventListener("input", revisarEdicion);
form.addEventListener("change", revisarEdicion);

form.addEventListener("submit", e => {
  e.preventDefault();

  // 1. VALIDAR (todavía no se modifica nada)
  const pedidoDatos = leerDatosFormulario();
  mostrarErrores(obtenerErrores(pedidoDatos));

  if (!form.checkValidity()) {
    form.reportValidity();
    mostrarEstado("Revisa los campos del formulario");
    return;
  }
  if (carrito.length === 0) {
    mostrarEstado("El carrito está vacío");
    return;
  }
  const erroresStock = comprobarStockCarrito(carrito, catalogo);
  if (erroresStock.length > 0) {
    mostrarEstado("Stock insuficiente. " + erroresStock.join(". "));
    return;
  }

  // 2. MODIFICAR (aquí ya sabemos que todo es válido)
  const resumen = calcularResumen(carrito, catalogo);
  const pedido = {
    id: siguienteId,
    fecha: new Date().toISOString(),
    nombre: pedidoDatos.nombre.trim(),
    correo: pedidoDatos.correo.trim(),
    entrega: pedidoDatos.entrega,
    direccion: pedidoDatos.direccion.trim(),
    cp: pedidoDatos.cp,
    observaciones: pedidoDatos.observaciones.trim(),
    lineas: crearLineasPedido(carrito, catalogo),
    unidades: resumen.unidades,
    subtotal: resumen.subtotal,
    descuento: resumen.descuento,
    total: resumen.total
  };

  // comprobarStockCarrito ya ha confirmado que hay stock de todas las líneas,
  // así que descontar no puede fallar a mitad.
  carrito.forEach(linea => {
    catalogo.find(p => p.id === linea.productoId).descontar(linea.cantidad);
  });
  pedidos.push(pedido);
  siguienteId++;
  carrito.splice(0, carrito.length);

  form.reset();
  actualizarFormulario(form); // reset no dispara input ni change

  // 3. REPINTAR
  actualizarCatalogo();
  pintarCarrito(carrito, catalogo);
  actualizarHistorial();
  mostrarEstado("Pedido nº " + pedido.id + " confirmado");
});

// ---------- Historial ----------

filtroModalidad.addEventListener("change", actualizarHistorial);

document.querySelector("#exportar").addEventListener("click", () => {
  document.querySelector("#salida-json").value = JSON.stringify(pedidos, null, 2);
});

// ---------- Arranque ----------
actualizarCatalogo();
pintarCarrito(carrito, catalogo);
actualizarHistorial();
actualizarFormulario(form);
