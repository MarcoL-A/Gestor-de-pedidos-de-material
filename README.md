# Gestor de pedidos de material

Práctica 2 de Desarrollo Web en Entorno Cliente (DWEC). Es una aplicación web para pedir material informático y de oficina: se consulta un catálogo, se añaden productos a un carrito, se confirma el pedido con un formulario validado y los pedidos quedan en un historial que se puede filtrar y exportar a JSON. Funciona solo en el navegador con HTML, CSS y JavaScript, sin servidor, base de datos ni frameworks. Los datos están en arrays en memoria y se pierden al recargar.

## Cómo ejecutarlo

Hay que abrirlo por HTTP, no con `file://`:

- **Live Server (VS Code):** clic derecho en `index.html` → **Open with Live Server**.
- **Python:** en la carpeta del proyecto, `python -m http.server 8000` y abrir `http://localhost:8000`.

## Estructura

```
gestor-pedidos/
├── index.html          Estructura de la página
├── css/
│   └── estilos.css     Estilos
├── js/
│   ├── producto.js     Clase Producto
│   ├── datos.js        Catálogo inicial, carrito [], pedidos [] y valores admitidos
│   ├── calculos.js     Cálculos y filtros (no tocan el DOM)
│   ├── validacion.js   Validaciones y regex del código postal (no tocan el DOM)
│   ├── vista.js        Funciones que crean o modifican el DOM
│   └── app.js          Eventos: conecta datos, cálculos, validación y vista
├── evidencias/
│   ├── breakpoint.png
│   └── network.png
└── README.md
```

Los scripts se cargan con `<script defer>` en este orden, así que se ejecutan con el DOM ya construido y cada fichero puede usar lo definido en los anteriores.

Las funciones de `calculos.js` y `validacion.js` reciben los datos por parámetros y devuelven un resultado, sin leer ni modificar el DOM. Las de `vista.js` son las únicas que crean nodos (`createElement`, `textContent`, `append`, sin `innerHTML`). `app.js` registra los eventos y une todo.

## Funcionalidades

### Clase Producto y datos
- **Ficheros:** `producto.js`, `datos.js`.
- `Producto` tiene un constructor y dos métodos que usan `this`:
  - `hayStock(cantidad)`: comprueba que la cantidad sea un entero positivo que no supere el stock.
  - `descontar(cantidad)`: resta la cantidad del stock si hay suficiente.
- El catálogo tiene 6 productos de 3 categorías. El Teclado no tiene stock. 8 ratones suman 100 € justos, lo que sirve para probar el descuento.

### Catálogo, búsqueda y filtro
- **Funciones:** `crearTarjetaProducto` y `pintarCatalogo` (`vista.js`), `filtrarCatalogo` (`calculos.js`), `actualizarCatalogo` (`app.js`).
- Cada tarjeta muestra el nombre, la categoría, el precio, el stock, un campo de cantidad y el botón **Añadir**. Los agotados se muestran con el campo y el botón deshabilitados.
- La búsqueda por nombre usa `toLowerCase`, así que no distingue mayúsculas. Se combina con el filtro de categoría mediante `filter`. Se escucha `input` en el buscador y `change` en el select, y el valor del select se comprueba con `CATEGORIAS_VALIDAS`. Si no hay resultados aparece un mensaje.

### Carrito
- **Funciones:** `validarCantidad` (`validacion.js`), `cantidadEnCarrito` y `calcularResumen` (`calculos.js`), `pintarCarrito` (`vista.js`) y los dos manejadores delegados de `app.js`.
- **Añadir:** delegación de eventos en `#lista-productos`. La cantidad se lee con `valueAsNumber`, de modo que un campo vacío da `NaN` y no 0. Se rechazan las cantidades vacías, decimales, menores que 1, o que, sumadas a lo que ya hay en el carrito, superen el stock. El motivo aparece en el aviso de la tarjeta. Si el producto ya está en el carrito se suma la cantidad (`find`); si no, se añade una línea (`push`).
- **Retirar:** delegación de eventos en `#lineas-carrito`. Se busca la posición con `findIndex` y se elimina con `splice`.
- Cada línea muestra nombre, cantidad, precio y subtotal. Debajo aparecen las unidades, el subtotal, el descuento y el total.
- Añadir al carrito no descuenta stock. Eso solo ocurre al confirmar el pedido.

### Cálculos
- **Fichero:** `calculos.js`.
- `calcularSubtotal(carrito, catalogo)`, `calcularDescuento(subtotal, porcentaje = 0)` (con parámetro por defecto), `calcularTotal` y `contarUnidades`.
- `calcularResumen(carrito, catalogo)` es el único sitio donde se decide el 10 % (si el subtotal es igual o mayor que 100). Devuelve `{ subtotal, descuento, total, unidades }` y la usan tanto la vista como la creación del pedido.

### Formulario y validación
- **Funciones:** `validarDatosPedido` y `PATRON_CP` (`validacion.js`), `mostrarErrores`, `obtenerControl`, `limpiarErrorCampo` y `actualizarFormulario` (`vista.js`), `leerDatosFormulario`, `obtenerErrores` y `revisarEdicion` (`app.js`).
- El formulario tiene `novalidate` y atributos HTML5 (`required`, `type="email"`, `minlength`, `maxlength`). Las modalidades van en un `fieldset` con `legend`. Los datos se leen con `FormData`.
- `validarDatosPedido(datos)` devuelve un array de errores `{ campo, mensaje }`:
  - nombre de 2 a 60 caracteres tras `trim`;
  - correo obligatorio;
  - entrega incluida en `["recogida", "envio"]`;
  - si es envío, dirección de 5 a 100 caracteres y código postal con `PATRON_CP.test()`;
  - observaciones de 200 caracteres como máximo;
  - casilla de aceptación marcada.
- La regex del código postal es `/^(?:0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/`: un grupo sin captura con alternativas para la provincia 01–52, seguido de tres cifras.
- El formato del correo lo comprueba el `type="email"`. En `app.js` se consulta `validity.typeMismatch`.
- **Constraint Validation API:** `mostrarErrores` primero limpia con `setCustomValidity("")`, después pone `setCustomValidity(mensaje)` en los campos con error y escribe `validationMessage` en el `<small>` de cada campo. En el `submit` se decide con `form.checkValidity()` y, si falla, se llama a `form.reportValidity()`.
- **Al editar** (`input` y `change`), `revisarEdicion`:
  - actualiza el contador de observaciones y el bloque de envío;
  - borra el mensaje de estado anterior;
  - vuelve a validar y, con `filter`, muestra solo los errores del campo editado, así que el error desaparece justo cuando el dato es válido.
- Al pasar a recogida, la dirección y el código postal se ocultan, se deshabilitan (y por tanto no se validan ni entran en `FormData`) y se les borra el error.
- **Submit**, en este orden:
  1. Validar el formulario, comprobar que el carrito no está vacío y comprobar el stock (`comprobarStockCarrito`). Si falla algo, no se modifica nada.
  2. Crear el pedido, descontar el stock, añadirlo al historial y vaciar el carrito.
  3. Repintar las vistas.

  Después de `form.reset()` se llama a `actualizarFormulario`, porque cambiar valores por código no dispara `input` ni `change`.

### Historial y exportación
- **Funciones:** `crearLineasPedido`, `filtrarPedidos` y `resumirPedidos` (`calculos.js`), `crearEntradaPedido` y `pintarHistorial` (`vista.js`), `actualizarHistorial` y el botón **Exportar** (`app.js`).
- Cada pedido guarda número, fecha, cliente, correo, modalidad, dirección, observaciones, líneas e importes. Las líneas se crean con `map` y copian el nombre y el precio del momento de la compra, así que el historial no cambia aunque cambie el catálogo.
- Cada entrada muestra el número, la fecha, el cliente, la modalidad («Recogida» o «Envío») y el total, y se puede desplegar con `<details>`/`<summary>` para ver las líneas.
- El filtro por modalidad muestra el número de pedidos y la suma de importes calculados sobre los pedidos filtrados. Si no hay pedidos, o ninguno cumple el filtro, aparece un mensaje.
- **Exportar historial** escribe `JSON.stringify(pedidos, null, 2)` en un `textarea` de solo lectura.

## Casos de prueba

Con la página recién cargada, salvo que se indique otra cosa.

| # | Funcionalidad | Pasos y datos | Resultado esperado |
|---|---|---|---|
| 1 | Producto agotado | Mirar la tarjeta del Teclado | Stock 0, con el campo y el botón **Añadir** deshabilitados |
| 2 | Cantidad inválida | Ratón USB: dejar la cantidad vacía y pulsar **Añadir** | Aviso «Indica una cantidad entera mayor que 0». El carrito no cambia |
| 3 | Suma de cantidades | Ratón USB: añadir `3` y después `5` | Una sola línea con 8 unidades |
| 4 | Stock insuficiente | Ratón USB: añadir `5` y después `5` | La segunda vez sale el aviso «Stock insuficiente: puedes añadir como máximo 3». El carrito se queda con 5 |
| 5 | Umbral de 100 € | Añadir 8 ratones | Subtotal 100.00 €, descuento 10.00 €, total 90.00 € |
| 6 | Por debajo de 100 € | Añadir 7 ratones | Subtotal 87.50 €, descuento 0.00 €, total 87.50 € |
| 7 | Eliminación de líneas | Añadir 1 ratón y 2 paquetes de folios. Pulsar **Retirar** en los folios | Solo desaparece esa línea y se recalculan los totales |
| 8 | Carrito vacío | Rellenar bien el formulario sin nada en el carrito y pulsar **Confirmar** | «El carrito está vacío» y no se crea pedido |
| 9 | Correo inválido | Escribir `abc` en el correo | Error «El correo no tiene un formato válido». Al escribir `ana@ejemplo.es` el error desaparece |
| 10 | Error solo al corregir | Enviar con el nombre vacío y escribir `a` | El error se mantiene. Al escribir `Ana` desaparece |
| 11 | Código postal inválido | Elegir **Envío** y escribir `53001`, `00123` o `4100A` en el código postal | Error «Cinco cifras y provincia entre 01 y 52». Con `41001` desaparece |
| 12 | Cambio de modalidad | Elegir **Envío**, poner el CP `53001` y enviar. Después cambiar a **Recogida** | El bloque de envío se oculta, su error desaparece y no bloquea el pedido. Al volver a **Envío**, lo escrito sigue ahí |
| 13 | Modalidad y casilla | Rellenar nombre y correo, sin modalidad y sin marcar la casilla, y enviar | Errores «Elige recogida o envío» y «Debes confirmar los datos del pedido». No se confirma |
| 14 | Contador | Escribir `Hola` en observaciones | El contador muestra «4/200» |
| 15 | Pedido correcto | 8 ratones, nombre `Ana Pérez`, correo `ana@ejemplo.es`, **Envío**, `C/ Sol 1`, `41001` y casilla marcada. Enviar | «Pedido nº 1 confirmado». El ratón queda con stock 0, el carrito se vacía, el formulario se limpia (contador 0/200 y bloque de envío oculto) y el pedido sale en el historial con total 90.00 € |
| 16 | Stock comprobado al confirmar | Añadir 1 Disco SSD. En la consola: `catalogo.find(p => p.id === 201).stock = 0`. Rellenar bien y enviar | «Stock insuficiente. Disco SSD 500 GB: pides 1 y quedan 0». No se crea el pedido |
| 17 | Mensaje de estado | Tras confirmar un pedido, escribir en cualquier campo | El mensaje «Pedido nº … confirmado» desaparece |
| 18 | Buscador | Escribir `usb` | Salen «Ratón USB» y «Memoria USB 64 GB» |
| 19 | Filtro del catálogo sin resultados | Escribir `ratón` y elegir la categoría **Oficina** | «No hay productos que coincidan con la búsqueda.» |
| 20 | Detalle del pedido | En el historial, pulsar **Ver detalle** | Se ven las líneas compradas y el subtotal, el descuento y el total |
| 21 | Filtro del historial | Confirmar un pedido de envío (caso 15) y otro de recogida (1 Disco SSD). Filtrar por **Recogida** | Solo sale el de recogida. «Pedidos: 1 · Importe: 45.50 €» |
| 22 | Historial vacío o filtro sin resultados | Al cargar: «Todavía no hay pedidos.» Con solo pedidos de envío, filtrar por **Recogida** | «Ningún pedido cumple el filtro.» y «Pedidos: 0 · Importe: 0.00 €». Nunca aparece NaN |
| 23 | Exportar | Pulsar **Exportar historial** | El `textarea` muestra el JSON de los pedidos (`[]` si no hay ninguno) |
| 24 | Consola | DevTools → Console y recargar | No aparecen errores |

## Uso de la IA

https://claude.ai/share/08236c70-1950-4a35-bcd1-c763803c76e4