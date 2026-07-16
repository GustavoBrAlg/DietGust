const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dietgust_fallback_secret_key';

// 1. Registro de Usuário
router.post('/register', async (req, res) => {
  const { email, nome, idade, senha } = req.body;

  if (!email || !nome || !idade || !senha) {
    return res.status(400).json({ error: 'Todos os campos (email, nome, idade, senha) são obrigatórios.' });
  }

  try {
    // Verificar se usuário já existe
    const userCheck = await db.query('SELECT email FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    // Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Inserir no banco
    await db.query(
      'INSERT INTO usuarios (email, nome, idade, senha_hash) VALUES ($1, $2, $3, $4)',
      [email.toLowerCase().trim(), nome.trim(), parseInt(idade), senhaHash]
    );

    // Gerar JWT
    const token = jwt.sign({ email: email.toLowerCase().trim() }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: { email: email.toLowerCase().trim(), nome: nome.trim() }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao criar usuário.' });
  }
});

// 2. Login de Usuário
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const userRes = await db.query('SELECT email, nome, senha_hash FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    const user = userRes.rows[0];
    
    // Validar senha
    const isMatch = await bcrypt.compare(senha, user.senha_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Gerar JWT
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: { email: user.email, nome: user.nome }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor ao autenticar.' });
  }
});

// 3. Obter perfil do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query('SELECT email, nome, idade, criado_em FROM usuarios WHERE email = $1', [req.user.email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json(userRes.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do perfil.' });
  }
});

module.exports = router;
