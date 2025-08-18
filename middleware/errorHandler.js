import { PrismaClientKnownRequestError } from '../generated/prisma/runtime/library.js';

function errorHandler(error, req, res, next) {
    const status = error.status || 500;
    const code = error.code || 'internal_error';
    const message = error.message || 'Error interno del servidor.';

    if (error instanceof PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2001':
                return res.status(404).json({
                    error: 'Registro no encontrado.',
                    code: 'record_not_found'
                });
            case 'P2002':
                return res.status(409).json({
                    error: 'Restricción de unicidad fallida.',
                    code: 'unique_constraint'
                });
            case 'P2003':
                return res.status(400).json({
                    error: 'Restricción de clave foránea fallida.',
                    code: 'foreign_key_violation'
                });
            case 'P2025':
                return res.status(404).json({
                    error: 'No se pudo encontrar el registro para actualizar.',
                    code: 'update_record_not_found'
                });
            default:
                return res.status(400).json({
                    error: 'Error de solicitud a la base de datos.',
                    code: error.code
                });
        }
    }

    res.status(status).json({
        error: message,
        code: code
    });
}

export { errorHandler };
