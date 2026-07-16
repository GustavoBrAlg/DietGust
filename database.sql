-- Script SQL de Criação de Tabelas para o Supabase (Postgres)
-- Execute este script no editor SQL do painel do Supabase ou via npm run setup-db.

-- Habilitar extensão UUID caso não esteja ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    email TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    idade INTEGER NOT NULL,
    senha_hash TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Planos (Cabeçalho do Plano)
CREATE TABLE IF NOT EXISTS planos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_usuario TEXT REFERENCES usuarios(email) ON DELETE CASCADE NOT NULL,
    objetivo TEXT NOT NULL CHECK (objetivo IN ('ganhar_massa', 'definicao_muscular')),
    altura_cm NUMERIC NOT NULL,
    peso_kg NUMERIC NOT NULL,
    imc NUMERIC NOT NULL,
    classificacao_imc TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Dias de Treino
CREATE TABLE IF NOT EXISTS treino_dias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plano_id UUID REFERENCES planos(id) ON DELETE CASCADE NOT NULL,
    dia_semana TEXT NOT NULL CHECK (dia_semana IN ('segunda', 'terca', 'quarta', 'quinta', 'sexta')),
    UNIQUE (plano_id, dia_semana)
);

-- 4. Tabela de Sessões/Exercícios de Treino (Dinâmico)
CREATE TABLE IF NOT EXISTS treino_sessoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treino_dia_id UUID REFERENCES treino_dias(id) ON DELETE CASCADE NOT NULL,
    exercicio TEXT NOT NULL,
    series INTEGER NOT NULL,
    repeticoes TEXT NOT NULL,
    observacao TEXT DEFAULT '',
    ordem INTEGER NOT NULL
);

-- 5. Tabela de Dias de Plano Alimentar
CREATE TABLE IF NOT EXISTS plano_alimentar_dias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plano_id UUID REFERENCES planos(id) ON DELETE CASCADE NOT NULL,
    dia_semana TEXT NOT NULL CHECK (dia_semana IN ('segunda', 'terca', 'quarta', 'quinta', 'sexta')),
    UNIQUE (plano_id, dia_semana)
);

-- 6. Tabela de Refeições (Dinâmico)
CREATE TABLE IF NOT EXISTS refeicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plano_alimentar_dia_id UUID REFERENCES plano_alimentar_dias(id) ON DELETE CASCADE NOT NULL,
    nome_refeicao TEXT NOT NULL,
    horario_sugerido TEXT NOT NULL,
    alimentos TEXT[] NOT NULL, -- Array nativo Postgres para listar alimentos de forma flexível
    observacao TEXT DEFAULT '',
    ordem INTEGER NOT NULL
);
