const express = require('express');
const router = express.Router();
const supabase = require('../db');
const authMiddleware = require('../middleware/auth');
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

// 1. Gerar e salvar novo plano (IA Google Gemini + Supabase Inserts)
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

  // Calcular IMC
  const imc = parseFloat((peso / ((altura / 100) ** 2)).toFixed(2));
  const classificacao = getClassificacaoIMC(imc);

  try {
    // Chamar a IA (Vercel AI SDK com Google Gemini)
    console.log(`Gerando plano via Gemini para: Objetivo=${objetivo}, IMC=${imc} (${classificacao})`);
    
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

    let planData;
    try {
      const { generateObject } = await import('ai');
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY
      });
      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: planSchema,
        prompt: promptText
      });
      planData = object;
    } catch (aiErr) {
      console.error('Erro na chamada da IA (Gemini):', aiErr);
      return res.status(502).json({ error: 'Erro de comunicação com o Google Gemini. Por favor, verifique a chave de API GEMINI_API_KEY no painel da Vercel.' });
    }

    // Persistência Sequencial no Supabase
    // 1. Inserir cabeçalho do plano
    const { data: plan, error: planError } = await supabase
      .from('planos')
      .insert({
        email_usuario: req.user.email,
        objetivo,
        altura_cm: altura,
        peso_kg: peso,
        imc,
        classificacao_imc: classificacao
      })
      .select('id')
      .single();

    if (planError) {
      console.error('Erro ao salvar cabeçalho do plano:', planError);
      return res.status(500).json({ error: 'Erro ao criar o plano no banco de dados.' });
    }

    const planoId = plan.id;

    // 2. Inserir treinos
    for (const tDia of planData.treino_semanal) {
      const { data: day, error: dayError } = await supabase
        .from('treino_dias')
        .insert({
          plano_id: planoId,
          dia_semana: tDia.dia_semana
        })
        .select('id')
        .single();

      if (dayError) {
        console.error('Erro ao salvar dia de treino:', dayError);
        continue;
      }

      const sessionsToInsert = tDia.exercicios.map((ex, index) => ({
        treino_dia_id: day.id,
        exercicio: ex.exercicio,
        series: ex.series,
        repeticoes: ex.repeticoes,
        observacao: ex.observacao || '',
        ordem: index + 1
      }));

      const { error: sessError } = await supabase
        .from('treino_sessoes')
        .insert(sessionsToInsert);

      if (sessError) {
        console.error('Erro ao salvar sessões de treino:', sessError);
      }
    }

    // 3. Inserir plano alimentar
    for (const aDia of planData.plano_alimentar) {
      const { data: day, error: dayError } = await supabase
        .from('plano_alimentar_dias')
        .insert({
          plano_id: planoId,
          dia_semana: aDia.dia_semana
        })
        .select('id')
        .single();

      if (dayError) {
        console.error('Erro ao salvar dia do plano alimentar:', dayError);
        continue;
      }

      const mealsToInsert = aDia.refeicoes.map((meal, index) => ({
        plano_alimentar_dia_id: day.id,
        nome_refeicao: meal.nome_refeicao,
        horario_sugerido: meal.horario_sugerido,
        alimentos: meal.alimentos,
        observacao: meal.observacao || '',
        ordem: index + 1
      }));

      const { error: mealError } = await supabase
        .from('refeicoes')
        .insert(mealsToInsert);

      if (mealError) {
        console.error('Erro ao salvar refeições:', mealError);
      }
    }

    res.status(201).json({
      message: 'Plano gerado e salvo com sucesso!',
      plano_id: planoId,
      imc,
      classificacao_imc: classificacao
    });

  } catch (err) {
    console.error('Erro geral ao processar plano:', err);
    res.status(500).json({ error: 'Erro ao gerar o plano de treino/dieta.' });
  }
});

// 2. Listar histórico de planos do usuário
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: plans, error } = await supabase
      .from('planos')
      .select('id, objetivo, altura_cm, peso_kg, imc, classificacao_imc, criado_em')
      .eq('email_usuario', req.user.email)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico de planos:', error);
      return res.status(500).json({ error: 'Erro ao carregar histórico.' });
    }

    res.json(plans);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro ao carregar histórico.' });
  }
});

// 3. Obter detalhes estruturados de um plano específico (com relacionamentos aninhados)
router.get('/:id', authMiddleware, async (req, res) => {
  const planoId = req.params.id;

  try {
    const { data: plan, error } = await supabase
      .from('planos')
      .select(`
        id, email_usuario, objetivo, altura_cm, peso_kg, imc, classificacao_imc, criado_em,
        treino_dias (
          dia_semana,
          treino_sessoes ( exercicio, series, repeticoes, observacao, ordem )
        ),
        plano_alimentar_dias (
          dia_semana,
          refeicoes ( nome_refeicao, horario_sugerido, alimentos, observacao, ordem )
        )
      `)
      .eq('id', planoId)
      .single();

    if (error || !plan) {
      console.error('Erro ao buscar detalhes do plano:', error);
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    // Verificar se pertence ao usuário
    if (plan.email_usuario !== req.user.email) {
      return res.status(403).json({ error: 'Acesso negado. Este plano pertence a outro usuário.' });
    }

    // Reordenar e estruturar o retorno exatamente como o frontend necessita
    const result = {
      id: plan.id,
      objetivo: plan.objetivo,
      altura_cm: plan.altura_cm,
      peso_kg: plan.peso_kg,
      imc: plan.imc,
      classificacao_imc: plan.classificacao_imc,
      criado_em: plan.criado_em,
      treino_semanal: (plan.treino_dias || []).map(td => ({
        dia_semana: td.dia_semana,
        exercicios: (td.treino_sessoes || []).sort((a, b) => a.ordem - b.ordem)
      })),
      plano_alimentar: (plan.plano_alimentar_dias || []).map(pad => ({
        dia_semana: pad.dia_semana,
        refeicoes: (pad.refeicoes || []).sort((a, b) => a.ordem - b.ordem)
      }))
    };

    res.json(result);
  } catch (err) {
    console.error('Erro ao detalhar plano:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes do plano.' });
  }
});

module.exports = router;
