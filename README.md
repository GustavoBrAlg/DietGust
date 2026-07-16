# DietGust — PWA de Dietas e Treinos com IA

DietGust é um Progress Web App (PWA) completo e responsivo projetado com foco em dispositivos Android (Material Design), que gera rotinas de treinos e planos alimentares dinâmicos de segunda a sexta-feira, personalizados com base no seu peso, altura e metas de condicionamento físico (Hipertrofia ou Definição) utilizando Inteligência Artificial.

O projeto foi construído utilizando Node.js vanilla com Express no backend, Supabase (PostgreSQL) para persistência transacional dos planos estruturados, e o Vercel AI SDK para a orquestração do modelo de IA.

---

## 🚀 Tecnologias e Infraestrutura
*   **Backend:** Node.js vanilla, Express (para rotas da API)
*   **Database:** Supabase (Postgres) — Único banco de dados do sistema, modelado relacionalmente para suportar dados dinâmicos.
*   **IA Generativa:** Vercel AI SDK (Google Gemini gemini-1.5-flash).
*   **Frontend:** HTML5, CSS3 vanilla (Material Design HSL), Javascript Moderno (Vanilla).
*   **PWA:** `manifest.json` com ícones, `sw.js` com cache offline básico (shell do app) e aviso customizado de instalação.
*   **Hospedagem & Deploy:** GitHub e Vercel Serverless Functions.

---

## 🛠️ Configuração e Instalação Local

Siga as etapas abaixo para rodar a aplicação em ambiente de desenvolvimento local:

### 1. Clonar o Repositório
```bash
git clone https://github.com/GustavoBrAlg/DietGust.git
cd DietGust
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` na raiz do projeto:
```bash
cp .env.example .env
```
Abra o arquivo `.env` e preencha as variáveis com suas chaves de acesso correspondentes:
*   `DATABASE_URL`: String de conexão Postgres do seu projeto no Supabase (use a versão do Pooler na porta `6543` para Serverless/Local).
*   `JWT_SECRET`: Uma chave secreta qualquer de sua preferência para assinar os tokens das sessões.
*   `OPENAI_API_KEY`: Sua chave de API da OpenAI (utilizada pelo Vercel AI SDK).

### 4. Configurar a Estrutura de Tabelas (SQL)
Para criar todas as tabelas necessárias no Supabase de forma automatizada, execute o script utilitário de Setup:
```bash
npm run setup-db
```
*(Caso prefira fazer manualmente, as queries de criação de tabelas estão descritas no arquivo `database.sql` na raiz, prontas para serem copiadas e coladas no SQL Editor do painel do Supabase)*.

### 5. Cadastrar Usuário de Teste (Seeder)
Para validar o fluxo de autenticação local e em produção, você pode rodar o seeder para criar um usuário inicial padrão:
```bash
npm run seed
```
Este script cadastrará o seguinte usuário no banco:
*   **Email:** `teste@teste.com`
*   **Senha:** `Teste@123`

### 6. Executar o Servidor Local
Para rodar o app localmente:
```bash
npm run dev
```
O servidor estará rodando em [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deploy na Vercel

O projeto está configurado para deploy automático na Vercel com suporte completo para as rotas do backend em Serverless Functions (`/api/*`) e arquivos estáticos do frontend.

Para que tudo funcione corretamente em produção, certifique-se de configurar as seguintes **Environment Variables** no dashboard do seu projeto na Vercel:
1.  `SUPABASE_URL` (URL da API REST do Supabase)
2.  `SUPABASE_SERVICE_ROLE_KEY` (Chave Service Role do Supabase)
3.  `JWT_SECRET` (A chave secreta de criptografia JWT)
4.  `GEMINI_API_KEY` (Chave de acesso à API do Google Gemini)

---

## 🔒 Segurança de Credenciais
*   **Nunca** inclua segredos ou conexões hardcoded no código fonte.
*   O arquivo `.env` está devidamente listado no `.gitignore` para impedir que chaves sensíveis sejam versionadas.
*   Utilize o arquivo `.env.example` para documentar novas variáveis que venham a ser adicionadas ao projeto.
