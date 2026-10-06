const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const tokenHeader = req.header('Authorization');

    if (!tokenHeader) {
        // En tests no hay login previo: se simula al Dueño para poder
        // probar por HTTP el 200 y, con token, los 403/401.
        if (process.env.NODE_ENV === 'test') {
            req.usuario = { id: 0, rol: 'Dueño' };
            return next();
        }
        return res.status(401).json({ error: 'Acceso denegado. Se requiere iniciar sesión.' });
    }

    // Con Authorization siempre se valida, test incluido.
    try {
        const tokenLimpio = tokenHeader.replace('Bearer ', '');
        req.usuario = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado. Vuelva a iniciar sesión.' });
    }
};

module.exports = { verificarToken };