const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const tokenHeader = req.header('Authorization');

    // Si no hay token, lo rebotamos en la puerta
    if (!tokenHeader) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere iniciar sesión.' });
    }

    try {
        const tokenLimpio = tokenHeader.replace('Bearer ', '');
        
        // Verificamos que el token sea auténtico usando nuestra clave secreta
        const verificado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);
        
        // Guardamos los datos del usuario logueado (id y rol) en la request por si el controlador los necesita
        req.usuario = verificado; 
    
        next(); 
    } catch (error) {
        // Si el token es falso o pasaron la hora, lo rebotamos
        res.status(401).json({ error: 'Token inválido o expirado. Vuelva a iniciar sesión.' });
    }
};

module.exports = { verificarToken };