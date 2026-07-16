require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Erro: A variável de ambiente DATABASE_URL não está configurada.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    const email = 'teste@teste.com';
    const senhaLimpa = 'Teste@123';
    
    console.log(`Verificando se o usuário de teste (${email}) já existe...`);
    const checkRes = await client.query('SELECT email FROM usuarios WHERE email = $1', [email]);

    if (checkRes.rows.length > 0) {
      console.log('ℹ️ O usuário de teste já existe no banco de dados.');
    } else {
      console.log('Gerando hash da senha...');
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senhaLimpa, salt);

      console.log('Inserindo o usuário de teste...');
      await client.query(
        'INSERT INTO usuarios (email, nome, idade, senha_hash) VALUES ($1, $2, $3, $4)',
        [email, 'Usuário de Teste', 28, senhaHash]
      );
      console.log(`✅ Usuário de teste cadastrado com sucesso!`);
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${senhaLimpa}`);
    }
  } catch (err) {
    console.error('❌ Erro ao semear o banco de dados:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
