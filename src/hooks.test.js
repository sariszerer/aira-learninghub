import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Ningún hook fuera de un componente.
//
// Un script mecánico insertó `useEsMovil()` en la primera función de cada
// archivo, y en uno de ellos esa función no era el componente sino un ayudante
// — llamado en el propio módulo, al importarlo. Resultado: React todavía no
// existe, `useState` es null, y la aplicación ENTERA no arranca:
//
//   Uncaught TypeError: Cannot read properties of null (reading 'useState')
//
// Ni el build ni las pruebas lo vieron. Compila perfecto: llamar a una función
// es sintaxis válida, y ninguna prueba importaba ese módulo. Solo se ve
// abriendo la aplicación, y para entonces está caída del todo.
//
// La regla de React es que un hook solo se llama desde un componente (nombre
// en mayúscula) o desde otro hook (nombre que empieza por `use`). Esto lo
// comprueba.

const HOOKS = /\b(use[A-Z]\w*)\s*\(/;

function fuentes(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) fuentes(p, acc);
    else if (/\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name) && e.name !== 'aira-app.js') {
      acc.push(p);
    }
  }
  return acc;
}

// Recorre el archivo llevando la cuenta de en qué función estamos y a qué
// profundidad de llaves, para saber si una línea con un hook cae dentro de un
// componente o de un ayudante suelto.
function hooksFueraDeComponente(src) {
  const lineas = src.split('\n');
  const malos = [];
  const pila = [];   // { nombre, prof }
  let prof = 0;

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const sinTexto = linea.replace(/\/\/.*$/, '');

    // ¿abre una función con nombre?
    const decl = sinTexto.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>)/);

    const hook = sinTexto.match(HOOKS);
    if (hook) {
      const actual = pila[pila.length - 1]?.nombre;
      const valido = actual && (/^[A-Z]/.test(actual) || /^use[A-Z]/.test(actual));
      // Una línea que DECLARA el hook (export function useX) no es una llamada.
      const esDeclaracion = /^\s*(export\s+)?(function|const)\s+use[A-Z]/.test(sinTexto);
      if (!valido && !esDeclaracion) {
        malos.push(`línea ${i + 1}: ${hook[1]}() dentro de ${actual || '(nivel de módulo)'} — ${linea.trim()}`);
      }
    }

    if (decl) pila.push({ nombre: decl[1] || decl[2], prof });

    prof += (sinTexto.match(/\{/g) || []).length;
    prof -= (sinTexto.match(/\}/g) || []).length;
    while (pila.length && prof <= pila[pila.length - 1].prof) pila.pop();
  }
  return malos;
}

describe('hooks de React', () => {
  const archivos = fuentes('src');

  it('encuentra archivos que revisar', () => {
    expect(archivos.length).toBeGreaterThan(20);
  });

  it('ninguno se llama fuera de un componente o de otro hook', () => {
    const fallos = [];
    for (const archivo of archivos) {
      const src = fs.readFileSync(archivo, 'utf8');
      if (!HOOKS.test(src)) continue;
      for (const m of hooksFueraDeComponente(src)) {
        fallos.push(`${archivo.split(path.sep).join('/')} · ${m}`);
      }
    }
    expect(fallos).toEqual([]);
  });
});
