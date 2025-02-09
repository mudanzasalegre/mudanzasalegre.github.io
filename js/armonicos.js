// ====================
// ARMONICOS.JS
// Sección de Armónicos para Trompa en Bb
// ====================

// --- 1. Funciones de Audio y Utilerías (se reutilizan las mismas del script principal) ---

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

function calcularFrecuenciaArmonicos(base, multiplo) {
  return base * multiplo;
}

// --- 2. Datos y Configuración para Armónicos ---

// Para simplificar, definiremos algunas "posiciones" para la trompa (en Bb).
// Cada posición se define por una frecuencia fundamental (en Hz).  
// Estos valores pueden ajustarse según la práctica del músico.
const posicionesArmonicos = {
  "Posición 1": 116.54,  // Aproximadamente Bb1 (fundamental para trompa en Bb, aunque normalmente no se toca el fundamental)
  "Posición 2": 146.83,  // Aproximadamente Bb2
  "Posición 3": 195.99   // Aproximadamente Bb3
};

// Definimos tres niveles de dificultad: 
// - Fácil: primeros 4 armónicos
// - Medio: primeros 6 armónicos
// - Difícil: primeros 8 armónicos
const nivelesArmonicos = {
  "facil": 4,
  "medio": 6,
  "dificil": 8
};

// --- 3. Funciones para Generar la Serie Armónica ---

/**
 * Dado una posición (clave del objeto posicionesArmonicos) y un nivel (clave de nivelesArmonicos),
 * genera un array de frecuencias que corresponde a la serie armónica.
 */
function generarSerieArmonica(posicion, nivel) {
  const fundamental = posicionesArmonicos[posicion];
  const numHarmonics = nivelesArmonicos[nivel];
  // Generamos los armónicos: el primer armónico es el fundamental (multiplo 1), luego 2,3,...
  const serie = [];
  for (let n = 1; n <= numHarmonics; n++) {
    serie.push(calcularFrecuenciaArmonicos(fundamental, n));
  }
  return serie;
}

/**
 * Dado la serie armónica (array de frecuencias), genera un array de claves (notas con octava) para renderización.
 * Para este ejemplo usaremos la función "freqToNote" muy básica, ya que una conversión precisa requeriría
 * una tabla inversa. Se asume que el instrumento está afinado en Bb (por ejemplo, para Posición 2 la fundamental es Bb).
 * Aquí usaremos la función que ya teníamos en el otro script para escalas, adaptada a armónicos.
 */
function freqToNote(freq) {
  // Para este ejemplo usaremos una conversión aproximada:
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // Usaremos la fórmula para obtener el número de semitonos respecto a C4 (261.63 Hz)
  const semitonos = Math.round(12 * Math.log2(freq / 261.63));
  const octave = 4 + Math.floor((semitonos) / 12);
  const index = ((semitonos % 12) + 12) % 12;
  return noteNames[index] + "/" + octave;
}

/**
 * Genera la serie de claves (notas con octava) a partir de la serie armónica (frecuencias).
 */
function generarClavesSerie(serie) {
  return serie.map(freq => freqToNote(freq));
}

// --- 4. Funciones para Reproducir y Renderizar la Serie Armónica ---

// Arreglo global para almacenar los setTimeout de reproducción de armónicos
let armonicosTimeouts = [];

// Reproduce la serie armónica en secuencia (cada nota se reproduce con un pequeño retardo)
function reproducirSerieArmonica(serie) {
  // Primero cancelamos timeouts previos (si existieran)
  detenerSerieArmonica();
  armonicosTimeouts = [];
  let tiempoAcumulado = 0;
  serie.forEach((freq) => {
    const timeoutID = setTimeout(() => {
      reproducirNotaArmonicos(freq, 0.8);
    }, tiempoAcumulado);
    armonicosTimeouts.push(timeoutID);
    tiempoAcumulado += 1000; // 1 segundo entre notas (ajustable)
  });
}

// Detiene la reproducción de la serie armónica
function detenerSerieArmonica() {
  armonicosTimeouts.forEach(timeoutID => clearTimeout(timeoutID));
  armonicosTimeouts = [];
}

// Renderiza la serie armónica en un pentagrama usando VexFlow
function renderArmonicos(serie) {
  // Convertimos la serie de frecuencias a claves (notas con octava)
  const claves = generarClavesSerie(serie);
  // Se mostrará la serie en forma ascendente en el pentagrama.
  // Si deseas incluir flechas o indicaciones para la parte descendente, se puede ampliar.
  const VF = Vex.Flow;
  const container = document.getElementById("staffArmonicos");
  if (!container) return;
  container.innerHTML = "";
  
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize(600, 200);
  const context = renderer.getContext();
  context.setFont("Arial", 10, "").setBackgroundFillStyle("#fff");
  
  // Creamos el pentagrama: para armónicos usaremos la clave de sol
  const stave = new VF.Stave(10, 40, 580);
  // La armadura se calcula a partir de la fundamental: usamos la primera nota (clave) de la serie
  // Aplicamos fixKeySignature para convertir tonalidades no válidas.
  const fundamentalClave = fixKeySignature(claves[0].split("/")[0]);
  stave.addClef("treble").addKeySignature(fundamentalClave).setContext(context).draw();
  
  // Creamos las notas; todas con duración de negra ('q')
  const vfNotes = claves.map(key => new VF.StaveNote({ keys: [key], duration: "q" }));
  // Agregamos accidentals (usando addModifier en VexFlow v4)
  vfNotes.forEach(note => {
    const key = note.getKeys()[0];
    if (key.includes("#")) {
      note.addModifier(new VF.Accidental("#"), 0);
    } else if (key.includes("b")) {
      note.addModifier(new VF.Accidental("b"), 0);
    }
  });
  
  const voice = new VF.Voice({ num_beats: vfNotes.length, beat_value: 4 });
  voice.addTickables(vfNotes);
  new VF.Formatter().joinVoices([voice]).format([voice], 520);
  voice.draw(context, stave);
}

// --- 5. Eventos y Control de la Sección de Armónicos ---

// Variables globales para la sección de armónicos
let currentSerieArmonica = [];
let isArmonicosPlaying = false;

// Función para actualizar la visualización (sin reproducir) según la selección
function actualizarVisualArmonicos() {
  const posicion = document.getElementById('posicionArmonicos').value;
  const nivel = document.getElementById('nivelArmonicos').value;
  // Generamos la serie armónica
  currentSerieArmonica = generarSerieArmonica(posicion, nivel);
  // Renderizamos la serie en el pentagrama
  renderArmonicos(currentSerieArmonica);
}

// Función para iniciar la reproducción y visualización
function iniciarEjercicioArmonicos() {
  // Si se está reproduciendo, detener
  detenerSerieArmonica();
  isArmonicosPlaying = true;
  
  // Actualizar la serie (en caso de cambios en los selects)
  actualizarVisualArmonicos();
  
  // Reproducir la serie
  reproducirSerieArmonica(currentSerieArmonica);
  
  // Cuando termine la reproducción, marcar como finalizada
  const totalTime = currentSerieArmonica.length * 1000;
  setTimeout(() => {
    isArmonicosPlaying = false;
  }, totalTime);
}

// --- 6. Eventos para actualizar la visualización y manejar la interrupción ---
// Cuando el usuario cambia la posición o el nivel, se debe detener la reproducción y actualizar la vista.
document.getElementById('posicionArmonicos').addEventListener('change', () => {
  detenerSerieArmonica();
  actualizarVisualArmonicos();
});
document.getElementById('nivelArmonicos').addEventListener('change', () => {
  detenerSerieArmonica();
  actualizarVisualArmonicos();
});

// Al cargar la pestaña de Armónicos, actualizar la visualización con la serie por defecto
document.addEventListener('DOMContentLoaded', () => {
  // Se asume que en el select de posición y nivel ya hay valores por defecto (por ejemplo, "Posición 1" y "facil")
  actualizarVisualArmonicos();
});

// --- 7. Asignar botón de reproducción de Armónicos ---
// Se asume que en el index.html hay un botón con id "btnIniciarArmonicos"
document.getElementById('btnIniciarArmonicos').addEventListener('click', () => {
  if (!isArmonicosPlaying) {
    iniciarEjercicioArmonicos();
  }
});
