// ====================
// 1. Funciones de Audio y Utilerías
// ====================

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function reproducirNota(frecuencia, duracion = 1) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frecuencia;
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Ramp-up y ramp-down para evitar clicks (10 ms)
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
// 2. Datos Globales
// ====================

// Tabla de notas (octava 4) con accidentales  
// Se usan valores canónicos (con sostenidos)
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

// Variables de estadísticas y ejercicio actual para intervalos
let currentInterval = null;
let aciertosMC = 0;
let fallosMC = 0;
let aciertosEval = 0;
let fallosEval = 0;

// Variables para controlar reproducción
let isScalePlaying = false;
let isArpeggioPlaying = false;
let scaleTimeouts = [];  // Para cancelar timeouts de escala si es necesario

// ====================
// 2a. Helper: Fix Key Signature
// ====================
// Convierte tonalidades que VexFlow no acepta (por ejemplo, "D#" → "Eb")
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

// ====================
// 3. Funciones Auxiliares para Notas
// ====================

function elegirNotaBaseFacil() {
  const keys = Object.keys(notasBase);
  return keys[Math.floor(Math.random() * keys.length)];
}

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

function getNoteName(baseName, semitonos) {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const baseIndex = notes.indexOf(baseName);
  if (baseIndex === -1) return "";
  const newIndex = (baseIndex + semitonos) % 12;
  return notes[newIndex];
}

// Helper para generar la secuencia de claves (notas con octava) a partir de una secuencia de intervalos
function generateKeys(tonalidadRaw, secuencia) {
  let tonalidadDisplay = tonalidadRaw.includes("/") ? tonalidadRaw : tonalidadRaw + "/4";
  const tonalidad = tonalidadDisplay.split("/")[0];
  const notesArr = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  let baseIndex = notesArr.indexOf(tonalidad);
  if (baseIndex === -1) baseIndex = 0;
  let keys = [];
  keys.push(tonalidadDisplay);
  let acumulador = 0;
  for (let i = 0; i < secuencia.length; i++) {
    acumulador += secuencia[i];
    const newIndex = (baseIndex + acumulador) % 12;
    const octaveShift = Math.floor((baseIndex + acumulador) / 12);
    keys.push(notesArr[newIndex] + "/" + (4 + octaveShift));
  }
  return keys;
}

// ====================
// 4. Módulo de Intervalos (MC)
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
    notaBaseName = elegirNotaBaseFacil();
    baseFrecuencia = notasBase[notaBaseName];
  } else {
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
  const mensaje = document.getElementById('mensajeIntervalos');
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
  currentInterval = null;
  document.getElementById('opcionesIntervalo').innerHTML = "";
  document.getElementById('mensajeIntervalos').innerHTML = "";
  
  generarNuevoIntervalo();
  reproducirIntervaloActual();
  
  const nivel = document.getElementById('nivelDificultad').value;
  if (nivel === 'facil') {
    document.getElementById('mensajeIntervalos').textContent = `Referencia: ${currentInterval.notaBaseName}`;
  } else if (nivel === 'medio') {
    if (Math.random() < 0.5) {
      document.getElementById('mensajeIntervalos').textContent = `Referencia: ${currentInterval.notaBaseName}`;
    }
  }
  
  setTimeout(mostrarOpcionesIntervalo, 2500);
}

// ====================
// 5. Módulo de Evaluación Automática de Intervalos (EA)
// ====================

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
// 6. Funciones para Escalas
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
 * - La parte ascendente se genera con la secuencia seleccionada.
 * - La parte descendente se genera según:
 *   • Si la escala es "melodica": se usa la fórmula del menor natural (sin alteraciones en el descendente).
 *   • En otros casos: se invierte la secuencia ascendente (omitiendo la nota superior).
 * Además, se renderiza un pentagrama con la escala completa usando VexFlow y se muestran las notas con sus accidentales.
 */
function reproducirEscala() {
  if (isScalePlaying) return;
  isScalePlaying = true;
  
  // Detener cualquier reproducción de escala en curso
  scaleTimeouts.forEach(timeoutID => clearTimeout(timeoutID));
  scaleTimeouts = [];
  
  const tipoEscala = document.getElementById('tipoEscala').value;
  let tonalidadRaw = document.getElementById('tonalidadEscala').value;
  if (!tonalidadRaw.includes("/")) {
    tonalidadRaw = tonalidadRaw + "/4";
  }
  const tonalidad = tonalidadRaw.split("/")[0];
  
  const secAsc = obtenerSecuenciaEscala(tipoEscala);
  let secDesc;
  if (tipoEscala === "melodica") {
    secDesc = obtenerSecuenciaEscala("menor");
  } else {
    secDesc = secAsc;
  }
  
  const base = notasBase[tonalidad] || 261.63;
  let frecuenciasAsc = [];
  let tiempoAcumulado = 0;
  let acumulador = 0;
  
  // Ascendente
  reproducirNota(base, 0.8);
  frecuenciasAsc.push(base);
  tiempoAcumulado += 0.9;
  
  for (let i = 0; i < secAsc.length; i++) {
    acumulador += secAsc[i];
    const nuevaFrecuencia = calcularFrecuencia(base, acumulador);
    frecuenciasAsc.push(nuevaFrecuencia);
    let t1 = setTimeout(() => {
      reproducirNota(nuevaFrecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    scaleTimeouts.push(t1);
    tiempoAcumulado += 0.9;
  }
  
  let frecuenciasDesc = [];
  if (tipoEscala === "melodica") {
    let acumuladorDesc = 0;
    frecuenciasDesc.push(base);
    const secMenor = obtenerSecuenciaEscala("menor");
    for (let i = 0; i < secMenor.length; i++) {
      acumuladorDesc += secMenor[i];
      frecuenciasDesc.push(calcularFrecuencia(base, acumuladorDesc));
    }
    frecuenciasDesc.pop();
    frecuenciasDesc = frecuenciasDesc.reverse();
  } else {
    frecuenciasDesc = frecuenciasAsc.slice(0, frecuenciasAsc.length - 1).reverse();
  }
  
  for (let i = 0; i < frecuenciasDesc.length; i++) {
    let t2 = setTimeout(() => {
      reproducirNota(frecuenciasDesc[i], 0.8);
    }, tiempoAcumulado * 1000);
    scaleTimeouts.push(t2);
    tiempoAcumulado += 0.9;
  }
  
  document.getElementById('mensajeEscala').textContent = `Reproduciendo escala ${tipoEscala} en ${tonalidadRaw} (ascendente y descendente)`;
  
  // Renderizar el pentagrama
  renderScaleStaff(tonalidadRaw, tipoEscala, secAsc, secDesc);
  
  const totalTime = tiempoAcumulado * 1000;
  setTimeout(() => {
    isScalePlaying = false;
  }, totalTime);
}

function manejarReproduccionEscala() {
  if (!isScalePlaying) {
    document.getElementById('mensajeEscala').textContent = "";
    reproducirEscala();
  }
}

// ====================
// 7. Funciones para Arpegios
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


function reproducirArpegio() {
  if (isArpeggioPlaying) return;
  isArpeggioPlaying = true;
  
  const tipoArpegio = document.getElementById('tipoArpegio').value;
  let tonalidadRaw = document.getElementById('tonalidadArpegio').value;
  if (!tonalidadRaw.includes("/")) {
    tonalidadRaw = tonalidadRaw + "/4";
  }
  const tonalidad = tonalidadRaw.split("/")[0];
  const secuencia = obtenerSecuenciaArpegio(tipoArpegio);
  const base = notasBase[tonalidad] || 261.63;
  
  let frecuenciasAsc = [];
  let tiempoAcumulado = 0;
  
  secuencia.forEach(intervalo => {
    const frecuencia = calcularFrecuencia(base, intervalo);
    frecuenciasAsc.push(frecuencia);
    setTimeout(() => {
      reproducirNota(frecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 1;
  });
  
  let frecuenciasDesc = frecuenciasAsc.slice(0, frecuenciasAsc.length - 1).reverse();
  for (let i = 0; i < frecuenciasDesc.length; i++) {
    setTimeout(() => {
      reproducirNota(frecuenciasDesc[i], 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 1;
  }
  
  document.getElementById('mensajeArpegio').textContent = `Reproduciendo arpegio ${tipoArpegio} en ${tonalidadRaw} (ascendente y descendente)`;
  
  const totalTime = tiempoAcumulado * 1000;
  setTimeout(() => {
    isArpeggioPlaying = false;
  }, totalTime);
}

function manejarReproducirArpegio() {
  if (!isArpeggioPlaying) {
    document.getElementById('mensajeArpegio').textContent = "";
    reproducirArpegio();
  }
}

function manejarReproduccionArpegio() {
  manejarReproducirArpegio();
}

// ====================
// 8. Funciones para Renderizar el Pentagrama (Escalas) usando VexFlow
// ====================

function renderScaleStaff(tonalidadRaw, tipoEscala, secAsc, secDesc) {
  // Asegurarse de que tonalidadRaw tenga formato "Nota/Octava"
  let tonalidadDisplay = tonalidadRaw.includes("/") ? tonalidadRaw : tonalidadRaw + "/4";
  // Para la armadura, se corrige la tonalidad (por ejemplo, "D#" → "Eb")
  const tonalidadClave = fixKeySignature(tonalidadDisplay.split("/")[0]);
  
  // Generar claves ascendentes
  const keysAsc = generateKeys(tonalidadRaw, secAsc);
  let keysDesc;
  if (tipoEscala === "melodica") {
    keysDesc = generateKeys(tonalidadRaw, obtenerSecuenciaEscala("menor"));
    keysDesc.pop(); // quitar la nota superior
    keysDesc = keysDesc.reverse();
  } else {
    keysDesc = keysAsc.slice(0, keysAsc.length - 1).reverse();
  }
  const keysTotal = keysAsc.concat(keysDesc);
  
  const VF = Vex.Flow;
  const container = document.getElementById("staffContainer");
  if (!container) return;
  container.innerHTML = "";
  
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize(600, 200);
  const context = renderer.getContext();
  context.setFont("Arial", 10, "").setBackgroundFillStyle("#fff");
  
  // Crear pentagrama con clave de sol y armadura
  const stave = new VF.Stave(10, 40, 580);
  stave.addClef("treble").addKeySignature(tonalidadClave).setContext(context).draw();
  
  // Crear notas a partir de keysTotal (duración negra "q")
  const vfNotes = keysTotal.map(key => new VF.StaveNote({ keys: [key], duration: "q" }));
  
  // Agregar accidentals explícitos a las notas
  vfNotes.forEach(note => {
    const key = note.getKeys()[0]; // ej. "D#/4" o "Db/4"
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

// ====================
// 9. Manejo de Tabs
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
// 10. Eventos para actualizar la visualización de la escala al cambiar de selección
// ====================

// Al cambiar el tipo de escala o la tonalidad, detener la reproducción en curso (si la hay)
// y renderizar el pentagrama con la nueva selección.
document.getElementById('tipoEscala').addEventListener('change', () => {
  stopScalePlayback();
  renderScaleStaff(document.getElementById('tonalidadEscala').value, document.getElementById('tipoEscala').value, obtenerSecuenciaEscala(document.getElementById('tipoEscala').value), (document.getElementById('tipoEscala').value==="melodica")? obtenerSecuenciaEscala("menor") : obtenerSecuenciaEscala(document.getElementById('tipoEscala').value));
});
document.getElementById('tonalidadEscala').addEventListener('change', () => {
  stopScalePlayback();
  renderScaleStaff(document.getElementById('tonalidadEscala').value, document.getElementById('tipoEscala').value, obtenerSecuenciaEscala(document.getElementById('tipoEscala').value), (document.getElementById('tipoEscala').value==="melodica")? obtenerSecuenciaEscala("menor") : obtenerSecuenciaEscala(document.getElementById('tipoEscala').value));
});

// Función para detener los timeouts de escala (para detener la reproducción en curso)
function stopScalePlayback() {
  scaleTimeouts.forEach(timeoutID => clearTimeout(timeoutID));
  scaleTimeouts = [];
  isScalePlaying = false;
}

// ====================
// 11. Evento para limpiar el ejercicio de Intervalos al cambiar de nivel
// ====================
document.getElementById('nivelDificultad').addEventListener('change', function() {
  currentInterval = null;
  document.getElementById('opcionesIntervalo').innerHTML = "";
  document.getElementById('mensajeIntervalos').innerHTML = "";
});

// ====================
// 12. Eventos de Botones
// ====================
document.getElementById('btnReproducirIntervalo').addEventListener('click', manejarReproduccionIntervalo);
document.getElementById('btnEvaluarEjecucion').addEventListener('click', evaluateIntervalAuto);
document.getElementById('btnReproducirEscala').addEventListener('click', manejarReproduccionEscala);
document.getElementById('btnReproducirArpegio').addEventListener('click', manejarReproduccionArpegio);

// ====================
// 13. Carga inicial: renderizar el pentagrama de la escala por defecto
// ====================
document.addEventListener("DOMContentLoaded", () => {
  // Por defecto se muestra la escala según los valores iniciales de los selects
  const tipo = document.getElementById('tipoEscala').value;
  const tonalidad = document.getElementById('tonalidadEscala').value;
  renderScaleStaff(tonalidad, tipo, obtenerSecuenciaEscala(tipo), (tipo==="melodica")? obtenerSecuenciaEscala("menor") : obtenerSecuenciaEscala(tipo));
});
