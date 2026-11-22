const catalogo = [
  new Producto(101, "Ratón USB", "perifericos", 12.5, 8),
  new Producto(102, "Teclado", "perifericos", 24.9, 0),
  new Producto(103, "Monitor 24 pulgadas", "perifericos", 119.9, 3),
  new Producto(201, "Disco SSD 500 GB", "almacenamiento", 45.5, 5),
  new Producto(202, "Memoria USB 64 GB", "almacenamiento", 9.95, 10),
  new Producto(301, "Paquete de folios A4", "oficina", 4.75, 20)
];

const carrito = [];   // { productoId, cantidad }
const pedidos = [];

// Valores admitidos en los select (no nos fiamos del valor que llegue)
const CATEGORIAS_VALIDAS = ["todas", "perifericos", "almacenamiento", "oficina"];
const MODALIDADES_FILTRO = ["todos", "recogida", "envio"];

// Texto que se muestra para cada valor interno
const NOMBRES_CATEGORIA = {
  perifericos: "Periféricos",
  almacenamiento: "Almacenamiento",
  oficina: "Oficina"
};
const NOMBRES_MODALIDAD = {
  recogida: "Recogida",
  envio: "Envío"
};
