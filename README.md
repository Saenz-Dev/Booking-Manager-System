# ¿Como colaborar en este proyecto?
Usando Fork (más usado en proyectos grandes)
Haces un Fork (copia del repo a tu cuenta).
Trabajas en tu copia.
Envías un Pull Request para proponer cambios.
🔹 2. Flujo de trabajo básico (el más importante)
1. Clonar el repositorio
git clone https://github.com/usuario/repositorio.git
2. Crear una rama (MUY IMPORTANTE 🚨)

Nunca trabajes directo en main.

git checkout -b mi-rama

Ejemplo:

git checkout -b feature-login
3. Hacer cambios y guardarlos
git add .
git commit -m "Agrega funcionalidad de login"
4. Subir cambios
git push origin mi-rama
5. Crear Pull Request
Vas al repositorio en GitHub
Click en Compare & pull request
Explicas los cambios
6. Revisión y merge

Otro miembro revisa y aprueba:

Puede comentar
Puede pedir cambios
Finalmente se hace merge a main
🔹 3. Buenas prácticas (esto te salva en equipo 💯)
✔️ Siempre usa ramas
main → estable
develop → desarrollo
feature/... → nuevas funcionalidades
✔️ Actualiza antes de trabajar
git pull origin main
✔️ Commits claros

❌ "arreglos"
✅ "Corrige validación de contraseña"

✔️ Evita conflictos
No trabajen en el mismo archivo al tiempo
Comuníquense (muy importante)
🔹 4. Problemas comunes
⚠️ Conflictos de merge

Pasan cuando dos personas modifican lo mismo.

Git te pedirá elegir qué versión dejar.

⚠️ Olvidar hacer pull

Puedes sobrescribir cambios de otros

# BookingManagerSystem
This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
# Booking-Manager-System
