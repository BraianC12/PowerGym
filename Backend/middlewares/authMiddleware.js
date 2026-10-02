const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // Si estamos corriendo tests automáticos, permitimos el paso libre
    if (process.env.NODE_ENV === 'test') {
        return next();
    }

    const tokenHeader = req.header('Authorization');

    if (!tokenHeader) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere iniciar sesión.' });
    }

    try {
        const tokenLimpio = tokenHeader.replace('Bearer ', '');
        const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        req.usuario = verificado; 
        next(); 
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado. Vuelva a iniciar sesión.' });
    }
};

module.exports = { verificarToken };