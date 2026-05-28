# Despliegue en Vercel

La app esta preparada como sitio estatico. Vercel debe ejecutar:

```text
npm run build
```

Y publicar:

```text
dist
```

## Opcion recomendada: GitHub + Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. Entra a Vercel.
3. Selecciona **Add New > Project**.
4. Importa el repositorio.
5. Configura:
   - Framework Preset: `Other`.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
6. Deploy.

## Opcion manual

Si no se usara GitHub:

1. En Vercel, crear un proyecto nuevo.
2. Subir los archivos del proyecto.
3. Confirmar que Vercel detecte `package.json` y `vercel.json`.
4. Deploy.

## Despues del despliegue

La app debe abrir en una URL parecida a:

```text
https://gestion-veterinaria.vercel.app
```

Con esa URL ya no se usa `localhost`.

## Datos importantes

- La base de datos sigue en Supabase.
- La app usa la clave publica de Supabase, protegida por RLS.
- Solo el usuario autorizado por RLS debe poder ver y modificar datos.
- Si se cambia el dominio final, no deberia requerir cambios en Supabase para correo/contrasena normal.
