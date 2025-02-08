// ====================
// Funciones de Audio
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

// ====================
// Módulo de Intervalos
// ====================

// Conjuntos de intervalos
const intervalosFacil = [
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

// Variables para el módulo de intervalos
let currentInterval = null;
let aciertosIntervalo = 0;
let fallosIntervalo = 0;

/**
 * Devuelve el conjunto de intervalos según el nivel seleccionado.
 */
function obtenerIntervalos() {
  const nivel = document.getElementById('nivelDificultad').value;
  if (nivel === 'facil') return intervalosFacil;
  else if (nivel === 'dificil') return intervalosDificil;
  else return intervalosMedio;
}

/**
 * Genera un nuevo intervalo y lo almacena en currentInterval.
 */
function generarNuevoIntervalo() {
  const disponibles = obtenerIntervalos();
  const indice = Math.floor(Math.random() * disponibles.length);
  const intervaloCorrecto = disponibles[indice];
  
  // Para el intervalo se elige una nota base aleatoria
  let minBase, maxBase;
  const nivel = document.getElementById('nivelDificultad').value;
  if(nivel === 'facil'){
    minBase = 300; maxBase = 500;
  } else if(nivel === 'dificil'){
    minBase = 110; maxBase = 800;
  } else {
    minBase = 220; maxBase = 700;
  }
  const maxAjustado = Math.min(maxBase, 1000 / Math.pow(2, intervaloCorrecto.semitonos / 12));
  const baseFrecuencia = minBase + Math.random() * (maxAjustado - minBase);
  const segundaFrecuencia = calcularFrecuencia(baseFrecuencia, intervaloCorrecto.semitonos);
  
  currentInterval = { intervaloCorrecto, baseFrecuencia, segundaFrecuencia };
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
 * Mezcla un array usando Fisher-Yates.
 */
function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * (Opcional) Genera y muestra las opciones de respuesta para el intervalo.
 */
function mostrarOpcionesIntervalo() {
  const contenedor = document.getElementById('opcionesIntervalo');
  contenedor.innerHTML = "";
  const disponibles = obtenerIntervalos();
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
 * Verifica la respuesta en el módulo de intervalos.
 */
function verificarRespuestaIntervalo(opcionSeleccionada) {
  const mensaje = document.getElementById('mensajeIntervalo');
  if (opcionSeleccionada.semitonos === currentInterval.intervaloCorrecto.semitonos) {
    mensaje.textContent = "¡Correcto!";
    mensaje.style.color = "green";
    aciertosIntervalo++;
  } else {
    mensaje.textContent = `Incorrecto. Era: ${currentInterval.intervaloCorrecto.nombre}`;
    mensaje.style.color = "red";
    fallosIntervalo++;
  }
  document.getElementById('opcionesIntervalo').innerHTML = "";
  actualizarEstadisticasIntervalo();
  currentInterval = null;
}

/**
 * Actualiza las estadísticas del módulo de intervalos.
 */
function actualizarEstadisticasIntervalo() {
  document.getElementById('aciertosIntervalo').textContent = aciertosIntervalo;
  document.getElementById('fallosIntervalo').textContent = fallosIntervalo;
}

/**
 * Maneja la acción del botón de intervalo.
 * Si no hay un intervalo activo, genera uno nuevo y lo reproduce (luego de 2.5 s se pueden mostrar opciones).
 * Si ya existe, simplemente lo reproduce de nuevo.
 */
function manejarReproduccionIntervalo() {
  document.getElementById('mensajeIntervalo').textContent = "";
  if (!currentInterval) {
    generarNuevoIntervalo();
    reproducirIntervaloActual();
    // Opcional: setTimeout(mostrarOpcionesIntervalo, 2500);
  } else {
    reproducirIntervaloActual();
  }
}

// ====================
// Módulo de Evaluación de Intervalos (detección de ambas notas de forma automática)
// ====================

// Variables para almacenar los pitches detectados
let detectedPitch1 = null;
let detectedPitch2 = null;

/**
 * Inicia la detección de pitch usando el micrófono y el AnalyserNode.
 * Durante 'duration' segundos se recogen las detecciones, al final se calcula la media y se llama al callback.
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
      
      // Cuenta atrás visual
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
 * Basado en el ejemplo de Chris Wilson (https://webaudiodemos.appspot.com/pitchdetect/)
 */
function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) // señal demasiado débil
    return -1;
    
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
  while (c[d] > c[d+1])
    d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;
  // Parabolic interpolation
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a)
    T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

/**
 * Función que evalúa automáticamente la ejecución del intervalo.
 * El flujo es:
 * 1. Mostrar mensaje: "Toca la primera nota en 3 segundos..."
 * 2. Inicia la detección de la primera nota durante 3 segundos.
 * 3. Una vez finalizada, muestra el valor detectado y un mensaje para la segunda nota.
 * 4. Inicia la detección de la segunda nota durante 3 segundos.
 * 5. Calcula el intervalo y da feedback.
 */
function evaluateIntervalAuto() {
  const mensajeEval = document.getElementById('mensajeEvaluacion');
  mensajeEval.style.color = "black";
  mensajeEval.textContent = "Toca la PRIMERA nota del intervalo durante 3 segundos...";
  
  startPitchDetection(3, function(pitch1) {
    if (!pitch1) {
      mensajeEval.textContent = "No se pudo detectar la primera nota.";
      mensajeEval.style.color = "red";
      return;
    }
    detectedPitch1 = pitch1;
    mensajeEval.textContent = `Primera nota detectada: ${pitch1.toFixed(2)} Hz. Ahora toca la SEGUNDA nota durante 3 segundos...`;
    // Pequeña pausa antes de la segunda detección (opcional)
    setTimeout(() => {
      startPitchDetection(3, function(pitch2) {
        if (!pitch2) {
          mensajeEval.textContent = "No se pudo detectar la segunda nota.";
          mensajeEval.style.color = "red";
          return;
        }
        detectedPitch2 = pitch2;
        // Calcular el intervalo en semitonos
        const detectedInterval = 12 * Math.log2(detectedPitch2 / detectedPitch1);
        const expectedInterval = currentInterval ? currentInterval.intervaloCorrecto.semitonos : null;
        if (!expectedInterval) {
          mensajeEval.textContent = "No hay un intervalo generado para comparar.";
          mensajeEval.style.color = "black";
          return;
        }
        const tolerance = 0.5; // ±0.5 semitonos
        if (Math.abs(detectedInterval - expectedInterval) <= tolerance) {
          mensajeEval.textContent = `¡Correcto! Intervalo detectado: ${detectedInterval.toFixed(2)} semitonos (esperado: ${expectedInterval}).`;
          mensajeEval.style.color = "green";
          aciertosIntervalo++;
        } else {
          mensajeEval.textContent = `Incorrecto. Intervalo detectado: ${detectedInterval.toFixed(2)} semitonos (esperado: ${expectedInterval}).`;
          mensajeEval.style.color = "red";
          fallosIntervalo++;
        }
        actualizarEstadisticasIntervalo();
      });
    }, 500); // pausa de 0.5 segundos entre detecciones
  });
}

// ====================
// Módulo de Escalas
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

/**
 * Dado un tipo de escala, devuelve la secuencia de intervalos en semitonos.
 * Se añaden:
 *   - "armonica": [2,1,2,2,1,3,1] (menor armónica)
 *   - "melodica": [2,1,2,2,2,2,1] (menor melódica ascendente)
 *   - "oriental": [1,3,1,2,1,2,2] (variante del Hijaz)
 *   - "pentatonica": [2,2,3,2,3]
 */
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
 * Reproduce una escala en secuencia.
 */
function reproducirEscala() {
  const tipoEscala = document.getElementById('tipoEscala').value;
  const tonalidad = document.getElementById('tonalidadEscala').value;
  const secuencia = obtenerSecuenciaEscala(tipoEscala);
  const base = notasBase[tonalidad] || 261.63;
  
  let tiempoAcumulado = 0;
  let acumulador = 0;
  
  // Reproduce la nota base
  reproducirNota(base, 0.8);
  tiempoAcumulado += 0.9;
  
  // Reproduce cada nota de la escala sumando los intervalos
  for (let i = 0; i < secuencia.length; i++) {
    acumulador += secuencia[i];
    const nuevaFrecuencia = calcularFrecuencia(base, acumulador);
    setTimeout(() => {
      reproducirNota(nuevaFrecuencia, 0.8);
    }, tiempoAcumulado * 1000);
    tiempoAcumulado += 0.9;
  }
  
  const mensaje = document.getElementById('mensajeEscala');
  mensaje.textContent = `Reproduciendo escala ${tipoEscala} en ${tonalidad}`;
}

/**
 * Maneja la acción del botón de escala.
 */
function manejarReproduccionEscala() {
  document.getElementById('mensajeEscala').textContent = "";
  reproducirEscala();
}

// ====================
// Módulo de Arpegios
// ====================

/**
 * Dado un tipo de acorde, devuelve la secuencia de intervalos para arpegio.
 */
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
 * Reproduce un arpegio.
 */
function reproducirArpegio() {
  const tipoArpegio = document.getElementById('tipoArpegio').value;
  const tonalidad = document.getElementById('tonalidadArpegio').value;
  const secuencia = obtenerSecuenciaArpegio(tipoArpegio);
  const base = notasBase[tonalidad] || 261.63;
  
  let tiempoAcumulado = 0;
  secuencia.forEach(intervalo => {
    const frecuencia = calcularFrecuencia(base, intervalo);
    setTimeout(() => reproducirNota(frecuencia, 0.8), tiempoAcumulado * 1000);
    tiempoAcumulado += 1;
  });
  
  const mensaje = document.getElementById('mensajeArpegio');
  mensaje.textContent = `Reproduciendo arpegio ${tipoArpegio} en ${tonalidad}`;
}

/**
 * Maneja la acción del botón de arpegio.
 */
function manejarReproduccionArpegio() {
  document.getElementById('mensajeArpegio').textContent = "";
  reproducirArpegio();
}

// ====================
// Manejo de Tabs (navegación entre módulos)
// ====================
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Quitar clase 'active' a todos
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Activar el botón y contenido correspondiente
    button.classList.add('active');
    document.getElementById(button.getAttribute('data-tab')).classList.add('active');
  });
});

// ====================
// Eventos de botones
// ====================
document.getElementById('btnReproducirIntervalo').addEventListener('click', manejarReproduccionIntervalo);
document.getElementById('btnEvaluarEjecucion').addEventListener('click', evaluateIntervalAuto);
document.getElementById('btnReproducirEscala').addEventListener('click', manejarReproduccionEscala);
document.getElementById('btnReproducirArpegio').addEventListener('click', manejarReproduccionArpegio);
