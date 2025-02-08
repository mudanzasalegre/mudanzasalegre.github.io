// ====================
// Funciones de Audio y Utilerías
// ====================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Reproduce una nota con la frecuencia indicada durante 'duracion' segundos.
 */
function reproducirNota(frecuencia, duracion = 1) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frecuencia;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duracion);
}

/**
 * Calcula la frecuencia resultante a partir de una frecuencia base y un número de semitonos.
 */
function calcularFrecuencia(base, semitonos) {
  return base * Math.pow(2, semitonos / 12);
}

/**
 * Mezcla un array usando el algoritmo de Fisher-Yates.
 */
function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ====================
// Variables Globales y Tablas de Datos
// ====================

// Tabla de frecuencias base (nota de referencia en la octava 4)
const notasBase = {
  "C": 261.63,
  "D": 293.66,
  "E": 329.63,
  "F": 349.23,
  "G": 392.00,
  "A": 440.00,
  "B": 493.88
};

// Conjuntos de intervalos para cada nivel
const intervalosFacil = [
  { nombre: "Segunda menor", semitonos: 1 },
  { nombre: "Segunda mayor", semitonos: 2 },
  { nombre: "Cuarta justa", semitonos: 5 },
  { nombre: "Quinta justa", semitonos: 7 },
  { nombre: "Octava", semitonos: 12 }
];

const intervalosMedio = [
  { nombre: "Segunda menor", semitonos: 1 },
  { nombre: "Segunda mayor", semitonos: 2 },
  { nombre: "Tercera menor", semitonos: 3 },
  { nombre: "Tercera mayor", semitonos: 4 },
  { nombre: "Cuarta justa", semitonos: 5 },
  { nombre: "Tritono", semitonos: 6 },
  { nombre: "Quinta justa", semitonos: 7 },
  { nombre: "Sexta menor", semitonos: 8 },
  { nombre: "Sexta mayor", semitonos: 9 },
  { nombre: "Séptima menor", semitonos: 10 },
  { nombre: "Séptima mayor", semitonos: 11 },
  { nombre: "Octava", semitonos: 12 }
];

const intervalosDificil = [
  { nombre: "Segunda menor", semitonos: 1 },
  { nombre: "Segunda mayor", semitonos: 2 },
  { nombre: "Tercera menor", semitonos: 3 },
  { nombre: "Tercera mayor", semitonos: 4 },
  { nombre: "Cuarta justa", semitonos: 5 },
  { nombre: "Tritono", semitonos: 6 },
  { nombre: "Quinta justa", semitonos: 7 },
  { nombre: "Sexta menor", semitonos: 8 },
  { nombre: "Sexta mayor", semitonos: 9 },
  { nombre: "Séptima menor", semitonos: 10 },
  { nombre: "Séptima mayor", semitonos: 11 },
  { nombre: "Octava", semitonos: 12 },
  { nombre: "Novena menor", semitonos: 13 },
  { nombre: "Novena mayor", semitonos: 14 },
  { nombre: "Décima menor", semitonos: 15 },
  { nombre: "Décima mayor", semitonos: 16 }
];

// Variables para el Módulo de Intervalos
let currentInterval = null;
let aciertosMC = 0;   // Multiple Choice
let fallosMC = 0;
let aciertosEval = 0; // Evaluación Automática
let fallosEval = 0;

// ====================
// Funciones para el Módulo de Intervalos
// ====================

/**
 * Devuelve el conjunto de intervalos según el nivel seleccionado.
 */
function obtenerIntervalosNivel() {
  const nivel = document.getElementById('nivelDificultad').value;
  if (nivel === 'facil') return intervalosFacil;
  else if (nivel === 'dificil') return intervalosDificil;
  else return intervalosMedio;
}

/**
 * Genera un nuevo intervalo y lo almacena en currentInterval.
 */
function generarNuevoIntervalo() {
  const disponibles = obtenerIntervalosNivel();
  const indice = Math.floor(Math.random() * disponibles.length);
  const intervaloCorrecto = disponibles[indice];
  
  let minBase, maxBase;
  const nivel = document.getElementById('nivelDificultad').value;
  if (nivel === 'facil') {
    minBase = 300; maxBase = 500;
  } else if (nivel === 'dificil') {
    minBase = 110; maxBase = 800;
  } else {
    minBase = 220; maxBase = 700;
  }
  const maxAjustado = Math.min(maxBase, 1000 / Math.pow(2, intervaloCorrecto.semitonos / 12));
  const baseFrecuencia = minBase + Math.random() * (maxAjustado - minBase);
  const segundaFrecuencia = calcularFrecuencia(baseFrecuencia, intervaloCorrecto.semitonos);
  
  currentInterval = { intervaloCorrecto, baseFrecuencia, segundaFrecuencia };
  // Reactivar el botón de Evaluación Automática
  document.getElementById('btnEvaluarEjecucion').disabled = false;
}

/**
 * Reproduce el intervalo almacenado en currentInterval.
 */
function reproducirIntervaloActual() {
  if (!currentInterval) return;
  reproducirNota(currentInterval.baseFrecuencia, 1);
  setTimeout(() => {
    reproducirNota(currentInterval.segundaFrecuencia, 1);
  }, 1200);
}

/**
 * Muestra 4 opciones (MC) para identificar el intervalo.
 */
function mostrarOpcionesIntervalo() {
  const contenedor = document.getElementById('opcionesIntervalo');
  contenedor.innerHTML = "";
  const disponibles = obtenerIntervalosNivel();
  const opciones = [ currentInterval.intervaloCorrecto ];
  const restantes = disponibles.filter(i => i.semitonos !== currentInterval.intervaloCorrecto.semitonos);
  const adicionales = mezclarArray(restantes).slice(0, 3);
  opciones.push(...adicionales);
  const opcionesMezcladas = mezclarArray(opciones);
  
  opcionesMezcladas.forEach(opcion => {
    const btn = document.createElement('button');
    btn.textContent = opcion.nombre;
    btn.addEventListener('click', () => verificarRespuestaIntervalo(opcion));
    contenedor.appendChild(btn);
  });
}

/**
 * Verifica la respuesta del modo MC.
 */
function verificarRespuestaIntervalo(opcionSeleccionada) {
  const mensaje = document.getElementById('mensajeIntervalo');
  if (opcionSeleccionada.semitonos === currentInterval.intervaloCorrecto.semitonos) {
    mensaje.textContent = "¡Correcto!";
    mensaje.style.color = "green";
    aciertosMC++;
  } else {
    mensaje.textContent = `Incorrecto. Era: ${currentInterval.intervaloCorrecto.nombre}`;
    mensaje.style.color = "red";
    fallosMC++;
  }
  document.getElementById('opcionesIntervalo').innerHTML = "";
  actualizarEstadisticasMC();
  currentInterval = null;
}

/**
 * Actualiza las estadísticas del modo MC.
 */
function actualizarEstadisticasMC() {
  document.getElementById('aciertosIntervalo').textContent = aciertosMC;
  document.getElementById('fallosIntervalo').textContent = fallosMC;
}

/**
 * Maneja la acción del botón "Reproducir Intervalo".
 * Genera un nuevo ejercicio, reproduce el intervalo y muestra las opciones MC.
 */
function manejarReproduccionIntervalo() {
  document.getElementById('mensajeIntervalo').textContent = "";
  generarNuevoIntervalo();
  reproducirIntervaloActual();
  setTimeout(mostrarOpcionesIntervalo, 2500);
}

// ====================
// Módulo de Evaluación Automática de Intervalos
// ====================

// Variables para almacenar las detecciones
let detectedPitch1 = null;
let detectedPitch2 = null;

/**
 * Inicia la detección de pitch usando getUserMedia y un AnalyserNode.
 * Durante 'duration' segundos se recoge la señal, se calcula el promedio y se llama al callback.
 */
function startPitchDetection(duration, callback) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const micSource = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      micSource.connect(analyser);
      const bufferLength = analyser.fftSize;
      const buffer = new Float32Array(bufferLength);
      const detecciones = [];
      const startTime = audioCtx.currentTime;
      
      const contadorEl = document.getElementById('contador');
      let remaining = duration;
      contadorEl.textContent = `Tiempo: ${remaining}`;
      const intervalId = setInterval(() => {
        remaining--;
        contadorEl.textContent = `Tiempo: ${remaining}`;
      }, 1000);
      
      function update() {
        analyser.getFloatTimeDomainData(buffer);
        const pitch = autoCorrelate(buffer, audioCtx.sampleRate);
        if (pitch !== -1) {
          detecciones.push(pitch);
        }
        if (audioCtx.currentTime - startTime < duration) {
          requestAnimationFrame(update);
        } else {
          clearInterval(intervalId);
          contadorEl.textContent = "";
          stream.getTracks().forEach(track => track.stop());
          if (detecciones.length > 0) {
            const promedio = detecciones.reduce((a, b) => a + b, 0) / detecciones.length;
            callback(promedio);
          } else {
            callback(null);
          }
        }
      }
      update();
    })
    .catch(err => {
      console.error("Error al acceder al micrófono", err);
      callback(null);
    });
}

/**
 * Algoritmo de autocorrelación para detectar el pitch.
 * Basado en el ejemplo de Chris Wilson.
 */
function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  
  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE; i++) {
    if (Math.abs(buf[i]) < 0.2) {
      r1 = i;
      break;
    }
  }
  for (let i = SIZE - 1; i >= 0; i--) {
    if (Math.abs(buf[i]) < 0.2) {
      r2 = i;
      break;
    }
  }
  buf = buf.slice(r1, r2);
  const newSize = buf.length;
  const c = new Array(newSize).fill(0);
  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }
  let d = 0;
  while (c[d] > c[d+1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

/**
 * Evalúa automáticamente la ejecución del intervalo (Modo Evaluación Automática).
 * El flujo es:
 *   1. Se muestra un mensaje: "Toca la PRIMERA nota durante 3 segundos..."
 *   2. Se detecta la primera nota (pitch1).
 *   3. Inmediatamente se indica: "Ahora toca la SEGUNDA nota durante 3 segundos..."
 *   4. Se detecta la segunda nota (pitch2).
 *   5. Se calcula el intervalo en semitonos y se compara con el esperado.
 *   6. Se actualizan las estadísticas de Evaluación y se desactiva el botón hasta que se genere un nuevo ejercicio.
 */
function evaluateIntervalAuto() {
  const mensajeEval = document.getElementById('mensajeEvaluacion');
  mensajeEval.style.color = "black";
  mensajeEval.textContent = "Toca la PRIMERA nota del intervalo durante 3 segundos...";
  
  startPitchDetection(3, function(pitch1) {
    if (!pitch1) {
      mensajeEval.textContent = "No se pudo detectar la primera nota.";
      mensajeEval.style.color = "red";
      document.getElementById('btnEvaluarEjecucion').disabled = true;
      fallosEval++;
      actualizarEstadisticasEval();
      return;
    }
    detectedPitch1 = pitch1;
    mensajeEval.textContent = `Primera nota detectada: ${pitch1.toFixed(2)} Hz. Ahora toca la SEGUNDA nota durante 3 segundos...`;
    setTimeout(() => {
      startPitchDetection(3, function(pitch2) {
        if (!pitch2) {
          mensajeEval.textContent = "No se pudo detectar la segunda nota.";
          mensajeEval.style.color = "red";
          document.getElementById('btnEvaluarEjecucion').disabled = true;
          fallosEval++;
          actualizarEstadisticasEval();
          return;
        }
        detectedPitch2 = pitch2;
        const detectedInterval = 12 * Math.log2(detectedPitch2 / detectedPitch1);
        const expectedInterval = currentInterval ? currentInterval.intervaloCorrecto.semitonos : null;
        if (!expectedInterval) {
          mensajeEval.textContent = "No hay un intervalo generado para comparar.";
          mensajeEval.style.color = "black";
          document.getElementById('btnEvaluarEjecucion').disabled = true;
          return;
        }
        const tolerance = 0.5; // ±0.5 semitonos
        if (Math.abs(detectedInterval - expectedInterval) <= tolerance) {
          mensajeEval.textContent = `¡Correcto! Intervalo detectado: ${detectedInterval.toFixed(2)} semitonos (esperado: ${expectedInterval}).`;
          mensajeEval.style.color = "green";
          aciertosEval++;
        } else {
          mensajeEval.textContent = `Incorrecto. Intervalo detectado: ${detectedInterval.toFixed(2)} semitonos (esperado: ${expectedInterval}).`;
          mensajeEval.style.color = "red";
          fallosEval++;
        }
        actualizarEstadisticasEval();
        // Desactivar el botón de evaluación para este ejercicio
        document.getElementById('btnEvaluarEjecucion').disabled = true;
      });
    }, 500); // breve pausa entre detecciones
  });
}

/**
 * Actualiza las estadísticas del Modo Evaluación Automática.
 */
function actualizarEstadisticasEval() {
  document.getElementById('aciertosEval').textContent = aciertosEval;
  document.getElementById('fallosEval').textContent = fallosEval;
}

// ====================
// Funciones para Escalas y Arpegios (se mantienen casi sin cambios)
// ====================

function obtenerSecuenciaEscala(tipo) {
  switch (tipo) {
    case "mayor":
      return [2, 2, 1, 2, 2, 2, 1];
    case "menor":
      return [2, 1, 2, 2, 1, 2, 2];
    case "armonica":
      return [2, 1, 2, 2, 1, 3, 1];
    case "melodica":
      return [2, 1, 2, 2, 2, 2, 1];
    case "oriental":
      return [1, 3, 1, 2, 1, 2, 2];
    case "pentatonica":
      return [2, 2, 3, 2, 3];
    default:
      return [2, 2, 1, 2, 2, 2, 1];
  }
}

function reproducirEscala() {
  const tipoEscala = document.getElementById('tipoEscala').value;
  const tonalidad = document.getElementById('tonalidadEscala').value;
  const secuencia = obtenerSecuenciaEscala(tipoEscala);
  const base = notasBase[tonalidad] || 261.63;
  
  let tiempoAcumulado = 0;
  let acumulador = 0;
  
  reproducirNota(base, 0.8);
  tiempoAcumulado += 0.9;
  
  for (let i = 0; i < secuencia.length; i++) {
    acumulador += secuencia[i];
    const nuevaFrecuencia = calcularFrecuencia(base, acumulador);
    setTimeout(() => {
      reproducirNota(nuevaFrecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 0.9;
  }
  
  document.getElementById('mensajeEscala').textContent = `Reproduciendo escala ${tipoEscala} en ${tonalidad}`;
}

function manejarReproduccionEscala() {
  document.getElementById('mensajeEscala').textContent = "";
  reproducirEscala();
}

function obtenerSecuenciaArpegio(tipo) {
  if (tipo === "mayor") {
    return [0, 4, 7, 12];
  } else if (tipo === "menor") {
    return [0, 3, 7, 12];
  } else if (tipo === "dominante") {
    return [0, 4, 7, 10];
  }
  return [];
}

function reproducirArpegio() {
  const tipoArpegio = document.getElementById('tipoArpegio').value;
  const tonalidad = document.getElementById('tonalidadArpegio').value;
  const secuencia = obtenerSecuenciaArpegio(tipoArpegio);
  const base = notasBase[tonalidad] || 261.63;
  
  let tiempoAcumulado = 0;
  secuencia.forEach(intervalo => {
    const frecuencia = calcularFrecuencia(base, intervalo);
    setTimeout(() => {
      reproducirNota(frecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 1;
  });
  
  document.getElementById('mensajeArpegio').textContent = `Reproduciendo arpegio ${tipoArpegio} en ${tonalidad}`;
}

function manejarReproduccionArpegio() {
  document.getElementById('mensajeArpegio').textContent = "";
  reproducirArpegio();
}

// ====================
// Manejo de Tabs (Navegación entre módulos)
// ====================
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.getAttribute('data-tab')).classList.add('active');
  });
});

// ====================
// Eventos de Botones
// ====================
document.getElementById('btnReproducirIntervalo').addEventListener('click', manejarReproduccionIntervalo);
document.getElementById('btnEvaluarEjecucion').addEventListener('click', evaluateIntervalAuto);
document.getElementById('btnReproducirEscala').addEventListener('click', manejarReproduccionEscala);
document.getElementById('btnReproducirArpegio').addEventListener('click', manejarReproduccionArpegio);
