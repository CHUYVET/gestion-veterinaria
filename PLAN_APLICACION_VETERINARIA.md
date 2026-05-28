# Aplicacion de Gestion Veterinaria

## Decision inicial

La aplicacion se hara como una app web instalable, pensada para usarse en celular, tablet y computadora. La primera version funciona localmente en el navegador y la version sincronizada podra usar una base de datos en internet.

Objetivos principales:

- Permitir uso local inicial y preparar sincronizacion por internet.
- No requerir registro de app ni servicios de pago.
- Permitir acceso desde varios dispositivos.
- Conservar fotos, documentos y plantillas dentro del proyecto.
- Generar documentos imprimibles en los tamanos que ya se usan en la clinica.

## Sincronizacion

Como ya se acepta depender de internet si es necesario, la opcion recomendada para sincronizar celular, tablet y computadora es Supabase en plan gratuito.

Ventajas:

- Sincronizacion entre dispositivos aunque no esten en la misma red.
- Base de datos Postgres en la nube.
- Almacenamiento para fotos y documentos.
- No requiere publicar la app en tiendas.
- Puede mantenerse gratis mientras el uso este dentro de los limites del plan.

La aplicacion actual guarda datos en IndexedDB para avanzar rapido con la interfaz. Ya se creo un proyecto Supabase llamado `gestion-veterinaria` y la siguiente etapa tecnica sera conectar esta misma interfaz a sus tablas para que todos los dispositivos compartan la misma informacion.

Proyecto Supabase:

- Nombre: `gestion-veterinaria`.
- ID: `qhgejyultejizjrtvtvv`.
- URL: `https://qhgejyultejizjrtvtvv.supabase.co`.
- Seguridad: RLS activado en todas las tablas.
- Usuario permitido por politica RLS: `drmartinezlopez@gmail.com`.
- La app ya incluye pantalla de inicio de sesion y configuracion publica de Supabase.
- Fotos: bucket privado `pet-photos` con permisos solo para el usuario autorizado.
- Recibos: captura inicial por visita con concepto, cantidad, precio unitario y total.

## Formatos de impresion

- Certificado de vacunacion: media carta.
- Recibo de pago: media carta.
- Receta: media carta.
- Certificado de salud: carta.

Las plantillas existentes en la carpeta `Plantillas` se usaran como referencia visual y funcional para disenar los formatos dentro de la aplicacion.

## Modulos

### Clientes

Campos iniciales:

- Fecha de ingreso.
- Nombre completo.
- Direccion.
- Ciudad.
- Estado.
- Pais.
- Aviso.

Ciudad, estado y pais seran catalogos editables. Si se escribe un dato nuevo, se podra guardar para reutilizarlo.

### Mascotas

Campos iniciales:

- Fecha de ingreso.
- Cliente propietario.
- Nombre.
- Especie.
- Sexo.
- Raza.
- Color.
- Fecha de nacimiento.
- Edad calculada.
- Foto.
- Aviso.

Especie sera un catalogo editable. Sexo tendra las opciones Macho, Hembra e Indeterminado. Raza y color seran catalogos separados porque pueden crecer mucho.

### Visitas

Cada mascota podra tener multiples visitas. En cada visita se registrara:

- Fecha y hora.
- Queja del dueno.
- Constantes fisiologicas.
- Sintomas.
- Pronostico.
- Diagnostico.
- Observaciones.

Una visita podra tener varios documentos asociados:

- Recetas.
- Certificados de vacunacion.
- Certificados de salud.
- Recibos de pago.

Esto permite volver a la misma visita y crear otra receta, otro certificado o un recibo adicional sin perder el historial.

### Servicios y productos

La aplicacion tendra un catalogo de servicios, productos y medicamentos con precio. Esto servira para:

- Generar recibos de pago.
- Reutilizar servicios como vacuna rabia, desparasitacion o vacuna quintuple.
- Reutilizar medicamentos en recetas.

## Etapas de construccion

### Etapa 1: Base de datos y pantalla principal

- Crear estructura SQLite.
- Crear pantalla responsive para celular, tablet y computadora.
- Alta, busqueda y edicion de clientes.
- Alta, busqueda y edicion de mascotas.
- Guardar foto de mascota.
- Catalogos editables: ciudad, estado, pais, especie, raza y color.
- Mostrar avisos de cliente y mascota cuando tengan texto.

### Etapa 2: Visitas

- Crear visitas por mascota.
- Registrar queja, constantes, sintomas, pronostico, diagnostico y observaciones.
- Ver historial de visitas.

### Etapa 3: Recetas y recibos

- Catalogo de medicamentos, productos y servicios.
- Crear recetas desde una visita.
- Crear recibos desde una visita.
- Imprimir en media carta.

### Etapa 4: Certificados

- Certificado de vacunacion en media carta.
- Certificado de salud en carta.
- Integrar foto de mascota.
- Ajustar diseno segun las plantillas reales de la clinica.

### Etapa 5: Respaldo y restauracion

- Copia de seguridad de la base de datos.
- Restauracion desde respaldo.
- Carpeta organizada para fotos y documentos generados.

## Dudas pendientes

1. Crear el primer acceso en la app con el correo `drmartinezlopez@gmail.com`.
2. Probar alta de cliente, mascota, foto, visita y recibo contra Supabase.
3. Disenar la impresion de recibo en media carta.
4. Definir si se importaran datos existentes desde AppSheet, Google Sheets u otra fuente.
5. Revisar visualmente las plantillas reales para ajustar los documentos.
6. Definir los campos exactos de constantes fisiologicas.
7. Definir si los medicamentos tendran indicaciones predeterminadas o solo nombre/precio.
8. Definir si los recibos manejaran impuestos, descuentos o solo total simple.
