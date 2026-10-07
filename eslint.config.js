import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";

// Solo una regla, y con motivo.
//
// Han llegado a producción dos ReferenceError. El primero fue `BloqueFirma`
// en el reporte para la familia: el import se insertó mal y la pantalla salía
// en blanco. El segundo, `parentReports` en la pantalla de inicio de dirección
// clínica — se leían seis stores del estado y ese faltaba, pero se usaba
// treinta líneas más abajo. Claudia e Idaira no podían entrar a la
// aplicación, y el único síntoma era una pantalla vacía.
//
// Ninguna prueba los atrapa: el fichero compila, el empaquetador no protesta,
// y el fallo solo aparece cuando alguien abre esa pantalla concreta. no-undef
// los encuentra los dos en un segundo.
//
// Deliberadamente NO se añade un juego de reglas de estilo. Este proyecto se
// escribió sin linter y meter doscientas advertencias de formato las volvería
// ruido que nadie mira — que es como se pierden las que importan.
export default [
  {
    files: ["src/**/*.{js,jsx}"],
    ignores: ["src/aira-app.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks, react },
    rules: {
      "no-undef": "error",
      // Un hook dentro de un ayudante que se llama al cargar el modulo da
      // "Cannot read properties of null (reading 'useState')" y tumba la
      // aplicacion entera. Paso una vez, con useEsMovil metido en una funcion
      // suelta de RoleEditor.
      "react-hooks/rules-of-hooks": "error",
      // exhaustive-deps queda en aviso: tiene falsos positivos y este codigo
      // se escribio sin el. Como error seria ruido que taparia lo de arriba.
      "react-hooks/exhaustive-deps": "warn",
      // Sin estas dos, no-unused-vars no sabe que JSX usa los componentes y
      // marca como muerto cada import del fichero.
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      // Codigo que se calcula y no se pinta.
      //
      // La barra del paquete de sesiones llevaba desde el principio calculada
      // en la ficha del paciente —pct, barColor, packageNum— y no se dibujaba
      // en ninguna parte. Compila, no molesta, y lo que esconde es que una
      // funcionalidad entera quedo a medias.
      "no-unused-vars": ["error", {
        args: "none",
        varsIgnorePattern: "^_",
        // Lo que se desestructura para dejarlo FUERA del resto es intencional:
        // sinFirma() se lleva asi los rastros de una firma.
        ignoreRestSiblings: true,
      }],
    },
  },
  {
    // Las pruebas usan los globales de Vitest.
    files: ["src/**/*.test.{js,jsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.vitest } },
  },
];
