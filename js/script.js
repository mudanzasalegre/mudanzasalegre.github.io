// ====================
// Funciones de Audio y Utilerías
// ====================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function reproducirNota(frecuencia, duracion = 1) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frecuencia;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  // Aplicar ramp-up y ramp-down para evitar clicks
  const now = audioCtx.currentTime;
  const fadeTime = 0.01;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(1, now + fadeTime);
  gainNode.gain.setValueAtTime(1, now + duracion - fadeTime);
  gainNode.gain.linearRampToValueAtTime(0, now + duracion);
  
  oscillator.start(now);
  oscillator.stop(now + duracion);
}

function calcularFrecuencia(base, semitonos) {
  return base * Math.pow(2, semitonos / 12);
}

function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ====================
// Datos Globales
// ====================

// Tabla de notas base (octava 4) incluyendo accidentales
const notasBase = {
  "C": 261.63,
  "C#": 277.18,
  "D": 293.66,
  "D#": 311.13,
  "E": 329.63,
  "F": 349.23,
  "F#": 369.99,
  "G": 392.00,
  "G#": 415.30,
  "A": 440.00,
  "A#": 466.16,
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

// Variables de estadísticas y ejercicio actual
let currentInterval = null;
let aciertosMC = 0;
let fallosMC = 0;
let aciertosEval = 0;
let fallosEval = 0;

// ====================
// Funciones Auxiliares para Notas
// ====================

/**
 * Para nivel fácil, se elige la nota base de manera determinística:
 * Escoge aleatoriamente una de las claves de notasBase.
 */
function elegirNotaBaseFacil() {
  const keys = Object.keys(notasBase);
  return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Dado una frecuencia, devuelve la nota (clave) en notasBase con la mínima diferencia.
 */
function getClosestNoteName(freq) {
  let closest = null;
  let minDiff = Infinity;
  for (let note in notasBase) {
    const diff = Math.abs(notasBase[note] - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closest = note;
    }
  }
  return closest;
}

/**
 * Dado un nombre de nota base y un número de semitonos, devuelve la nota resultante.
 */
function getNoteName(baseName, semitonos) {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const baseIndex = notes.indexOf(baseName);
  if (baseIndex === -1) return "";
  const newIndex = (baseIndex + semitonos) % 12;
  return notes[newIndex];
}

// ====================
// Funciones del Módulo de Intervalos (MC)
// ====================

function obtenerIntervalosNivel() {
  const nivel = document.getElementById('nivelDificultad').value;
  if (nivel === 'facil') return intervalosFacil;
  else if (nivel === 'dificil') return intervalosDificil;
  else return intervalosMedio;
}

function generarNuevoIntervalo() {
  const disponibles = obtenerIntervalosNivel();
  const indice = Math.floor(Math.random() * disponibles.length);
  const intervaloCorrecto = disponibles[indice];
  
  let baseFrecuencia, notaBaseName;
  const nivel = document.getElementById('nivelDificultad').value;
  if (nivel === 'facil') {
    // En nivel fácil, elegimos la nota base de forma determinística.
    notaBaseName = elegirNotaBaseFacil();
    baseFrecuencia = notasBase[notaBaseName];
  } else {
    // En niveles medio y difícil, generamos una frecuencia aleatoria y obtenemos la nota más cercana.
    let minBase, maxBase;
    if (nivel === 'dificil') { minBase = 110; maxBase = 800; }
    else { minBase = 220; maxBase = 700; }
    baseFrecuencia = minBase + Math.random() * (maxBase - minBase);
    notaBaseName = getClosestNoteName(baseFrecuencia);
  }
  
  const segundaFrecuencia = calcularFrecuencia(baseFrecuencia, intervaloCorrecto.semitonos);
  
  currentInterval = { intervaloCorrecto, baseFrecuencia, segundaFrecuencia, notaBaseName };
  document.getElementById('btnEvaluarEjecucion').disabled = false;
}

function reproducirIntervaloActual() {
  if (!currentInterval) return;
  reproducirNota(currentInterval.baseFrecuencia, 1);
  setTimeout(() => {
    reproducirNota(currentInterval.segundaFrecuencia, 1);
  }, 1200);
}

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

function actualizarEstadisticasMC() {
  document.getElementById('aciertosIntervalo').textContent = aciertosMC;
  document.getElementById('fallosIntervalo').textContent = fallosMC;
}

function manejarReproduccionIntervalo() {
  document.getElementById('mensajeIntervalo').textContent = "";
  generarNuevoIntervalo();
  reproducirIntervaloActual();
  
  // Mostrar la referencia de la nota base según el nivel:
  const nivel = document.getElementById('nivelDificultad').value;
  if (nivel === 'facil') {
    document.getElementById('mensajeIntervalo').textContent = `Referencia: ${currentInterval.notaBaseName}`;
  } else if (nivel === 'medio') {
    if (Math.random() < 0.5) {
      document.getElementById('mensajeIntervalo').textContent = `Referencia: ${currentInterval.notaBaseName}`;
    }
  }
  
  setTimeout(mostrarOpcionesIntervalo, 2500);
}

// ====================
// Funciones del Módulo de Evaluación Automática de Intervalos (EA)
// ====================

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
        if (pitch !== -1) detecciones.push(pitch);
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

function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buf[i] * buf[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  
  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE; i++) {
    if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
  }
  for (let i = SIZE - 1; i >= 0; i--) {
    if (Math.abs(buf[i]) < 0.2) { r2 = i; break; }
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
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

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
        // Calcular el nombre de la nota resultante de la base
        const expectedNoteName = getNoteName(currentInterval.notaBaseName, currentInterval.intervaloCorrecto.semitonos);
        if (Math.abs(detectedInterval - expectedInterval) <= 0.5) {
          mensajeEval.textContent = `¡Correcto! Base: ${currentInterval.notaBaseName}, Segunda: ${expectedNoteName}. (Intervalo: ${currentInterval.intervaloCorrecto.nombre}, ${detectedInterval.toFixed(2)} semitonos)`;
          mensajeEval.style.color = "green";
          aciertosEval++;
        } else {
          mensajeEval.textContent = `Incorrecto. Base: ${currentInterval.notaBaseName}, Segunda: ${expectedNoteName}. (Intervalo: ${currentInterval.intervaloCorrecto.nombre}, ${detectedInterval.toFixed(2)} semitonos)`;
          mensajeEval.style.color = "red";
          fallosEval++;
        }
        actualizarEstadisticasEval();
        document.getElementById('btnEvaluarEjecucion').disabled = true;
      });
    }, 500);
  });
}

function actualizarEstadisticasEval() {
  document.getElementById('aciertosEval').textContent = aciertosEval;
  document.getElementById('fallosEval').textContent = fallosEval;
}

// ====================
// Funciones para Escalas
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

/**
 * Reproduce la escala de forma continua:
 * Primero ascendente, inmediatamente seguida por la descendente sin pausas.
 * En la descendente se omite la octava (la nota superior) para evitar repetir.
 */
function reproducirEscala() {
  const tipoEscala = document.getElementById('tipoEscala').value;
  const tonalidad = document.getElementById('tonalidadEscala').value;
  const secuencia = obtenerSecuenciaEscala(tipoEscala);
  const base = notasBase[tonalidad] || 261.63;
  
  let frecuenciasAsc = [];
  let tiempoAcumulado = 0;
  let acumulador = 0;
  
  // Ascendente: guarda la nota base y cada frecuencia
  reproducirNota(base, 0.8);
  frecuenciasAsc.push(base);
  tiempoAcumulado += 0.9;
  
  for (let i = 0; i < secuencia.length; i++) {
    acumulador += secuencia[i];
    const nuevaFrecuencia = calcularFrecuencia(base, acumulador);
    frecuenciasAsc.push(nuevaFrecuencia);
    setTimeout(() => {
      reproducirNota(nuevaFrecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 0.9;
  }
  
  // Descendente: empieza inmediatamente después de la ascendente, sin pausa.
  let tiempoDesc = tiempoAcumulado;
  // Recorre el array en reversa, omitiendo la nota superior (última)
  for (let i = frecuenciasAsc.length - 2; i >= 0; i--) {
    setTimeout(() => {
      reproducirNota(frecuenciasAsc[i], 0.8);
    }, tiempoDesc * 1000);
    tiempoDesc += 0.9;
  }
  
  document.getElementById('mensajeEscala').textContent = `Reproduciendo escala ${tipoEscala} en ${tonalidad} (ascendente y descendente)`;
}

function manejarReproduccionEscala() {
  document.getElementById('mensajeEscala').textContent = "";
  reproducirEscala();
}

// ====================
// Funciones para Arpegios
// ====================

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

/**
 * Reproduce el arpegio de forma continua:
 * Ascendente: se reproducen las notas según la secuencia.
 * Descendente: se reproducen en orden inverso, omitiendo la nota superior.
 */
function reproducirArpegio() {
  const tipoArpegio = document.getElementById('tipoArpegio').value;
  const tonalidad = document.getElementById('tonalidadArpegio').value;
  const secuencia = obtenerSecuenciaArpegio(tipoArpegio);
  const base = notasBase[tonalidad] || 261.63;
  
  let frecuenciasAsc = [];
  let tiempoAcumulado = 0;
  
  // Ascendente: generar y reproducir
  secuencia.forEach(intervalo => {
    const frecuencia = calcularFrecuencia(base, intervalo);
    frecuenciasAsc.push(frecuencia);
    setTimeout(() => {
      reproducirNota(frecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 1;
  });
  
  // Descendente: omitir la nota superior y reproducir en orden inverso
  let tiempoDesc = tiempoAcumulado;
  for (let i = frecuenciasAsc.length - 2; i >= 0; i--) {
    setTimeout(() => {
      reproducirNota(frecuenciasAsc[i], 0.8);
    }, tiempoDesc * 1000);
    tiempoDesc += 1;
  }
  
  document.getElementById('mensajeArpegio').textContent = `Reproduciendo arpegio ${tipoArpegio} en ${tonalidad} (ascendente y descendente)`;
}

function manejarReproduccionArpegio() {
  document.getElementById('mensajeArpegio').textContent = "";
  reproducirArpegio();
}

// ====================
// Funciones Auxiliares para Notas
// ====================

function getClosestNoteName(freq) {
  let closest = null;
  let minDiff = Infinity;
  for (let note in notasBase) {
    const diff = Math.abs(notasBase[note] - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closest = note;
    }
  }
  return closest;
}

function elegirNotaBaseFacil() {
  const keys = Object.keys(notasBase);
  return keys[Math.floor(Math.random() * keys.length)];
}

function getNoteName(baseName, semitonos) {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const baseIndex = notes.indexOf(baseName);
  if (baseIndex === -1) return "";
  const newIndex = (baseIndex + semitonos) % 12;
  return notes[newIndex];
}

// ====================
// Módulo de Evaluación Automática de Intervalos (EA)
// ====================

// Variables para detecciones
let detectedPitch1 = null;
let detectedPitch2 = null;

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
        if (pitch !== -1) detecciones.push(pitch);
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

function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buf[i] * buf[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;
  
  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE; i++) {
    if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
  }
  for (let i = SIZE - 1; i >= 0; i--) {
    if (Math.abs(buf[i]) < 0.2) { r2 = i; break; }
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
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

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
        // Obtener el nombre de la nota resultante usando la referencia de la nota base
        const expectedNoteName = getNoteName(currentInterval.notaBaseName, currentInterval.intervaloCorrecto.semitonos);
        const tolerance = 0.5;
        if (Math.abs(detectedInterval - expectedInterval) <= tolerance) {
          mensajeEval.textContent = `¡Correcto! Base: ${currentInterval.notaBaseName}, Segunda: ${expectedNoteName}. Intervalo: ${currentInterval.intervaloCorrecto.nombre} (${detectedInterval.toFixed(2)} semitonos)`;
          mensajeEval.style.color = "green";
          aciertosEval++;
        } else {
          mensajeEval.textContent = `Incorrecto. Base: ${currentInterval.notaBaseName}, Segunda: ${expectedNoteName}. Intervalo: ${currentInterval.intervaloCorrecto.nombre} (${detectedInterval.toFixed(2)} semitonos)`;
          mensajeEval.style.color = "red";
          fallosEval++;
        }
        actualizarEstadisticasEval();
        document.getElementById('btnEvaluarEjecucion').disabled = true;
      });
    }, 500);
  });
}

function actualizarEstadisticasEval() {
  document.getElementById('aciertosEval').textContent = aciertosEval;
  document.getElementById('fallosEval').textContent = fallosEval;
}

// ====================
// Funciones para Escalas
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

/**
 * Reproduce la escala de forma continua:
 * Primero ascendente, inmediatamente seguida por la descendente sin pausa extra.
 * En la descendente se omite la nota superior para continuidad.
 */
function reproducirEscala() {
  const tipoEscala = document.getElementById('tipoEscala').value;
  const tonalidad = document.getElementById('tonalidadEscala').value;
  const secuencia = obtenerSecuenciaEscala(tipoEscala);
  const base = notasBase[tonalidad] || 261.63;
  
  let frecuenciasAsc = [];
  let tiempoAcumulado = 0;
  let acumulador = 0;
  
  // Ascendente: guardar y reproducir
  reproducirNota(base, 0.8);
  frecuenciasAsc.push(base);
  tiempoAcumulado += 0.9;
  
  for (let i = 0; i < secuencia.length; i++) {
    acumulador += secuencia[i];
    const nuevaFrecuencia = calcularFrecuencia(base, acumulador);
    frecuenciasAsc.push(nuevaFrecuencia);
    setTimeout(() => {
      reproducirNota(nuevaFrecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 0.9;
  }
  
  // Descendente: sin pausa extra, omitiendo la nota superior (última) para continuidad.
  let tiempoDesc = tiempoAcumulado;
  for (let i = frecuenciasAsc.length - 2; i >= 0; i--) {
    setTimeout(() => {
      reproducirNota(frecuenciasAsc[i], 0.8);
    }, tiempoDesc * 1000);
    tiempoDesc += 0.9;
  }
  
  document.getElementById('mensajeEscala').textContent = `Reproduciendo escala ${tipoEscala} en ${tonalidad} (ascendente y descendente)`;
}

function manejarReproduccionEscala() {
  document.getElementById('mensajeEscala').textContent = "";
  reproducirEscala();
}

// ====================
// Funciones para Arpegios
// ====================

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

/**
 * Reproduce el arpegio de forma continua:
 * Primero ascendente y luego descendente (omitimos la nota superior en la descendente).
 */
function reproducirArpegio() {
  const tipoArpegio = document.getElementById('tipoArpegio').value;
  const tonalidad = document.getElementById('tonalidadArpegio').value;
  const secuencia = obtenerSecuenciaArpegio(tipoArpegio);
  const base = notasBase[tonalidad] || 261.63;
  
  let frecuenciasAsc = [];
  let tiempoAcumulado = 0;
  
  // Ascendente
  secuencia.forEach(intervalo => {
    const frecuencia = calcularFrecuencia(base, intervalo);
    frecuenciasAsc.push(frecuencia);
    setTimeout(() => {
      reproducirNota(frecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 1;
  });
  
  // Descendente: omitir la nota superior y reproducir en orden inverso
  let tiempoDesc = tiempoAcumulado;
  for (let i = frecuenciasAsc.length - 2; i >= 0; i--) {
    setTimeout(() => {
      reproducirNota(frecuenciasAsc[i], 0.8);
    }, tiempoDesc * 1000);
    tiempoDesc += 1;
  }
  
  document.getElementById('mensajeArpegio').textContent = `Reproduciendo arpegio ${tipoArpegio} en ${tonalidad} (ascendente y descendente)`;
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
