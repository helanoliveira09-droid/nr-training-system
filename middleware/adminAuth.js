// Protege rotas de escrita (POST/PUT/DELETE) exigindo o header x-admin-token
// com o mesmo valor de ADMIN_PASSWORD definido no ambiente do servidor.
module.exports = function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Acesso negado. Entre no modo Administrador para editar dados.' });
  }
  next();
};
