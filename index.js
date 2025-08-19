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

// Health check endpoint for Oracle Cloud load balancer
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Middleware para manejo de errores
app.use(errorHandler);

// Iniciar el servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Health check disponible en: http://0.0.0.0:${PORT}/api/health`);
});

// Manejar promesas no capturadas
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => {
        process.exit(1);
    });
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Cierre en SIGTERN (para Docker)
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Cierre en SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Manejo de errores
app.use(errorHandler);
