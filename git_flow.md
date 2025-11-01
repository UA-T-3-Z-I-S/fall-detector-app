# Convenciones de Nomenclatura en Comandos Git

En este documento se definen las reglas que seguimos para nombrar **commits** y **ramas** en el proyecto, basadas en el flujo de trabajo **Gitflow.**
El objetivo es mantener un historial claro, coherente y fácil de seguir.

---

## Estructura de Ramas

### 🔹 Ramas Principales

- **`main`** 🏁 → Contiene la versión en **producción**. 
- **`testing`** 🧪 → Versión en **pruebas** antes de pasar a producción.

### 🔹 Ramas Temporales (derivadas de **`main`** o **`testing`**)

| 🌱 Tipo de rama               | 🏷️ Prefijo  | 📌 Uso                                                                                                 |
| ----------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| **🚀 Funcionalidad**    | `feature/`  | Desarrollo de nuevas funciones ✨                                                                      |
| **🐞 Corrección**      | `fix/`      | Solución de errores en producción o pruebas 🔧                                                       |
| **🚨 Hotfix**           | `hotfix/`   | Correcciones urgentes en producción 🩹                                                                |
| **📦 Lanzamiento**      | `release/`  | Preparación para pasar de `testing` a `main` 📤                                                   |
| **🔄 Refactorización** | `refactor/` | Mejora de código sin cambiar la funcionalidad ♻️                                                    |
| **🛠 Tareas Varias**    | `chore/`    | Mantenimiento , configuración, dependencias o tareas menores ⚙️                                     |
| **📚 Documentación**   | `docs/`     | Cambios solo en documentación 📝                                                                      |
| **🎨 Estilo**           | `style/`    | Cambios de formato o estilo que no afectan la lógica del código (espacios, indentación, formato) 🎯 |
| **🤖 CI/CD**            | `ci/`       | Cambios en pipelines o despliegues 🏗️                                                                |

---

## Formato de Nombre de Ramas

```text
<prefijo>/sNN-#ISSUE-<descripcion-corta>
```

### Significado:

- `prefijo` → Tipo de rama (ej. `feat`, `fix`, `hotfix`, etc.)
- `sNN` → Sprint con 2 dígitos (ej. `s07`) ⏳
- `#ISSUE` → Número de issue (ej. `#71`) 🗂
- `descripcion-corta` → Breve descripción en *kebab-case* (ej. `agrega-pasarela-pago`)

### Ejemplos:

```text
feat/s03-#145-auth-jwt
hotfix/s08-#301-null-pointer-login
```

---

## Formato para Mensajes de los Commits

```text
<tipo>(<scope>): <resumen> [sNN][#ISSUE]
```

### Significado:

- **tipo**: feat | fix | refactor | chore | docs | test | ci | perf | style
- **scope**: módulo/área (opcional). Ej: api, auth, etc
- **resumen**: En imperativo con un máximo de 72 caracteres aprox
- **[sNN]**: sprint. Ej: [s07]
- **[#ISSUE]**: issue .Ej: [#145]

### Ejemplos:

```text
feat(auth): agrega refresh token [s08][#85]
fix(rifas): corrige boletos duplicados [s07][#75]
```

---

## Formato para Pull Requests (PR)

### Título:

```text
[sNN][#ISSUE] <tipo>(<scope>): <resumen>
```

### Ejemplos:

```text
- [s08][#85] feat(auth): agrega refresh token
- [s07][#75] fix(rifas): corrige boletos duplicados
```

### Cuerpo del PR:

- **Objetivo:** Breve explicación del problema que se resuelve.
- **Cambios clave:** Lista con los cambios realizados.
- **Cómo probar:** Pasos para verificar que funciona.
- **Impacto/Riesgos:** Indicar si hay cambios importantes o breaking changes.

---

## Resumen rápido (Cheat Sheet)

### Rama nueva:

```bash
git checkout -b feature/s07-#145-auth-jwt
```

### Commit:

```bash
git commit -m "feat(auth): agrega refresh token [s07][#145]"
```

### Pull Request:

```bash
Título: [s07][#145] feat(auth): agrega refresh token
Cuerpo:

Objetivo
Implementar un sistema de refresh token ...

Cambios clave
- Creación del endpoint...
- Implementación de almacenamiento seguro...
- Actualización de lógica en...

Cómo probar
1. Iniciar sesión...
2. Usar el refresh token en el endpoint...
3. Verificar que el nuevo token sea válido...

Impacto / Riesgos
- Cambios en el flujo de autenticación.
- Posibles conflictos si...

```
