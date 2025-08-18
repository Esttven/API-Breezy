import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { pathToFileURL } from 'url';

// Cargar variables de entorno
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Importar controladores dinámicamente
const controllersPath = path.join(import.meta.dirname, 'controllers');

if (fs.existsSync(controllersPath)) {
    const controllerFiles = fs.readdirSync(controllersPath).filter(file => file.endsWith('.js'));

    for (const file of controllerFiles) {
        try {
            const filePath = path.join(controllersPath, file);
            const fileURL = pathToFileURL(filePath).href;
            const controllerModule = await import(fileURL);
            const controller = controllerModule.default;
            app.use('/api', controller);
            console.log(`✓ Controlador cargado: ${file}`);
        } catch (error) {
            console.error(`✗ Error cargando controlador ${file}:`, error.message);
        }
    }
} else {
    console.warn('Directorio de controladores no encontrado:', controllersPath);
}

// Ruta base
app.get('/api', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Backend ejecutándose en http://localhost:${PORT}`);
});

// Manejo de errores
app.use(errorHandler);
