require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Erro: A variável de ambiente DATABASE_URL não está configurada.');
    console.error('Copie o arquivo .env.example para .env e preencha com a string de conexão do Supabase.');
    process.exit(1);
  }

  console.log('Conectando ao Supabase para configurar as tabelas...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    const sqlPath = path.join(__dirname, '..', 'database.sql');
    console.log(`Lendo o arquivo SQL em: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executando o script DDL no banco de dados...');
    await client.query(sql);
    console.log('✅ Estrutura do banco de dados configurada com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao configurar o banco de dados:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
