const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parsing cookies manually (cookie-parser is optional, we can do basic header parsing or support token in header/body)
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length === 2) {
        req.cookies[parts[0].trim()] = parts[1].trim();
      }
    });
  }
  next();
});

// Import Rotas
const authRoutes = require('./routes/auth');
const plansRoutes = require('./routes/plans');

// Registrar Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/plans', plansRoutes);

// Rota temporária de debug para listar chaves das variáveis de ambiente na Vercel
app.get('/api/debug-env', (req, res) => {
  res.json({
    keys: Object.keys(process.env).filter(k => !k.includes('TOKEN') && !k.includes('KEY') && !k.includes('SECRET') && !k.includes('PASS'))
  });
});

// Servir arquivos estáticos do frontend (para desenvolvimento local)
// Nota: Na Vercel, o roteamento do vercel.json mapeia os estáticos da pasta /public automaticamente
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback para SPA (caso acesse rotas inexistentes, envia index.html do frontend)
app.get('*', (req, res, next) => {
  // Se for uma rota de API que não existe, retorna 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint não encontrado.' });
  }
  // Caso contrário, serve o frontend
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Tratamento centralizado de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado na aplicação:', err);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

// Inicialização (apenas local. Na Vercel, o app é exportado como Serverless Function)
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando localmente na porta http://localhost:${PORT}`);
  });
}

// Exportar o app para a Vercel
module.exports = app;
