// helpers/eventEmitter.js

// 1) Importamos las librerías necesarias
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

// 2) Creamos el emisor de eventos (sujeto del patrón Observer)
const emitter = new EventEmitter();

// 3) Definimos la ruta y archivo de log (log.txt dentro de carpeta 'logs')
const logsFolder = path.join(process.cwd(), 'logs');
const logFilePath = path.join(logsFolder, 'log.txt');

// Aseguramos que la carpeta de logs exista
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder);
}

// 4) Función para escribir entradas en el log
//    Toma el nombre del evento y los datos asociados
function writeLog(eventName, payload) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} [${eventName}] ${JSON.stringify(payload)}\n`;
  fs.appendFileSync(logFilePath, logEntry);
}

// 5) Suscribimos los listeners (observadores) de forma explícita

// Listener: ocurre cuando se crea una propiedad
emitter.on('propertyCreated', function(propiedad) {
  // En payload pasamos únicamente lo esencial
  writeLog('propertyCreated', {
    id: propiedad.id,
    titulo: propiedad.titulo
  });
});

// Listener: ocurre cuando se elimina una propiedad
emitter.on('propertyDeleted', function(propiedad) {
  writeLog('propertyDeleted', {
    id: propiedad.id,
    titulo: propiedad.titulo
  });
});

// Listener: ocurre cuando un usuario inicia sesión
emitter.on('userLoggedIn', function(usuario) {
  writeLog('userLoggedIn', {
    email: usuario.email,
    nombre: usuario.nombre
  });
});

// 6) Exportamos el emisor para usarlo en cualquier controlador
export default emitter;
