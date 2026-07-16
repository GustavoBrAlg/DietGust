const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dietgust_fallback_secret_key';

// 1. Registro de Usuário
router.post('/register', async (req, res) => {
  const { email, nome, idade, senha } = req.body;

  if (!email || !nome || !idade || !senha) {
    return res.status(400).json({ error: 'Todos os campos (email, nome, idade, senha) são obrigatórios.' });
  }

  try {
    const formattedEmail = email.toLowerCase().trim();

    // Verificar se usuário já existe
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', formattedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Erro ao verificar usuário existente:', checkError);
      return res.status(500).json({ error: 'Erro ao conectar ao banco de dados.' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    // Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Inserir no banco
    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        email: formattedEmail,
        nome: nome.trim(),
        idade: parseInt(idade),
        senha_hash: senhaHash
      });

    if (insertError) {
      console.error('Erro ao inserir usuário:', insertError);
      return res.status(500).json({ error: 'Erro ao cadastrar usuário no banco de dados.' });
    }

    // Gerar JWT
    const token = jwt.sign({ email: formattedEmail }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: { email: formattedEmail, nome: nome.trim() }
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
    const formattedEmail = email.toLowerCase().trim();

    const { data: user, error: fetchError } = await supabase
      .from('usuarios')
      .select('email, nome, senha_hash')
      .eq('email', formattedEmail)
      .maybeSingle();

    if (fetchError || !user) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos.' });
    }

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
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('email, nome, idade, criado_em')
      .eq('email', req.user.email)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do perfil.' });
  }
});

module.exports = router;
