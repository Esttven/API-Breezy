function ensureRecordExists(record, message = 'Registro no encontrado', code = 'not_found') {
    if (!record || (Array.isArray(record) && record.length === 0)) {
        const error = new Error(message);
        error.status = 404;
        error.code = code;
        throw error;
    }
}
export { ensureRecordExists };
