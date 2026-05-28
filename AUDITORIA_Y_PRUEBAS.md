# Auditoria funcional y bateria de pruebas

## Estado actual

La aplicacion ya tiene una base funcional para:

- Iniciar sesion con Supabase.
- Registrar clientes.
- Registrar multiples mascotas por cliente.
- Guardar catalogos reutilizables: ciudad, estado, pais, especie, raza y color.
- Guardar foto de mascota en un bucket privado de Supabase.
- Registrar visitas por mascota.
- Guardar recibos basicos por visita.
- Buscar clientes por varios campos.

Tambien se cargaron datos de prueba en Supabase:

- 3 clientes de prueba.
- 3 mascotas de prueba.
- 2 visitas de prueba.
- 2 recibos de prueba.

## Hallazgos de auditoria

### Prioridad alta

1. La app ya no debe depender de `localhost` para revision final.

   El servidor local funciona en primer plano, pero el navegador interno de Codex no accede de forma confiable a `localhost`. Para una revision profesional en celular, tablet y computadora conviene publicar la app con una URL HTTPS.

2. Falta una pantalla de expediente mas completa.

   La estructura ya soporta clientes, mascotas y visitas, pero la experiencia ideal debe mostrar un resumen rapido: avisos, ultima visita, edad, proxima vacuna, adeudos o recibos recientes.

3. Fotos: ya se ajustan sin recorte, pero falta recorte asistido.

   Se cambio la vista de foto para que se adapte sin cortar la imagen. Mas adelante conviene permitir recortar/centrar la foto antes de imprimir certificados.

4. Recibos: ya se guardan, falta impresion media carta.

   La captura inicial esta lista, pero falta convertir el recibo a formato imprimible con el diseno real de la clinica.

### Prioridad media

1. Busqueda mejorada, pero falta filtro avanzado.

   Ya busca por cliente, direccion, ciudad, estado, pais, avisos, nombre de mascota, especie, sexo, raza, color y datos de visita. Falta una busqueda avanzada por campos separados.

2. Las visitas necesitan constantes fisiologicas estructuradas.

   Por ahora se capturan como texto libre. Para reportes profesionales conviene separar temperatura, peso, frecuencia cardiaca, frecuencia respiratoria, mucosas, hidratacion y condicion corporal.

3. Catalogos necesitan administracion completa.

   Actualmente crecen al escribir datos nuevos. Falta editar, fusionar duplicados y desactivar valores.

4. Falta control de medicamentos y recetas.

   La base ya tiene tablas para recetas, pero aun falta la interfaz.

### Prioridad baja

1. Falta respaldo/exportacion.
2. Falta bitacora de cambios.
3. Falta impresion de certificado de salud y vacunacion.
4. Falta importacion de datos existentes.

## Bateria de pruebas

### Prueba 1: Acceso

1. Abrir la app.
2. Iniciar sesion con `drmartinezlopez@gmail.com`.
3. Confirmar que aparece el texto `Sincronizado en Supabase`.
4. Cerrar sesion.
5. Confirmar que vuelve la pantalla de inicio de sesion.

Resultado esperado: solo se puede ver la aplicacion despues de iniciar sesion.

### Prueba 2: Datos de prueba

1. Iniciar sesion.
2. Confirmar que aparecen:
   - `Cliente Prueba Ana Torres`.
   - `Cliente Prueba Carlos Mendoza`.
   - `Cliente Prueba Lucia Valdez`.
3. Seleccionar cada cliente.
4. Confirmar que aparece su mascota.

Resultado esperado: cada cliente muestra su mascota y sus avisos cuando existan.

### Prueba 3: Busqueda inteligente

Buscar uno por uno:

- `Ana`
- `Luna`
- `Poodle`
- `Hermosillo`
- `Guaymas`
- `Siames`
- `vomito`
- `vacunacion`
- `nerviosa`

Resultado esperado: la lista debe filtrar por cliente, mascota, raza, ciudad, aviso y datos de visita.

### Prueba 4: Registro de cliente

1. Crear un cliente nuevo.
2. Escribir una ciudad nueva.
3. Guardar.
4. Volver a abrir el campo ciudad.

Resultado esperado: la ciudad nueva debe aparecer como opcion reutilizable.

### Prueba 5: Multiples mascotas

1. Seleccionar un cliente.
2. Registrar dos mascotas con distinta especie, raza, color y sexo.
3. Guardar cada una.
4. Cambiar entre mascotas.

Resultado esperado: el cliente debe mostrar mas de una mascota y cada expediente debe conservar sus datos.

### Prueba 6: Fotos

1. Seleccionar una mascota.
2. Subir una foto horizontal.
3. Guardar.
4. Subir una foto vertical en otra mascota.
5. Guardar.
6. Volver a abrir cada mascota.

Resultado esperado: ambas fotos deben verse completas, sin deformarse ni cortarse.

### Prueba 7: Visitas

1. Seleccionar una mascota.
2. Crear una visita con queja, constantes, sintomas, pronostico y diagnostico.
3. Guardar.
4. Cambiar a otra mascota y regresar.

Resultado esperado: la visita debe quedar asociada solo a la mascota correcta.

### Prueba 8: Recibo

1. Seleccionar una visita.
2. Capturar concepto `Consulta general`.
3. Confirmar que carga precio si ya existe en catalogo.
4. Guardar recibo.
5. Confirmar que aparece en la lista de recibos con total correcto.

Resultado esperado: el recibo debe quedar ligado a la visita seleccionada.

### Prueba 9: Responsive

Revisar la app en:

- Computadora.
- Tablet.
- Celular vertical.
- Celular horizontal.

Resultado esperado: no debe haber texto encimado, botones cortados ni formularios imposibles de usar.

### Prueba 10: Seguridad basica

1. Cerrar sesion.
2. Intentar ver datos.
3. Iniciar sesion con un correo distinto.

Resultado esperado: sin el correo autorizado no se deben mostrar datos.

## Recomendacion para la siguiente etapa

Publicar la app en una URL HTTPS para dejar de depender de `localhost`. Despues de eso, hacer pruebas visuales completas en computadora, tablet y celular.
