const exigirRol = (...roles) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'Acceso denegado. Se requiere iniciar sesión.' });
  }

  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({
      error: `Se requiere uno de estos roles: ${roles.join(', ')}.`
    });
  }

  next();
};

module.exports = { exigirRol };