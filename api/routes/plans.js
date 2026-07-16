const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { generateObject } = require('ai');
const { openai } = require('@ai-sdk/openai');
const { z } = require('zod');

// Schema de Validação de Geração de Planos via IA (Zod)
const planSchema = z.object({
  treino_semanal: z.array(
    z.object({
      dia_semana: z.enum(['segunda', 'terca', 'quarta', 'quinta', 'sexta']),
      exercicios: z.array(
        z.object({
          exercicio: z.string(),
          series: z.number().int().positive(),
          repeticoes: z.string(),
          observacao: z.string().optional()
        })
      )
    })
  ),
  plano_alimentar: z.array(
    z.object({
      dia_semana: z.enum(['segunda', 'terca', 'quarta', 'quinta', 'sexta']),
      refeicoes: z.array(
        z.object({
          nome_refeicao: z.string(),
          horario_sugerido: z.string(),
          alimentos: z.array(z.string()),
          observacao: z.string().optional()
        })
      )
    })
  )
});

// Helper para calcular Classificação do IMC
function getClassificacaoIMC(imc) {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidade';
}

// 1. Gerar e salvar novo plano (IA + Transação SQL)
router.post('/generate', authMiddleware, async (req, res) => {
  const { altura_cm, peso_kg, objetivo } = req.body;

  if (!altura_cm || !peso_kg || !objetivo) {
    return res.status(400).json({ error: 'Altura, peso e objetivo são obrigatórios.' });
  }

  const altura = parseFloat(altura_cm);
  const peso = parseFloat(peso_kg);

  if (isNaN(altura) || isNaN(peso) || altura <= 0 || peso <= 0) {
    return res.status(400).json({ error: 'Altura e peso devem ser valores numéricos válidos maiores que zero.' });
  }

  if (objetivo !== 'ganhar_massa' && objetivo !== 'definicao_muscular') {
    return res.status(400).json({ error: 'Objetivo inválido. Use "ganhar_massa" ou "definicao_muscular".' });
  }

  // 1. Calcular IMC
  const imc = parseFloat((peso / ((altura / 100) ** 2)).toFixed(2));
  const classificacao = getClassificacaoIMC(imc);

  try {
    // 2. Chamar a IA (Vercel AI SDK)
    console.log(`Gerando plano via IA para: Objetivo=${objetivo}, IMC=${imc} (${classificacao})`);
    
    const promptText = `
      Você é um personal trainer e nutricionista profissional focado em treinos e dietas de alta performance para Android.
      Crie um plano completo de treinos e dieta personalizado de segunda a sexta-feira para um usuário com o objetivo de: ${objetivo === 'ganhar_massa' ? 'Ganhar Massa Muscular/Hipertrofia' : 'Definição Muscular/Perda de Gordura Controlada'}.
      Informações do usuário:
      - Peso: ${peso} kg
      - Altura: ${altura} cm
      - IMC: ${imc} (${classificacao})

      Regras:
      1. Os treinos semanais devem ser divididos de segunda a sexta-feira. Sugira exercícios coerentes (por exemplo, foco em força e cargas progressivas para ganhar massa, ou volume e treinos associados a cardio para definição). A quantidade de exercícios por dia é livre (dinâmica).
      2. O plano alimentar deve cobrir de segunda a sexta-feira. Para ganhar massa sugira superávit calórico e mais proteínas. Para definição muscular sugira déficit calórico controlado. A quantidade de refeições por dia é livre (dinâmica).
      3. Forneça alimentos fáceis e práticos, divididos em arrays de itens (ex: ["2 bananas", "30g aveia", "1 scoop whey"]).
    `;

    // Chamando o modelo de forma resiliente
    let planData;
    try {
      const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: planSchema,
        prompt: promptText
      });
      planData = object;
    } catch (aiErr) {
      console.error('Erro na chamada da IA (OpenAI):', aiErr);
      return res.status(502).json({ error: 'Erro de comunicação com a Inteligência Artificial. Por favor, verifique a chave de API.' });
    }

    // 3. Persistência Transacional no Banco
    const pgClient = await db.pool.connect();
    try {
      await pgClient.query('BEGIN');

      // Inserir cabeçalho do plano
      const planRes = await pgClient.query(
        `INSERT INTO planos (email_usuario, objetivo, altura_cm, peso_kg, imc, classificacao_imc) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [req.user.email, objetivo, altura, peso, imc, classificacao]
      );
      const planoId = planRes.rows[0].id;

      // Inserir treinos
      for (const tDia of planData.treino_semanal) {
        const tDiaRes = await pgClient.query(
          `INSERT INTO treino_dias (plano_id, dia_semana) VALUES ($1, $2) RETURNING id`,
          [planoId, tDia.dia_semana]
        );
        const tDiaId = tDiaRes.rows[0].id;

        for (let i = 0; i < tDia.exercicios.length; i++) {
          const ex = tDia.exercicios[i];
          await pgClient.query(
            `INSERT INTO treino_sessoes (treino_dia_id, exercicio, series, repeticoes, observacao, ordem) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [tDiaId, ex.exercicio, ex.series, ex.repeticoes, ex.observacao || '', i + 1]
          );
        }
      }

      // Inserir plano alimentar
      for (const aDia of planData.plano_alimentar) {
        const aDiaRes = await pgClient.query(
          `INSERT INTO plano_alimentar_dias (plano_id, dia_semana) VALUES ($1, $2) RETURNING id`,
          [planoId, aDia.dia_semana]
        );
        const aDiaId = aDiaRes.rows[0].id;

        for (let i = 0; i < aDia.refeicoes.length; i++) {
          const refItem = aDia.refeicoes[i];
          await pgClient.query(
            `INSERT INTO refeicoes (plano_alimentar_dia_id, nome_refeicao, horario_sugerido, alimentos, observacao, ordem) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [aDiaId, refItem.nome_refeicao, refItem.horario_sugerido, refItem.alimentos, refItem.observacao || '', i + 1]
          );
        }
      }

      await pgClient.query('COMMIT');
      
      res.status(201).json({
        message: 'Plano gerado e salvo com sucesso!',
        plano_id: planoId,
        imc,
        classificacao_imc: classificacao
      });
    } catch (dbErr) {
      await pgClient.query('ROLLBACK');
      console.error('Erro na transação de banco de dados:', dbErr);
      res.status(500).json({ error: 'Erro ao persistir o plano no banco de dados.' });
    } finally {
      pgClient.release();
    }
  } catch (err) {
    console.error('Erro geral ao processar plano:', err);
    res.status(500).json({ error: 'Erro ao gerar o plano de treino/dieta.' });
  }
});

// 2. Listar histórico de planos do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const plansRes = await db.query(
      `SELECT id, objetivo, altura_cm, peso_kg, imc, classificacao_imc, criado_em 
       FROM planos WHERE email_usuario = $1 ORDER BY criado_em DESC`,
      [req.user.email]
    );
    res.json(plansRes.rows);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro ao carregar histórico.' });
  }
});

// 3. Obter detalhes estruturados de um plano específico (com JOINs)
router.get('/:id', authMiddleware, async (req, res) => {
  const planoId = req.params.id;

  try {
    // Buscar cabeçalho do plano
    const planRes = await db.query(
      `SELECT id, email_usuario, objetivo, altura_cm, peso_kg, imc, classificacao_imc, criado_em 
       FROM planos WHERE id = $1`,
      [planoId]
    );

    if (planRes.rows.length === 0) {
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    const plano = planRes.rows[0];

    // Verificar se pertence ao usuário
    if (plano.email_usuario !== req.user.email) {
      return res.status(403).json({ error: 'Acesso negado. Este plano pertence a outro usuário.' });
    }

    // Buscar treinos (dias + sessões)
    const treinosRes = await db.query(
      `SELECT td.dia_semana, ts.exercicio, ts.series, ts.repeticoes, ts.observacao, ts.ordem
       FROM treino_dias td
       JOIN treino_sessoes ts ON ts.treino_dia_id = td.id
       WHERE td.plano_id = $1
       ORDER BY 
         CASE td.dia_semana 
           WHEN 'segunda' THEN 1 
           WHEN 'terca' THEN 2 
           WHEN 'quarta' THEN 3 
           WHEN 'quinta' THEN 4 
           WHEN 'sexta' THEN 5 
         END, ts.ordem`,
      [planoId]
    );

    // Buscar plano alimentar (dias + refeições)
    const refeicoesRes = await db.query(
      `SELECT pad.dia_semana, r.nome_refeicao, r.horario_sugerido, r.alimentos, r.observacao, r.ordem
       FROM plano_alimentar_dias pad
       JOIN refeicoes r ON r.plano_alimentar_dia_id = pad.id
       WHERE pad.plano_id = $1
       ORDER BY 
         CASE pad.dia_semana 
           WHEN 'segunda' THEN 1 
           WHEN 'terca' THEN 2 
           WHEN 'quarta' THEN 3 
           WHEN 'quinta' THEN 4 
           WHEN 'sexta' THEN 5 
         END, r.ordem`,
      [planoId]
    );

    // Agrupar treinos por dia da semana no formato esperado
    const treinosMap = {};
    treinosRes.rows.forEach(row => {
      if (!treinosMap[row.dia_semana]) {
        treinosMap[row.dia_semana] = [];
      }
      treinosMap[row.dia_semana].push({
        exercicio: row.exercicio,
        series: row.series,
        repeticoes: row.repeticoes,
        observacao: row.observacao
      });
    });

    // Agrupar refeições por dia da semana
    const refeicoesMap = {};
    refeicoesRes.rows.forEach(row => {
      if (!refeicoesMap[row.dia_semana]) {
        refeicoesMap[row.dia_semana] = [];
      }
      refeicoesMap[row.dia_semana].push({
        nome_refeicao: row.nome_refeicao,
        horario_sugerido: row.horario_sugerido,
        alimentos: row.alimentos,
        observacao: row.observacao
      });
    });

    // Construir o objeto aninhado completo
    const result = {
      id: plano.id,
      objetivo: plano.objetivo,
      altura_cm: plano.altura_cm,
      peso_kg: plano.peso_kg,
      imc: plano.imc,
      classificacao_imc: plano.classificacao_imc,
      criado_em: plano.criado_em,
      treino_semanal: Object.keys(treinosMap).map(dia => ({
        dia_semana: dia,
        exercicios: treinosMap[dia]
      })),
      plano_alimentar: Object.keys(refeicoesMap).map(dia => ({
        dia_semana: dia,
        refeicoes: refeicoesMap[dia]
      }))
    };

    res.json(result);
  } catch (err) {
    console.error('Erro ao detalhar plano:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes do plano.' });
  }
});

module.exports = router;
