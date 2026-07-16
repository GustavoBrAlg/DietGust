const express = require('express');
const router = express.Router();
const supabase = require('../db');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// PLANOS FIXOS
// ─────────────────────────────────────────────────────────────────────────────

// PLANO 1 — Ganho de Massa: ALTO SUPERÁVIT (para IMC < 18.5 — abaixo do peso)
const planoGanhoMassaAlto = {
  nome: 'Hipertrofia Intensiva — Alto Superávit',
  descricao: 'Plano voltado para ganho de massa em pessoas abaixo do peso. Alto volume calórico e treino composto pesado.',
  treino_semanal: [
    {
      dia_semana: 'segunda',
      foco: 'Peito + Tríceps',
      exercicios: [
        { exercicio: 'Supino Reto com Barra', series: 4, repeticoes: '8-10', observacao: 'Carga pesada. Descanso de 90s.' },
        { exercicio: 'Supino Inclinado com Halteres', series: 3, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Crucifixo na Polia', series: 3, repeticoes: '12-15', observacao: 'Foco na contração.' },
        { exercicio: 'Tríceps Testa com Barra', series: 3, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Tríceps Pulley com Corda', series: 3, repeticoes: '12-15', observacao: '' }
      ]
    },
    {
      dia_semana: 'terca',
      foco: 'Costas + Bíceps',
      exercicios: [
        { exercicio: 'Puxada Frontal com Barra Larga', series: 4, repeticoes: '8-10', observacao: '' },
        { exercicio: 'Remada Curvada com Barra', series: 4, repeticoes: '8-10', observacao: 'Costas retas.' },
        { exercicio: 'Remada Unilateral com Haltere', series: 3, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Rosca Direta com Barra', series: 3, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Rosca Martelo com Halteres', series: 3, repeticoes: '12', observacao: '' }
      ]
    },
    {
      dia_semana: 'quarta',
      foco: 'Pernas + Glúteos',
      exercicios: [
        { exercicio: 'Agachamento Livre com Barra', series: 4, repeticoes: '8-10', observacao: 'Exercício principal. Descanso de 2min.' },
        { exercicio: 'Leg Press 45°', series: 4, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Cadeira Extensora', series: 3, repeticoes: '12-15', observacao: '' },
        { exercicio: 'Mesa Flexora', series: 3, repeticoes: '12-15', observacao: '' },
        { exercicio: 'Panturrilha em Pé na Máquina', series: 4, repeticoes: '15-20', observacao: '' }
      ]
    },
    {
      dia_semana: 'quinta',
      foco: 'Ombros + Trapézio',
      exercicios: [
        { exercicio: 'Desenvolvimento com Barra (ombros)', series: 4, repeticoes: '8-10', observacao: '' },
        { exercicio: 'Elevação Lateral com Halteres', series: 4, repeticoes: '12-15', observacao: 'Sem balançar o corpo.' },
        { exercicio: 'Elevação Frontal com Anilha', series: 3, repeticoes: '12', observacao: '' },
        { exercicio: 'Remada Alta com Barra', series: 3, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Encolhimento de Ombros com Barra', series: 3, repeticoes: '12-15', observacao: '' }
      ]
    },
    {
      dia_semana: 'sexta',
      foco: 'Braços + Abdômen',
      exercicios: [
        { exercicio: 'Rosca Concentrada com Haltere', series: 3, repeticoes: '12', observacao: '' },
        { exercicio: 'Tríceps Francês com Haltere', series: 3, repeticoes: '12', observacao: '' },
        { exercicio: 'Rosca 21', series: 3, repeticoes: '21 reps (7+7+7)', observacao: 'Com barra ou halteres.' },
        { exercicio: 'Abdominal Supra', series: 3, repeticoes: '20', observacao: '' },
        { exercicio: 'Prancha', series: 3, repeticoes: '45 segundos', observacao: '' }
      ]
    }
  ],
  plano_alimentar: [
    {
      dia_semana: 'segunda',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['3 ovos mexidos inteiros', '4 fatias de pão integral', '2 colheres de pasta de amendoim', '1 banana', '200ml de leite integral'] },
        { nome_refeicao: 'Lanche da manhã (10h)', horario_sugerido: '10:00', alimentos: ['1 scoop de whey protein (30g)', '1 copo de leite integral (300ml)', '1 banana'] },
        { nome_refeicao: 'Almoço (13h)', horario_sugerido: '13:00', alimentos: ['200g de frango grelhado', '5 colheres de arroz branco', '4 colheres de feijão', '2 colheres de azeite no arroz', 'Salada à vontade (alface, tomate)'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 batata-doce média (150g) cozida', '1 scoop de whey protein', '1 colher de sopa de mel'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['200g de carne vermelha magra', '5 colheres de arroz', '2 colheres de azeite', 'Brócolis cozido à vontade'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['200g de iogurte grego integral', '1 colher de sopa de granola', '1 maçã'] }
      ]
    },
    {
      dia_semana: 'terca',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['Omelete com 3 ovos + 2 claras', '1 fatia de queijo mussarela', '4 fatias de pão integral', '200ml de suco de laranja natural'] },
        { nome_refeicao: 'Lanche da manhã (10h)', horario_sugerido: '10:00', alimentos: ['30g de castanha de caju', '1 maçã', '1 iogurte natural (200g)'] },
        { nome_refeicao: 'Almoço (13h)', horario_sugerido: '13:00', alimentos: ['200g de atum grelhado', '5 colheres de macarrão com azeite', 'Salada com cenoura e beterraba', '2 colheres de azeite'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 scoop de whey', '1 banana', '1 colher de pasta de amendoim'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['200g de tilápia grelhada', '5 colheres de arroz integral', 'Legumes salteados no azeite'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['2 ovos cozidos', '2 fatias de pão integral', '1 copo de leite'] }
      ]
    },
    {
      dia_semana: 'quarta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['Vitamina: 300ml leite integral + 2 bananas + 2 colheres de aveia + 1 scoop de whey'] },
        { nome_refeicao: 'Lanche da manhã (10h)', horario_sugerido: '10:00', alimentos: ['2 fatias de pão integral com pasta de amendoim', '1 banana'] },
        { nome_refeicao: 'Almoço (13h)', horario_sugerido: '13:00', alimentos: ['220g de frango grelhado', '5 colheres de arroz', '3 colheres de lentilha', '2 colheres de azeite', 'Salada verde à vontade'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 batata-doce (150g)', '1 scoop de whey', '1 colher de mel'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['200g de contra-filé', '4 colheres de purê de mandioca', 'Brócolis ao vapor'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['200g de cottage', '20g de whey', '10 morangos'] }
      ]
    },
    {
      dia_semana: 'quinta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['3 ovos estrelados', '4 fatias de pão integral', '1 abacate (100g)', '200ml de leite'] },
        { nome_refeicao: 'Lanche da manhã (10h)', horario_sugerido: '10:00', alimentos: ['1 scoop de whey com água', '1 laranja', '30g de amendoim torrado'] },
        { nome_refeicao: 'Almoço (13h)', horario_sugerido: '13:00', alimentos: ['200g de carne moída grelhada', '5 colheres de arroz', '4 colheres de feijão carioca', '2 colheres de azeite', 'Salada de folhas'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 copo de suco de fruta natural (300ml)', '1 torrada integral com pasta de amendoim'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['200g de peito de frango', '5 colheres de macarrão integral com azeite', 'Abobrinha grelhada'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['1 copo de leite morno', '3 bolachas integrais com pasta de amendoim'] }
      ]
    },
    {
      dia_semana: 'sexta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['Panqueca de aveia: 3 ovos + 5 colheres de aveia + 1 banana amassada', '1 colher de mel', '200ml de leite'] },
        { nome_refeicao: 'Lanche da manhã (10h)', horario_sugerido: '10:00', alimentos: ['1 iogurte grego integral (200g)', '30g de granola', '1 banana'] },
        { nome_refeicao: 'Almoço (13h)', horario_sugerido: '13:00', alimentos: ['200g de salmão grelhado', '4 colheres de arroz', '3 colheres de grão-de-bico', '2 colheres de azeite', 'Salada de rúcula com tomate'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 scoop de whey', '1 banana', '200ml de leite'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['200g de frango', '5 colheres de arroz integral', 'Espinafre refogado com azeite'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['2 ovos cozidos', '1 fatia de pão integral', '1 copo de leite integral'] }
      ]
    }
  ]
};

// PLANO 2 — Ganho de Massa: SUPERÁVIT MODERADO (para IMC 18.5–24.9 — peso normal)
const planoGanhoMassaModerado = {
  nome: 'Hipertrofia Equilibrada — Superávit Moderado',
  descricao: 'Plano para ganho de massa magra com controle calórico moderado. Ideal para quem já tem peso normal e quer crescer sem ganhar muita gordura.',
  treino_semanal: [
    {
      dia_semana: 'segunda',
      foco: 'Peito + Tríceps',
      exercicios: [
        { exercicio: 'Supino Reto com Halteres', series: 4, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Supino Inclinado na Máquina', series: 3, repeticoes: '12', observacao: '' },
        { exercicio: 'Crossover na Polia', series: 3, repeticoes: '15', observacao: 'Isolamento do peitoral.' },
        { exercicio: 'Tríceps Pulley com Barra', series: 3, repeticoes: '12-15', observacao: '' },
        { exercicio: 'Mergulho em Paralelas', series: 3, repeticoes: 'Máximo', observacao: 'Peso do corpo.' }
      ]
    },
    {
      dia_semana: 'terca',
      foco: 'Costas + Bíceps',
      exercicios: [
        { exercicio: 'Puxada Frontal no Aparelho', series: 4, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Remada Cavalinho', series: 3, repeticoes: '12', observacao: '' },
        { exercicio: 'Pullover com Haltere', series: 3, repeticoes: '12-15', observacao: '' },
        { exercicio: 'Rosca Alternada com Halteres', series: 3, repeticoes: '12', observacao: '' },
        { exercicio: 'Rosca na Polia', series: 3, repeticoes: '15', observacao: '' }
      ]
    },
    {
      dia_semana: 'quarta',
      foco: 'Pernas Completo',
      exercicios: [
        { exercicio: 'Agachamento Goblet com Kettlebell', series: 4, repeticoes: '12', observacao: '' },
        { exercicio: 'Leg Press Unilateral', series: 3, repeticoes: '12 cada perna', observacao: '' },
        { exercicio: 'Avanço com Halteres', series: 3, repeticoes: '12 passos', observacao: '' },
        { exercicio: 'Cadeira Extensora', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Panturrilha Sentado', series: 4, repeticoes: '20', observacao: '' }
      ]
    },
    {
      dia_semana: 'quinta',
      foco: 'Ombros',
      exercicios: [
        { exercicio: 'Desenvolvimento com Halteres', series: 4, repeticoes: '10-12', observacao: '' },
        { exercicio: 'Elevação Lateral com Halteres', series: 4, repeticoes: '15', observacao: '' },
        { exercicio: 'Face Pull na Polia', series: 3, repeticoes: '15', observacao: 'Saúde do manguito rotador.' },
        { exercicio: 'Elevação Frontal Alternada', series: 3, repeticoes: '12', observacao: '' },
        { exercicio: 'Abdominal com Peso', series: 3, repeticoes: '15', observacao: '' }
      ]
    },
    {
      dia_semana: 'sexta',
      foco: 'Fullbody + Core',
      exercicios: [
        { exercicio: 'Levantamento Terra (moderado)', series: 3, repeticoes: '8', observacao: 'Técnica perfeita. Foco na cadeia posterior.' },
        { exercicio: 'Flexão de Braço (Push-up) com Lastro', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Pull-up (Barra Fixa)', series: 3, repeticoes: 'Máximo', observacao: '' },
        { exercicio: 'Prancha Lateral', series: 3, repeticoes: '30 segundos cada lado', observacao: '' },
        { exercicio: 'Abdominal Bicicleta', series: 3, repeticoes: '20', observacao: '' }
      ]
    }
  ],
  plano_alimentar: [
    {
      dia_semana: 'segunda',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['3 ovos mexidos', '3 fatias de pão integral', '1 fatia de peito de peru', '1 fruta (banana ou maçã)'] },
        { nome_refeicao: 'Almoço (12h30)', horario_sugerido: '12:30', alimentos: ['180g de frango grelhado', '4 colheres de arroz integral', '3 colheres de feijão', '1 colher de azeite', 'Salada à vontade'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 batata-doce média (120g)', '1 scoop de whey protein'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['180g de carne magra', '4 colheres de arroz', 'Legumes no vapor', '1 colher de azeite'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['150g de iogurte grego', '1 colher de pasta de amendoim'] }
      ]
    },
    {
      dia_semana: 'terca',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['5 colheres de aveia com leite (200ml)', '1 banana amassada na aveia', '1 ovo cozido'] },
        { nome_refeicao: 'Almoço (12h30)', horario_sugerido: '12:30', alimentos: ['180g de tilápia grelhada', '4 colheres de macarrão integral', '2 colheres de molho de tomate', 'Salada de pepino e tomate'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 banana', '1 scoop de whey', '200ml de água'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['180g de frango', '4 colheres de quinoa cozida', 'Brócolis grelhado com azeite'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['2 ovos cozidos', '1 fatia de pão integral'] }
      ]
    },
    {
      dia_semana: 'quarta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['Tapioca com 2 ovos mexidos e queijo cottage', '1 maçã', '1 café com leite desnatado'] },
        { nome_refeicao: 'Almoço (12h30)', horario_sugerido: '12:30', alimentos: ['180g de patinho bovino grelhado', '4 colheres de arroz', '3 colheres de lentilha', 'Abobrinha refogada'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 fatia de pão integral com pasta de amendoim', '1 fruta'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['180g de atum em lata (natural)', '3 colheres de arroz', 'Salada verde com azeite e limão'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['150g de cottage', '5 morangos'] }
      ]
    },
    {
      dia_semana: 'quinta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['2 ovos + 1 clara mexidos', '3 fatias de pão integral', '1 banana', '200ml de leite desnatado'] },
        { nome_refeicao: 'Almoço (12h30)', horario_sugerido: '12:30', alimentos: ['180g de peito de frango', '4 colheres de arroz integral', '2 colheres de grão-de-bico', 'Espinafre refogado com alho'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 scoop de whey com 200ml de leite desnatado', '1 fruta'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['180g de salmão assado', '3 colheres de arroz', 'Mix de legumes assados no azeite'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['1 iogurte grego natural (170g)'] }
      ]
    },
    {
      dia_semana: 'sexta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['3 ovos mexidos com tomate e cebola', '2 fatias de pão integral', '1 fruta'] },
        { nome_refeicao: 'Almoço (12h30)', horario_sugerido: '12:30', alimentos: ['180g de frango', '4 colheres de arroz', '3 colheres de feijão', 'Salada colorida com azeite'] },
        { nome_refeicao: 'Pré-treino (16h)', horario_sugerido: '16:00', alimentos: ['1 banana com pasta de amendoim', '1 scoop de whey'] },
        { nome_refeicao: 'Jantar (20h)', horario_sugerido: '20:00', alimentos: ['180g de carne magra', '4 colheres de macarrão integral', 'Brócolis e cenoura cozidos'] },
        { nome_refeicao: 'Ceia (22h)', horario_sugerido: '22:00', alimentos: ['2 ovos cozidos', '1 copo de leite'] }
      ]
    }
  ]
};

// PLANO 3 — Definição Muscular: MODERADO (para IMC < 30 — não obeso)
const planoDefinicaoModerado = {
  nome: 'Definição Muscular — Déficit Moderado',
  descricao: 'Plano de definição com déficit calórico controlado, preservando massa muscular. Cardio moderado + treino de força.',
  treino_semanal: [
    {
      dia_semana: 'segunda',
      foco: 'Peito + Cardio',
      exercicios: [
        { exercicio: 'Supino Reto com Halteres', series: 4, repeticoes: '12-15', observacao: 'Ritmo controlado.' },
        { exercicio: 'Crossover na Polia', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Flexão de Braço', series: 3, repeticoes: 'Máximo', observacao: '' },
        { exercicio: 'Tríceps Pulley', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Esteira — Caminhada inclinada', series: 1, repeticoes: '20 minutos', observacao: 'Inclinação 8-10%, velocidade 5-6km/h.' }
      ]
    },
    {
      dia_semana: 'terca',
      foco: 'Costas + HIIT',
      exercicios: [
        { exercicio: 'Puxada Frontal', series: 4, repeticoes: '12-15', observacao: '' },
        { exercicio: 'Remada Sentada na Polia', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Rosca Direta com Halteres', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'HIIT — Polichinelo', series: 5, repeticoes: '40s esforço / 20s descanso', observacao: '5 rounds.' },
        { exercicio: 'HIIT — Burpee', series: 5, repeticoes: '40s esforço / 20s descanso', observacao: '5 rounds.' }
      ]
    },
    {
      dia_semana: 'quarta',
      foco: 'Pernas + Glúteos',
      exercicios: [
        { exercicio: 'Agachamento Sumo com Haltere', series: 4, repeticoes: '15', observacao: '' },
        { exercicio: 'Avanço Alternado com Halteres', series: 3, repeticoes: '12 por perna', observacao: '' },
        { exercicio: 'Cadeira Extensora', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Mesa Flexora', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Panturrilha em Pé', series: 4, repeticoes: '20', observacao: '' }
      ]
    },
    {
      dia_semana: 'quinta',
      foco: 'Ombros + Cardio',
      exercicios: [
        { exercicio: 'Desenvolvimento com Halteres', series: 4, repeticoes: '12-15', observacao: '' },
        { exercicio: 'Elevação Lateral', series: 4, repeticoes: '15', observacao: '' },
        { exercicio: 'Face Pull', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Prancha Abdominal', series: 3, repeticoes: '45 segundos', observacao: '' },
        { exercicio: 'Bicicleta Ergométrica', series: 1, repeticoes: '25 minutos', observacao: 'Ritmo moderado, zona de queima de gordura.' }
      ]
    },
    {
      dia_semana: 'sexta',
      foco: 'Fullbody + Core',
      exercicios: [
        { exercicio: 'Agachamento Livre (peso moderado)', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Flexão de Braço', series: 3, repeticoes: 'Máximo', observacao: '' },
        { exercicio: 'Remada Unilateral com Haltere', series: 3, repeticoes: '12 por lado', observacao: '' },
        { exercicio: 'Abdominal Supra', series: 3, repeticoes: '20', observacao: '' },
        { exercicio: 'Mountain Climber', series: 3, repeticoes: '30 segundos', observacao: '' }
      ]
    }
  ],
  plano_alimentar: [
    {
      dia_semana: 'segunda',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['3 claras + 1 ovo inteiro mexido', '2 fatias de pão integral', '1 fruta (maçã ou pêra)'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['180g de frango grelhado', '3 colheres de arroz integral', '2 colheres de feijão', 'Salada verde à vontade com azeite e vinagre'] },
        { nome_refeicao: 'Jantar (19h30)', horario_sugerido: '19:30', alimentos: ['180g de peixe grelhado (tilápia ou merluza)', '3 colheres de batata-doce cozida', 'Brócolis e couve-flor ao vapor'] }
      ]
    },
    {
      dia_semana: 'terca',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['200g de iogurte grego desnatado', '3 colheres de aveia', '1 fruta pequena'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['180g de carne magra grelhada', '3 colheres de quinoa', 'Legumes assados (pimentão, berinjela, abobrinha)'] },
        { nome_refeicao: 'Jantar (19h30)', horario_sugerido: '19:30', alimentos: ['180g de frango desfiado', '3 colheres de arroz', 'Salada de folhas escuras com tomate e cenoura'] }
      ]
    },
    {
      dia_semana: 'quarta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['2 ovos mexidos + 2 claras', '2 fatias de pão integral light', '1 fruta'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['180g de atum (lata em água)', '3 colheres de arroz integral', '2 colheres de grão-de-bico', 'Salada de rúcula com limão'] },
        { nome_refeicao: 'Jantar (19h30)', horario_sugerido: '19:30', alimentos: ['180g de frango', '3 colheres de batata-doce', 'Espinafre refogado com alho e azeite'] }
      ]
    },
    {
      dia_semana: 'quinta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['Tapioca (2 unidades pequenas) com frango desfiado (80g)', '1 fruta', '1 café sem açúcar'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['180g de salmão grelhado', '3 colheres de macarrão integral', 'Aspargos ou brócolis grelhados'] },
        { nome_refeicao: 'Jantar (19h30)', horario_sugerido: '19:30', alimentos: ['180g de peito de frango', '3 colheres de arroz', 'Salada variada com azeite'] }
      ]
    },
    {
      dia_semana: 'sexta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['3 claras + 1 ovo inteiro', '2 fatias de pão integral', '1 banana pequena'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['180g de patinho bovino', '3 colheres de arroz', '2 colheres de lentilha', 'Salada verde à vontade'] },
        { nome_refeicao: 'Jantar (19h30)', horario_sugerido: '19:30', alimentos: ['180g de tilápia', '3 colheres de batata-doce', 'Couve refogada com alho'] }
      ]
    }
  ]
};

// PLANO 4 — Definição Muscular: RESTRITIVO (para IMC >= 30 — obesidade)
const planoDefinicaoRestritivo = {
  nome: 'Definição Muscular — Emagrecimento Ativo',
  descricao: 'Plano de baixa caloria e alto cardio para redução expressiva de gordura. Preservação muscular máxima com alto teor proteico.',
  treino_semanal: [
    {
      dia_semana: 'segunda',
      foco: 'Cardio + Membros superiores',
      exercicios: [
        { exercicio: 'Caminhada Rápida ou Elíptico', series: 1, repeticoes: '30 minutos', observacao: 'Frequência cardíaca entre 65-75% do máximo.' },
        { exercicio: 'Remada Sentada na Polia (leve)', series: 3, repeticoes: '15', observacao: 'Peso leve, foco em contração.' },
        { exercicio: 'Puxada no Pulley', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Flexão de Braço adaptada (joelhos)', series: 3, repeticoes: 'Máximo', observacao: 'Progrida para a normal conforme evolui.' }
      ]
    },
    {
      dia_semana: 'terca',
      foco: 'Cardio + Pernas',
      exercicios: [
        { exercicio: 'Bicicleta Ergométrica', series: 1, repeticoes: '35 minutos', observacao: 'Ritmo constante, moderado.' },
        { exercicio: 'Agachamento Livre (sem peso)', series: 4, repeticoes: '15', observacao: 'Foco em técnica. Adicione peso quando sentir segurança.' },
        { exercicio: 'Elevação de Pernas Deitado', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Panturrilha em Pé', series: 3, repeticoes: '20', observacao: '' }
      ]
    },
    {
      dia_semana: 'quarta',
      foco: 'HIIT + Core',
      exercicios: [
        { exercicio: 'HIIT — Caminhada rápida x Trote', series: 8, repeticoes: '30s trote / 90s caminhada', observacao: '8 ciclos = ~16 minutos total.' },
        { exercicio: 'Abdominal Supra', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Prancha', series: 3, repeticoes: '30 segundos', observacao: 'Progrida para 45s e 60s com o tempo.' },
        { exercicio: 'Abdominal Oblíquo (toque no tornozelo)', series: 3, repeticoes: '15 por lado', observacao: '' }
      ]
    },
    {
      dia_semana: 'quinta',
      foco: 'Cardio + Fullbody',
      exercicios: [
        { exercicio: 'Esteira inclinada', series: 1, repeticoes: '30 minutos', observacao: 'Inclinação 6-8%.' },
        { exercicio: 'Supino na Máquina (leve)', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Leg Press 45° (carga baixa)', series: 3, repeticoes: '15', observacao: '' },
        { exercicio: 'Desenvolvimento de Ombros Sentado', series: 3, repeticoes: '15', observacao: '' }
      ]
    },
    {
      dia_semana: 'sexta',
      foco: 'Cardio Longo + Alongamento',
      exercicios: [
        { exercicio: 'Caminhada contínua ao ar livre', series: 1, repeticoes: '45 minutos', observacao: 'Ritmo confortável. O mais importante é manter o hábito.' },
        { exercicio: 'Alongamento de quadríceps', series: 2, repeticoes: '30 segundos cada perna', observacao: '' },
        { exercicio: 'Alongamento de lombar', series: 2, repeticoes: '30 segundos', observacao: '' },
        { exercicio: 'Respiração diafragmática', series: 3, repeticoes: '10 respirações profundas', observacao: 'Reduz cortisol e auxilia no emagrecimento.' }
      ]
    }
  ],
  plano_alimentar: [
    {
      dia_semana: 'segunda',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['3 claras de ovo mexidas', '1 fatia de pão integral light', '1 fruta pequena (maçã ou pêra)'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['150g de frango grelhado (sem pele)', 'Salada grande à vontade (alface, pepino, tomate, cenoura)', '2 colheres de arroz integral', '1 colher de azeite'] }
      ]
    },
    {
      dia_semana: 'terca',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['200g de iogurte grego desnatado (0% gordura)', '2 colheres de aveia', '1 fruta pequena'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['150g de atum (lata em água escorrida)', 'Salada variada à vontade', '2 colheres de quinoa cozida', 'Limão e vinagre como tempero'] }
      ]
    },
    {
      dia_semana: 'quarta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['2 ovos cozidos', '1 fatia de pão integral light', '1 fruta'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['150g de tilápia grelhada', 'Brócolis, couve-flor e espinafre à vontade (cozidos)', '2 colheres de arroz integral'] }
      ]
    },
    {
      dia_semana: 'quinta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['Vitamina: 150ml de leite desnatado + 3 colheres de aveia + 1 fruta', '2 claras de ovo cozidas'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['150g de peito de frango', 'Salada colorida grande com azeite e limão', '2 colheres de grão-de-bico'] }
      ]
    },
    {
      dia_semana: 'sexta',
      refeicoes: [
        { nome_refeicao: 'Café da manhã (7h)', horario_sugerido: '07:00', alimentos: ['3 claras + 1 ovo inteiro mexido', '1 fatia de pão integral', '1 fruta pequena'] },
        { nome_refeicao: 'Almoço (12h)', horario_sugerido: '12:00', alimentos: ['150g de peixe branco grelhado', 'Legumes no vapor à vontade', '2 colheres de arroz integral com azeite'] }
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// SELETOR DE PLANO
// ─────────────────────────────────────────────────────────────────────────────
function selecionarPlano(objetivo, imc) {
  if (objetivo === 'ganhar_massa') {
    return imc < 18.5 ? planoGanhoMassaAlto : planoGanhoMassaModerado;
  } else {
    return imc >= 30 ? planoDefinicaoRestritivo : planoDefinicaoModerado;
  }
}

// Helper IMC
function getClassificacaoIMC(imc) {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidade';
}

// ─────────────────────────────────────────────────────────────────────────────
// ROTAS
// ─────────────────────────────────────────────────────────────────────────────

// 1. Gerar e salvar novo plano
router.post('/generate', authMiddleware, async (req, res) => {
  const { altura_cm, peso_kg, objetivo } = req.body;

  if (!altura_cm || !peso_kg || !objetivo) {
    return res.status(400).json({ error: 'Altura, peso e objetivo são obrigatórios.' });
  }

  const altura = parseFloat(altura_cm);
  const peso = parseFloat(peso_kg);

  if (isNaN(altura) || isNaN(peso) || altura <= 0 || peso <= 0) {
    return res.status(400).json({ error: 'Altura e peso devem ser valores numéricos válidos.' });
  }

  if (objetivo !== 'ganhar_massa' && objetivo !== 'definicao_muscular') {
    return res.status(400).json({ error: 'Objetivo inválido. Use "ganhar_massa" ou "definicao_muscular".' });
  }

  const imc = parseFloat((peso / ((altura / 100) ** 2)).toFixed(2));
  const classificacao = getClassificacaoIMC(imc);
  const planoSelecionado = selecionarPlano(objetivo, imc);

  console.log(`Selecionando plano: objetivo=${objetivo}, IMC=${imc} (${classificacao}) → "${planoSelecionado.nome}"`);

  try {
    // Inserir cabeçalho do plano
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

    // Inserir treinos
    for (const tDia of planoSelecionado.treino_semanal) {
      const { data: day, error: dayError } = await supabase
        .from('treino_dias')
        .insert({ plano_id: planoId, dia_semana: tDia.dia_semana })
        .select('id')
        .single();

      if (dayError) { console.error('Erro ao salvar dia de treino:', dayError); continue; }

      const sessionsToInsert = tDia.exercicios.map((ex, index) => ({
        treino_dia_id: day.id,
        exercicio: ex.exercicio,
        series: ex.series,
        repeticoes: ex.repeticoes,
        observacao: ex.observacao || '',
        ordem: index + 1
      }));

      const { error: sessError } = await supabase.from('treino_sessoes').insert(sessionsToInsert);
      if (sessError) console.error('Erro ao salvar sessões:', sessError);
    }

    // Inserir plano alimentar
    for (const aDia of planoSelecionado.plano_alimentar) {
      const { data: day, error: dayError } = await supabase
        .from('plano_alimentar_dias')
        .insert({ plano_id: planoId, dia_semana: aDia.dia_semana })
        .select('id')
        .single();

      if (dayError) { console.error('Erro ao salvar dia alimentar:', dayError); continue; }

      const mealsToInsert = aDia.refeicoes.map((meal, index) => ({
        plano_alimentar_dia_id: day.id,
        nome_refeicao: meal.nome_refeicao,
        horario_sugerido: meal.horario_sugerido,
        alimentos: meal.alimentos,
        observacao: meal.observacao || '',
        ordem: index + 1
      }));

      const { error: mealError } = await supabase.from('refeicoes').insert(mealsToInsert);
      if (mealError) console.error('Erro ao salvar refeições:', mealError);
    }

    res.status(201).json({
      message: 'Plano gerado e salvo com sucesso!',
      plano_id: planoId,
      nome_plano: planoSelecionado.nome,
      descricao_plano: planoSelecionado.descricao,
      imc,
      classificacao_imc: classificacao
    });

  } catch (err) {
    console.error('Erro geral ao processar plano:', err);
    res.status(500).json({ error: 'Erro ao gerar o plano.' });
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
      console.error('Erro ao buscar histórico:', error);
      return res.status(500).json({ error: 'Erro ao carregar histórico.' });
    }

    res.json(plans);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro ao carregar histórico.' });
  }
});

// 3. Obter detalhes de um plano específico
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
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    if (plan.email_usuario !== req.user.email) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

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
