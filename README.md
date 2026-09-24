# HyFoSy — Video instructivo para pacientes

Video educativo (≈ 5 min, en español) que explica qué es la **HyFoSy** (*hysterosalpingo-foam sonography*, histerosalpingo-sonografía con espuma, pronunciada «hifosi»): el examen ecográfico que evalúa si las trompas de Falopio están permeables. Incluye también una versión abreviada en formato vertical (~55 s) pensada para Instagram.

## Contenido del repositorio

| Archivo | Qué es |
|---|---|
| `video/hyfosy.webm` | Video largo terminado (1280 × 720, 30 fps, subtítulos incrustados). |
| `video/hyfosy.html` | Versión interactiva del video largo (se abre en cualquier navegador): reproducción, pausa, capítulos, subtítulos activables. Es también la **fuente** del video. |
| `video/hyfosy.srt` | Subtítulos del video largo, con tiempos. |
| `video/hyfosy-reel.mp4` / `.webm` | Reel para Instagram (1080 × 1920 vertical, ~55 s, H.264 en el `.mp4`). |
| `video/hyfosy-reel.html` | Fuente del reel (misma lógica que `hyfosy.html`, en formato vertical y con guion condensado). |
| `video/hyfosy-reel.srt` | Subtítulos del reel. |
| `video/assets/dra-karina-castillo.jpg` | Foto usada en la escena de créditos (también incrustada como base64 en ambos HTML). |
| `guion/guion-hyfosy.md` | Guion del video largo: escenas, tiempos, narración y referencias. |
| `guion/guion-hyfosy-reel.md` | Guion del reel. |
| `scripts/render.mjs` | Exporta cualquiera de los dos HTML a video cuadro a cuadro y regenera subtítulos/guion. |

## Estructura del video largo

1. Inicio · 2. ¿Qué es? · 3. Anatomía (trompas, fecundación, obstrucción) · 4. Indicaciones · 5. ¿Cuándo se realiza? (días 6–12 del ciclo, contraindicaciones) · 6. Preparación · 7. Paso 1: ecografía inicial · 8. Paso 2: catéter · 9. Paso 3: paso de la espuma · 10. Lo que se ve en la pantalla · 11. Resultados posibles · 12. HyFoSy frente a HSG (ensayo FOAM) · 13. Después del examen · 14. Resumen · 15. Créditos.

## Estructura del reel

1. Hook (¿sabe qué es la HyFoSy?) · 2. Qué es (ecografía + espuma = se ven las trompas) · 3. Cómo se hace (catéter + espuma) · 4. Ventajas frente a la HSG · 5. Resultados posibles · 6. Créditos + llamado a consultar y a guardar el video.

## Cómo modificarlo

Todo el contenido está en el arreglo `SCENES` de `video/hyfosy.html` (o `video/hyfosy-reel.html` para el reel). Cada escena tiene:

- `lines`: las frases de narración (se muestran como subtítulos; su duración se calcula según el número de palabras),
- `visual`: la descripción que aparece en el guion,
- `draw(t, d, L)`: la animación, sincronizada con el inicio de cada frase (`L[i]`).

Después de editar, regenere los archivos:

```bash
# Video largo (1280×720)
node scripts/render.mjs
node scripts/render.mjs --text-only     # solo subtítulos y guion
node scripts/render.mjs --stills out    # una imagen por escena, para revisar rápido

# Reel vertical (1080×1920) — usa --page/--width/--height/--guion para apuntar al otro HTML
node scripts/render.mjs --page video/hyfosy-reel.html --width 1080 --height 1920 \
  --out video/hyfosy-reel.webm --guion guion/guion-hyfosy-reel.md \
  --guion-title "Guion — Reel HyFoSy (Instagram)" --bitrate 2500k
```

Requiere Node 18+ y Playwright con Chromium (`npm i -g playwright && npx playwright install chromium`). El codificador usa el ffmpeg que trae Playwright (VP8/WebM); con otro ffmpeg se puede indicar su ruta en la variable `FFMPEG`.

### Convertir a MP4 (necesario para Instagram)

Instagram no acepta `.webm`. El ffmpeg que trae Playwright no incluye el codificador H.264, así que hace falta un ffmpeg completo (`apt-get install ffmpeg` en Debian/Ubuntu, o `brew install ffmpeg` en macOS):

```bash
ffmpeg -i video/hyfosy-reel.webm -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart -an video/hyfosy-reel.mp4
```

### Agregar voz en off

El video no tiene audio. Para narrarlo, grabe la locución siguiendo `video/hyfosy.srt` (o el guion) y luego combínela:

```bash
ffmpeg -i video/hyfosy.webm -i narracion.m4a -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest video/hyfosy-con-voz.mp4
```

## Antes de difundirlo

Es material educativo que no reemplaza la indicación médica. Antes de usarlo con pacientes, conviene que el equipo tratante valide los datos que dependen de cada centro: la ventana del ciclo, la analgesia previa, el tamizaje de infecciones o la profilaxis antibiótica, y la duración habitual del examen.

**Referencia principal:** van Welie N, van Rijswijk J, Dreyer K, et al. *Can hysterosalpingo-foam sonography replace hysterosalpingography as first-choice tubal patency test? A randomized non-inferiority trial.* Hum Reprod. 2022;37(5):969-79. [doi:10.1093/humrep/deac034](https://doi.org/10.1093/humrep/deac034)
