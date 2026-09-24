# HyFoSy — Video instructivo para pacientes

Video educativo (≈ 4:50 min, en español) que explica qué es la **HyFoSy** (*hysterosalpingo-foam sonography*, histerosalpingo-sonografía con espuma, pronunciada «hifosi»): el examen ecográfico que evalúa si las trompas de Falopio están permeables.

## Contenido del repositorio

| Archivo | Qué es |
|---|---|
| `video/hyfosy.webm` | El video terminado (1280 × 720, 30 fps, subtítulos incrustados). |
| `video/hyfosy.srt` | Subtítulos con tiempos: sirven para YouTube u otras plataformas y como pauta para grabar la voz en off. |
| `video/hyfosy.html` | Versión interactiva del video (se abre en cualquier navegador): reproducción, pausa, capítulos, subtítulos activables. Es también la **fuente** del video. |
| `guion/guion-hyfosy.md` | Guion completo: escenas, tiempos, descripción visual, narración, notas de producción y referencias. |
| `scripts/render.mjs` | Exporta el HTML a video cuadro a cuadro y regenera el `.srt` y el guion. |

## Estructura del video

1. Inicio · 2. ¿Qué es? · 3. Anatomía (trompas, fecundación, obstrucción) · 4. Indicaciones · 5. ¿Cuándo se realiza? (días 6–12 del ciclo, contraindicaciones) · 6. Preparación · 7. Paso 1: ecografía inicial · 8. Paso 2: catéter · 9. Paso 3: paso de la espuma · 10. Lo que se ve en la pantalla · 11. Resultados posibles · 12. HyFoSy frente a HSG (ensayo FOAM) · 13. Después del examen · 14. Resumen.

## Cómo modificarlo

Todo el contenido está en el arreglo `SCENES` de `video/hyfosy.html`. Cada escena tiene:

- `lines`: las frases de narración (se muestran como subtítulos; su duración se calcula según el número de palabras),
- `visual`: la descripción que aparece en el guion,
- `draw(t, d, L)`: la animación, sincronizada con el inicio de cada frase (`L[i]`).

Después de editar, regenere los archivos:

```bash
node scripts/render.mjs              # video + subtítulos + guion
node scripts/render.mjs --text-only  # solo subtítulos y guion
node scripts/render.mjs --stills out # una imagen por escena, para revisar rápido
```

Requiere Node 18+ y Playwright con Chromium (`npm i -g playwright && npx playwright install chromium`). El codificador usa el ffmpeg que trae Playwright (VP8/WebM); con otro ffmpeg se puede indicar su ruta en la variable `FFMPEG`. Para obtener un MP4:

```bash
ffmpeg -i video/hyfosy.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart video/hyfosy.mp4
```

### Agregar voz en off

El video no tiene audio. Para narrarlo, grabe la locución siguiendo `video/hyfosy.srt` (o el guion) y luego combínela:

```bash
ffmpeg -i video/hyfosy.webm -i narracion.m4a -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest video/hyfosy-con-voz.mp4
```

## Antes de difundirlo

Es material educativo que no reemplaza la indicación médica. Antes de usarlo con pacientes, conviene que el equipo tratante valide los datos que dependen de cada centro: la ventana del ciclo, la analgesia previa, el tamizaje de infecciones o la profilaxis antibiótica, y la duración habitual del examen.

**Referencia principal:** van Welie N, van Rijswijk J, Dreyer K, et al. *Can hysterosalpingo-foam sonography replace hysterosalpingography as first-choice tubal patency test? A randomized non-inferiority trial.* Hum Reprod. 2022;37(5):969-79. [doi:10.1093/humrep/deac034](https://doi.org/10.1093/humrep/deac034)
