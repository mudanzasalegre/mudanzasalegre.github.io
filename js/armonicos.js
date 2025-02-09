/***********************************************
 * ARMONICOS.JS
 * Sección de Armónicos para Trompa en Si♭
 * con Modo de Progresión (semifonía arriba/abajo)
 ***********************************************/

// =====================================================
// 1. Datos y Configuración
// =====================================================

// a) Combinaciones de válvulas -> frecuencia fundamental aproximada
//    Ajusta estos valores según tu PDF o referencia real de la trompa.
const combosValvulas = {
  "0": 116.54,    // approx. fundamental (Bb2)
  "1": 110.00,    // ej. 
  "2": 103.83,    // ej.
  "3": 98.00,     // ej.
  "1-2": 92.50,
  "2-3": 87.31,
  "1-3": 82.41,
  "1-2-3": 77.78
};

// b) Niveles de dificultad -> cuántos armónicos (primeros n armónicos)
const nivelesArmonicos = {
  "facil": 4,
  "medio": 6,
  "dificil": 8
};

// c) Bandera global para evitar solapamiento de reproducción
let armonicosEnProgreso = false;
let armonicosTimeouts = []; // Para almacenar los setTimeout activos y poder detenerlos

// =====================================================
// 2. Funciones Auxiliares de Audio
// =====================================================

const audioCtxArmonicos = new (window.AudioContext || window.webkitAudioContext)();

function reproducirNotaArmonicos(frecuencia, duracion = 1) {
  const oscillator = audioCtxArmonicos.createOscillator();
  const gainNode = audioCtxArmonicos.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frecuencia;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtxArmonicos.destination);
  
  const now = audioCtxArmonicos.currentTime;
  const fadeTime = 0.01;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1, now + fadeTime);
  gainNode.gain.setValueAtTime(1, now + duracion - fadeTime);
  gainNode.gain.linearRampToValueAtTime(0, now + duracion);
  
  oscillator.start(now);
  oscillator.stop(now + duracion);
}

// Dado un fundamental y un número n de armónicos, devuelve un array de frecuencias
function generarSerieArmonica(fundamental, numArm) {
  const serie = [];
  for (let i = 1; i <= numArm; i++) {
    serie.push(fundamental * i);
  }
  return serie;
}

// =====================================================
// 3. Conversión de Frecuencias a Notas/Octavas para Render
// =====================================================

function freqToNoteArmonicos(freq) {
  // Aproximación basada en C4 = 261.63
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const semitones = Math.round(12 * Math.log2(freq / 261.63));
  const octave = 4 + Math.floor(semitones / 12);
  const index = ((semitones % 12) + 12) % 12;
  return noteNames[index] + "/" + octave;
}

// Genera claves a partir de un array de frecuencias
function generarClavesSerie(serieFreq) {
  return serieFreq.map(freqToNoteArmonicos);
}

// =====================================================
// 4. Renderizado en Pentagrama con VexFlow
// =====================================================

// Transforma tonalidades no válidas a sus equivalentes (para la armadura)
function fixKeySignature(key) {
  const mapping = {
    "D#": "Eb",
    "G#": "Ab",
    "A#": "Bb",
    "Fb": "E",
    "Cb": "B",
    "E#": "F"
  };
  return mapping[key] || key;
}

/**
 * Renderiza un array de frecuencias en el div#staffArmonicos
 * Se asume la primera nota define la armadura
 */
function renderArmonicos(serieFreq) {
  const claves = generarClavesSerie(serieFreq);
  // La armadura se fija según la primera nota, corrigiendo
  let primerKey = claves[0].split("/")[0];
  primerKey = fixKeySignature(primerKey);
  
  // Iniciamos VexFlow
  const VF = Vex.Flow;
  const container = document.getElementById("staffArmonicos");
  if (!container) return;
  container.innerHTML = "";
  
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize(600, 200);
  const context = renderer.getContext();
  context.setFont("Arial", 10, "").setBackgroundFillStyle("#fff");
  
  // Pentagrama en clave de sol con armadura
  const stave = new VF.Stave(10, 40, 580);
  stave.addClef("treble").addKeySignature(primerKey).setContext(context).draw();
  
  // Creación de notas
  const vfNotes = claves.map(key => {
    const note = new VF.StaveNote({ keys: [key], duration: "q" });
    if (key.includes("#")) {
      note.addModifier(new VF.Accidental("#"), 0);
    } else if (key.includes("b")) {
      note.addModifier(new VF.Accidental("b"), 0);
    }
    return note;
  });
  
  const voice = new VF.Voice({ num_beats: vfNotes.length, beat_value: 4 });
  voice.addTickables(vfNotes);
  new VF.Formatter().joinVoices([voice]).format([voice], 520);
  voice.draw(context, stave);
}

// =====================================================
// 5. Reproducción de la Serie y Manejo de Timeouts
// =====================================================

function detenerReproduccionArmonicos() {
  armonicosTimeouts.forEach(t => clearTimeout(t));
  armonicosTimeouts = [];
  armonicosEnProgreso = false;
}

// Dado un array de frecuencias, reproduce en secuencia
function reproducirSerieArmonicos(serieFreq) {
  detenerReproduccionArmonicos();
  armonicosEnProgreso = true;
  let tiempoAcumulado = 0;
  
  serieFreq.forEach(freq => {
    const tID = setTimeout(() => {
      reproducirNotaArmonicos(freq, 0.8);
    }, tiempoAcumulado);
    armonicosTimeouts.push(tID);
    tiempoAcumulado += 1000; // 1s entre notas
  });
  
  // Cuando finaliza la serie
  const totalDuracion = tiempoAcumulado;
  const endID = setTimeout(() => {
    armonicosEnProgreso = false;
  }, totalDuracion);
  armonicosTimeouts.push(endID);
}

// =====================================================
// 6. Lógica principal: Generación y Reproducción
// =====================================================

// getArmonicosCurrentSettings: obtiene la posición, nivel, y modoProgresion
function getArmonicosCurrentSettings() {
  const posicion = document.getElementById('posicionArmonicos').value; 
  const nivel = document.getElementById('nivelArmonicos').value;
  const modo = document.getElementById('modoProgresion').value;
  return { posicion, nivel, modo };
}

/**
 * Genera la serie de armónicos para la posición actual y la renderiza.
 * Si la app está en modo "ninguno" (sin progresión), simplemente se reproduce esa serie.
 * Si está en modo "arriba" o "abajo", recorre todas las posiciones en orden de frecuencia (asc o desc).
 */
function iniciarArmonicos() {
  const { posicion, nivel, modo } = getArmonicosCurrentSettings();
  
  // Detener cualquier reproducción previa
  detenerReproduccionArmonicos();
  
  // 1. Si modo == "ninguno": Reproducir la serie de la posición actual
  if (modo === "ninguno") {
    const fundamental = combosValvulas[posicion];
    const nArm = nivelesArmonicos[nivel];
    const serieFreq = generarSerieArmonica(fundamental, nArm);
    renderArmonicos(serieFreq);
    reproducirSerieArmonicos(serieFreq);
    return;
  }
  
  // 2. Si modo == "arriba" o "abajo": recorre todas las posiciones
  //    a) ordenamos combosValvulas por su frecuencia
  const posicionesOrdenadas = Object.entries(combosValvulas)
    .sort((a, b) => a[1] - b[1]); 
  // posicionesOrdenadas es un array de [ [combo, freq], [combo, freq], ... ] en orden asc
  
  //    b) buscamos dónde está la pos. actual en ese array
  let indexActual = posicionesOrdenadas.findIndex(x => x[0] === posicion);
  if (indexActual < 0) indexActual = 0; // fallback
  
  //    c) generamos el array de combos a reproducir
  let combosAReproducir = [];
  if (modo === "arriba") {
    // Desde la pos. actual hasta el final
    combosAReproducir = posicionesOrdenadas.slice(indexActual);
  } else {
    // "abajo": invertimos la parte desde pos. actual hasta el principio
    combosAReproducir = posicionesOrdenadas.slice(0, indexActual + 1).reverse();
  }
  
  //    d) Recorremos combosAReproducir en secuencia, generando y reproduciendo las series.
  //       Para hacerlo "en bloque", generamos un array de arrays de frecuencias a concatenar
  let megaSerie = [];
  combosAReproducir.forEach(entry => {
    const comboID = entry[0];
    const fundamental = entry[1];
    const nArm = nivelesArmonicos[nivel];
    const serieFreq = generarSerieArmonica(fundamental, nArm);
    
    // Podríamos meter un pequeño silencio al final de cada serie
    // o simplemente concatenar.
    // De cara a la visualización, iremos mostrando sólo la serie actual.
    // Pero si deseas mostrar "mega pentagrama" con todas, habría que unir.
    
    // De momento, iremos concatenando en megaSerie para su reproducción,
    // y la visualización la haremos sólo de la última, o la primera, etc.
    // Ajustable según tu preferencia:
    megaSerie = megaSerie.concat(serieFreq);
  });
  
  // Renderizamos la última serie (o la primera).
  // Aquí, por ejemplo, tomamos la SERIE de la *última* posición a la que iremos:
  const ultimaCombo = combosAReproducir[combosAReproducir.length - 1];
  const ultimaFundamental = ultimaCombo[1];
  const ultimaSerie = generarSerieArmonica(ultimaFundamental, nivelesArmonicos[nivel]);
  renderArmonicos(ultimaSerie);
  
  // Reproducimos la megaSerie
  reproducirSerieArmonicos(megaSerie);
}

// =====================================================
// 7. Eventos
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  // Al cargar, por defecto se asume "ninguno" en modoProgresion, etc.
  // Renderizamos la serie actual sin reproducir:
  
  // Ajustar si deseas "iniciarArmonicos()" inmediatamente:
  // o sólo render sin reproducir:
  actualizarArmonicosVista();
});

// Actualiza la vista (pentagrama) sin reproducir
function actualizarArmonicosVista() {
  const { posicion, nivel } = getArmonicosCurrentSettings();
  detenerReproduccionArmonicos();
  
  const fundamental = combosValvulas[posicion];
  const nArm = nivelesArmonicos[nivel];
  const serieFreq = generarSerieArmonica(fundamental, nArm);
  
  renderArmonicos(serieFreq);
}

// Cuando se cambie la posición, nivel o modo, actualizamos la vista sin reproducir
document.getElementById('posicionArmonicos').addEventListener('change', () => {
  actualizarArmonicosVista();
});
document.getElementById('nivelArmonicos').addEventListener('change', () => {
  actualizarArmonicosVista();
});
document.getElementById('modoProgresion').addEventListener('change', () => {
  actualizarArmonicosVista();
});

// Botón para iniciar la reproducción
document.getElementById('btnIniciarArmonicos').addEventListener('click', () => {
  if (!armonicosEnProgreso) {
    iniciarArmonicos();
  }
});
