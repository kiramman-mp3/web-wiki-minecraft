# Auditoría y mejoras de WikiCraft

Fecha: 2026-11-12 · Rama de trabajo: `develop` (14 commits sobre `d523c1c`, ninguno en `main`, nada enviado a `origin`).

## 1. Resumen ejecutivo

WikiCraft es un sitio **estático** (HTML + JavaScript ES modules + Bootstrap) publicado en GitHub Pages. No tiene backend, base de datos, autenticación, TypeScript ni roles, así que esas partes de la auditoría **no aplican**.

Hallazgos principales:

- **Vulnerabilidad XSS** (crítica): las tarjetas de Reddit se armaban con `innerHTML` usando título, descripción y URLs controlados por terceros. Corregido.
- **Noticias y Comunidad rotas** (alta): `corsproxy.io` responde ahora `403 keyless_legacy_url` y Reddit bloquea CORS directo. Las secciones quedaban vacías sin avisar. **Sigue pendiente la causa raíz** (ver sección 15); la interfaz ahora muestra un error con botón Reintentar.
- Fondo de 2.1 MB fijo en todas las páginas, texto justificado con huecos, 13 imágenes sin `alt`, logo sin nombre accesible, iframe de terceros sin `title` ni `sandbox`, Markdown suelto (`**`) visible en Alquimia, secciones anidadas en Bloques.
- Se reemplazó la apariencia por un **sistema de diseño Minecraft** propio (tokens, paneles estilo inventario, botones de bloque, barra de XP, césped y tierra), sin usar assets de Mojang.

Estado: sitio funcional y consistente en las 7 páginas; **una dependencia externa (proxy de Reddit) requiere decisión tuya** antes de considerarlo listo para producción.

## 2. Arquitectura encontrada

```
index.html / views/*.html      Páginas estáticas (7 rutas)
main.js                        Punto de entrada de módulos
controllers/                   NewsController (carga + estados), UIController (botón subir)
models/                        NewsModel (fetch a Reddit vía proxy), safeUrl (validador https)
views/NewsView.js              Render de tarjetas/estados con DOM seguro
views/comunityview.js          Arranque de la página Comunidad
css/styles.css                 Sistema de diseño
assets/dist/                   Bootstrap 5.3.5 local
```

Patrón MVC ligero en el cliente. Antes de los cambios había además tres módulos muertos (`BlocksController`, `MobsController` con `req/res` de Express, y `Comunity.js` duplicado de la vista).

## 3. Tecnologías

HTML5, CSS3, JavaScript ES modules, Bootstrap 5.3.5 (ahora cargado desde `assets/dist/`, antes desde CDN con 5.3.3), fuente pixelada local `css/minecraft_fot_esp.ttf`, GitHub Pages. Node 26 solo para las pruebas.

## 4. Inventario de pantallas

| Ruta | Descripción |
|---|---|
| `index.html` | Inicio: hero, 5 accesos, noticias de Reddit |
| `views/bloques.html` | Bloques del Overworld y del End |
| `views/mobs.html` | Hostiles, neutrales, Nether |
| `views/crafteos.html` | Recetas con imágenes |
| `views/alquimia.html` | Fundamentos, tablas de efectos y modificadores |
| `views/comunidad.html` | Publicaciones de Reddit |
| `views/jugar.html` | Eaglercraft embebido + controles |

Componentes transversales revisados: navbar y menú móvil, botón volver arriba, estados de carga/vacío/error, tablas, iframe. No existen formularios, modales, paginación, filtros ni búsqueda.

## 5. Auditoría y mejoras por pantalla

| Pantalla | Problemas encontrados | Mejoras realizadas | Validación |
|---|---|---|---|
| Inicio | Noticias vacías sin aviso (proxy 403); fondo 2.1 MB fijo; texto justificado; contenido oculto si falla JS (`.reveal`); logo sin nombre accesible | Estados carga/error con reintento; hero con `hero-bg.webp` (97 KB); animación `reveal` solo CSS; `aria-label` en logo; `noscript` | Navegador, 1280 px y 5 anchos en iframe. Tarjetas probadas con datos de prueba inyectados, **no con Reddit real** |
| Bloques | `<section>` anidada, sin `<main>`, saltos h2→h4→h5, clase `text-gold` inexistente, títulos de 1 y 2 líneas desalineaban iconos | Estructura corregida, jerarquía h2→h3→h4, alineación de iconos, filas incompletas centradas | Navegador; 14 imágenes cargan (3 falsos "rotos" eran `lazy`) |
| Mobs | h5 bajo h2; PNG con márgenes vacíos (Spider diminuto); Ghast con dos mobs en un PNG; `text-danger` a 2.87:1 sobre la tarjeta original | PNG recortados a su contenido; Ghast solo el primero; colores semánticos retocados (4.85:1) | Navegador; 9 imágenes OK |
| Crafteos | `<br>` sueltos como separadores; h4 tras h2; esquinas redondeadas ajenas al estilo | Limpieza; `--bs-border-radius: 0` | Navegador; 7 imágenes OK |
| Alquimia | `**` de Markdown visibles (3); 13 imágenes sin `alt`; `</main>` y `</li>` huérfanos; estilo en línea | `<strong>`; `alt` por ingrediente; HTML válido; `scope="col"` en tablas | Navegador; verificador estático; 17 imágenes OK |
| Comunidad | 0 tarjetas (proxy 403); XSS por `innerHTML`; `<link rel="icon">` duplicado; título "r/minecraftespanol" aunque hubiera respaldo en r/minecraft | DOM seguro; estado de error con reintento; encabezado genérico | Estado de error comprobado en el navegador; tarjetas **solo con datos de prueba** |
| Jugar | Iframe sin `title`, sin `sandbox`, sin `loading`; hoja de estilos duplicada; estilos en línea; saltos de encabezado | `title`, `sandbox`, `referrerpolicy`, `loading="lazy"`; encabezados h2 | Eaglercraft carga y el botón Play avanza bajo `sandbox` y CSP. **No se probó jugar una partida**, solo que cargue y arranque |

## 6. Problemas detectados y severidad

| Sev. | Problema | Estado |
|---|---|---|
| CRÍTICO | XSS: `innerHTML` con título, descripción, imagen y URL de Reddit | Corregido |
| ALTO | Proxy `corsproxy.io` devuelve 403; Noticias y Comunidad no muestran nada | **Pendiente (decisión tuya)**; error visible y reintento hechos |
| ALTO | Iframe de terceros sin `sandbox`; sin CSP | Corregido (`sandbox` + CSP) |
| ALTO | Logo de navegación sin nombre accesible | Corregido |
| ALTO | `bg-minecraft.png` 2.1 MB fijo en todas las páginas | Corregido |
| MEDIO | Bootstrap por CDN sin SRI y con versión distinta de la local | Corregido (local) |
| MEDIO | Texto justificado; contraste de `text-danger` (2.87:1); hover del botón verde a 4.0:1 | Corregido |
| MEDIO | HTML inválido (secciones anidadas, etiquetas huérfanas, `**`), 13 `alt` ausentes, saltos de encabezado | Corregido |
| MEDIO | Sin tests, linter ni verificación de enlaces | Parcial: tests y verificador añadidos; **sin linter** |
| MEDIO | Código muerto con `req/res` de Express | Eliminado |
| BAJO | `favicon.png` 2048×2048 (176 KB); `type="image/x-icon"` incorrecto | Corregido |
| BAJO | Archivos del ejemplo "blog" de Bootstrap sin referencias | Eliminados |
| BAJO | `minecraft_fot_esp.ttf` con typo en el nombre | No tocado |

## 7. Mejoras implementadas

Commits (todos en `develop`, sin trailer de coautoría según `CLAUDE.md`):

- `refactor:` eliminar controladores muertos · `fix:` XSS y estados de carga/error
- `feat:` texturas pixeladas propias y fondo hero · `perf:` favicon y PNG de mobs
- `feat:` sistema de diseño Minecraft · `fix:` estructura HTML, accesibilidad y CSP · `fix:` contraste y menú móvil
- `chore:` eliminar archivos sin referencias · `refactor:` validador de URLs compartido · `test:` pruebas y verificador
- `fix:`/`style:` placeholder de noticias, títulos legibles, foco visible, filas centradas

## 8. Cambios visuales

Fondo de piedra pixelada, barra superior de tablones oscuros, hero con borde de césped, pie de tierra y césped, tablas e inventarios con bisel. Texto largo en fuente del sistema; fuente pixelada solo en títulos y botones. Se quitó la animación flotante del título y el texto justificado.

## 9. Design System Minecraft

Definido en `css/styles.css` (tokens en `:root`):

- **Color:** césped `#3f7a1f`, piedra `#141416…#9b9ba1`, tierra `#6e4c30`, madera `#422c18`, XP `#7ee02a`, agua `#4a86e8`, arena `#dbcf9c`.
- **Tipografía:** `Minecraft` (títulos, botones) + `system-ui` (lectura).
- **Componentes:** `.mc-panel` (ventana de inventario), `.card` / `.news-card` (slot hundido), `.btn-minecraft` (+ `--stone`, `--lg`), `.mc-badge` (tooltip de objeto), `.mc-tip`, `.mc-status`, `.mc-xp-bar` (loader), progreso de scroll como barra de XP, tablas, pie de césped.
- Texturas propias de 16×16 generadas por script (`images/textures/`).

## 10. Responsive

Se midió cada página en iframes de **375, 430, 768, 1366 y 1920 px**: **0 desbordes horizontales** y 0 textos < 12 px. Menú móvil con fondo sólido, tablas con scroll contenido, tipografía fluida con `clamp()`. Limitación: es emulación por iframe, no un dispositivo real.

## 11. Accesibilidad

Enlace "Saltar al contenido", `<main>`, `aria-current`, `aria-label` en logo y toggler, `aria-live`/`aria-busy` en feeds, `alt` en todas las imágenes, `title` en iframe, `scope="col"`, anillo de foco dorado probado con teclado, `prefers-reduced-motion`. Contrastes calculados con la fórmula WCAG 2.x: todos los pares ≥ AA (mínimo 4.85:1 en texto semántico). No se ejecutó un lector de pantalla ni un auditor automático (axe/Lighthouse).

## 12. Rendimiento

| Recurso | Antes | Después |
|---|---|---|
| Fondo global | `bg-minecraft.png` 2 132 014 B, fijo en todas las páginas | `hero-bg.webp` 97 554 B, solo en el hero |
| Favicon | 175 879 B | 11 595 B |
| Imágenes `<img>` | carga inmediata | `loading="lazy"` + `decoding="async"` |
| Bootstrap | CDN | local (`assets/dist/`) |

No se midió Lighthouse ni tiempos de carga.

## 13. Seguridad

XSS eliminado (DOM con `textContent`, solo URLs `https:`, `rel="noopener noreferrer"`), CSP por `<meta>` (`script-src 'self'`, sin estilos en línea), `sandbox` en el iframe, timeout de 8 s y validación de la respuesta. Limitación: una CSP por `<meta>` no admite `frame-ancestors` ni cabeceras; GitHub Pages no permite configurarlas.

## 14. Resultados de pruebas

| Comprobación | Antes | Después |
|---|---|---|
| `npm test` (node:test) | no existía | 9 / 9 pasan |
| `npm run check` (enlaces, alt, ids, CSP, nav, estructura) | no existía; contra el `main` original **falla** (CSP, `<main>`, 13 alt, `**`, etc.) | 7 / 7 páginas pasan |
| Linter | no existe | no ejecutado (no hay configuración) |
| Build | no hay paso de build | N/A |
| Tests E2E | no existen | no añadidos |
| Consola del navegador | — | solo el 403 conocido del proxy |

## 15. Problemas pendientes

1. **Proxy de Reddit.** Hay que elegir: API key de CORSPROXY (no se guarda en el repo), un proxy propio (p. ej. función serverless) o prescindir de la sección. Se cambia en `REDDIT_PROXY` de `models/NewsModel.js`. Un intento de probar proxies alternativos desde el navegador fue bloqueado y no se repitió.
2. **38 MB de imágenes sin referencias** (44 archivos de 105), por ejemplo `images/comunidad/Acropolis.png` (7.6 MB). `images/bg-minecraft.png` quedó sin uso tras el cambio. No se borraron sin tu autorización.
3. **Iframe de terceros** (`minecraftforfreex.com`): disponibilidad y licencia fuera de tu control.
4. Capturas de estados hover/active no registradas una a una; se revisaron en el CSS y el foco en el navegador.
5. `CLAUDE.md` menciona `docs/ROADMAP.md`, que no existe; está sin versionar en el repo.

## 16. Recomendaciones futuras

Añadir ESLint/Prettier, un E2E con Playwright, Lighthouse en CI, comprimir o retirar las imágenes grandes, plantillas para no repetir el `<nav>` en 7 archivos, un `LICENSE` (el README enlaza MIT sin archivo), y `og:` / `sitemap.xml` para SEO.

## 17. Preparación para producción

**Casi listo.** Estructura, accesibilidad, seguridad del cliente y responsive están cubiertos y verificados con las pruebas descritas. Bloquea la publicación completa el punto 1 de pendientes: sin proxy funcional, Noticias y Comunidad solo muestran el estado de error.
