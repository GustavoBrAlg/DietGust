document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // Lógica do Tema (Claro / Escuro)
  const themeCheckbox = document.getElementById('theme-checkbox');
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeCheckbox) themeCheckbox.checked = true;
  } else {
    document.body.classList.remove('light-theme');
    if (themeCheckbox) themeCheckbox.checked = false;
  }

  if (themeCheckbox) {
    themeCheckbox.addEventListener('change', () => {
      if (themeCheckbox.checked) {
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
      }
    });
  }

  // Elementos do DOM
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  
  const profileAge = document.getElementById('profile-age');
  const profileEmail = document.getElementById('profile-email');
  
  const historyContainer = document.getElementById('history-container');
  
  const openModalBtn = document.getElementById('open-generate-modal-btn');
  const emptyStateAddBtn = document.getElementById('empty-state-add-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const generateModal = document.getElementById('generate-modal');
  const generatePlanForm = document.getElementById('generate-plan-form');
  
  const activePlanContainer = document.getElementById('active-plan-container');
  const noPlanEmptyState = document.getElementById('no-plan-empty-state');
  
  const planBadge = document.getElementById('plan-badge');
  const planGoalTitle = document.getElementById('plan-goal-title');
  const planDate = document.getElementById('plan-date');
  const planHeight = document.getElementById('plan-height');
  const planWeight = document.getElementById('plan-weight');
  const planImc = document.getElementById('plan-imc');
  
  const dayTabs = document.querySelectorAll('.day-tab');
  const workoutList = document.getElementById('workout-list');
  const dietList = document.getElementById('diet-list');
  
  const loadingOverlay = document.getElementById('loading');
  const toast = document.getElementById('toast');

  let currentActivePlan = null;
  let activeTabDay = 'segunda';

  // Configuração global de Headers de Requisição
  const apiHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Funções Utilitárias
  function showLoading(show, text = 'Carregando...') {
    if (show) {
      document.getElementById('loading-text').innerText = text;
      loadingOverlay.classList.add('active');
    } else {
      loadingOverlay.classList.remove('active');
    }
  }

  function showToast(message, isError = false) {
    toast.innerText = message;
    toast.className = 'toast active';
    if (isError) {
      toast.classList.add('toast-error');
    } else {
      toast.classList.add('toast-success');
    }
    setTimeout(() => {
      toast.classList.remove('active');
    }, 3500);
  }

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Limpar cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = 'index.html';
  });

  // Modal de Novo Plano
  function toggleModal(open) {
    if (open) {
      generateModal.classList.add('active');
    } else {
      generateModal.classList.remove('active');
    }
  }

  openModalBtn.addEventListener('click', () => toggleModal(true));
  if (emptyStateAddBtn) {
    emptyStateAddBtn.addEventListener('click', () => toggleModal(true));
  }
  closeModalBtn.addEventListener('click', () => toggleModal(false));

  // Carrega informações básicas de perfil do usuário
  async function loadProfile() {
    try {
      const res = await fetch('/api/auth/me', { headers: apiHeaders });
      if (!res.ok) throw new Error('Não foi possível obter dados do perfil.');
      const data = await res.json();
      userDisplay.innerText = data.nome;
      profileAge.innerText = `${data.idade} anos`;
      profileEmail.innerText = data.email;
    } catch (err) {
      console.error(err);
      const userCached = JSON.parse(localStorage.getItem('user'));
      if (userCached) userDisplay.innerText = userCached.nome;
    }
  }

  // Carrega lista histórica de planos do usuário
  async function loadHistory(selectLatest = false) {
    try {
      const res = await fetch('/api/plans', { headers: apiHeaders });
      if (!res.ok) throw new Error('Não foi possível obter o histórico.');
      const data = await res.json();

      if (data.length === 0) {
        historyContainer.innerHTML = `
          <div class="empty-state">
            <p>Nenhum plano gerado ainda.</p>
          </div>
        `;
        noPlanEmptyState.style.display = 'block';
        activePlanContainer.style.display = 'none';
        return;
      }

      noPlanEmptyState.style.display = 'none';
      activePlanContainer.style.display = 'flex';

      historyContainer.innerHTML = '';
      data.forEach((plan, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        if (currentActivePlan && plan.id === currentActivePlan.id) {
          item.classList.add('active');
        }

        const dateFormatted = new Date(plan.criado_em).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });

        const objetivoTxt = plan.objetivo === 'ganhar_massa' ? 'Massa Muscular' : 'Definição';

        item.innerHTML = `
          <div class="history-item-header">
            <span>${dateFormatted}</span>
            <span>IMC: ${plan.imc}</span>
          </div>
          <div class="history-item-goal">🎯 ${objetivoTxt}</div>
          <div class="history-item-metrics">
            <span>${plan.altura_cm}cm</span>
            <span>${plan.peso_kg}kg</span>
          </div>
        `;

        item.addEventListener('click', () => {
          document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          loadPlanDetails(plan.id);
        });

        historyContainer.appendChild(item);
      });

      // Selecionar o mais recente se solicitado
      if (selectLatest && data.length > 0) {
        loadPlanDetails(data[0].id);
      }
    } catch (err) {
      showToast('Erro ao carregar o histórico de planos.', true);
    }
  }

  // Carrega e exibe detalhes de um plano específico
  async function loadPlanDetails(planId) {
    showLoading(true, 'Carregando detalhes do plano...');
    try {
      const res = await fetch(`/api/plans/${planId}`, { headers: apiHeaders });
      if (!res.ok) throw new Error('Não foi possível obter dados do plano.');
      const plan = await res.json();
      
      currentActivePlan = plan;
      renderPlanHeader();
      renderPlanDay(activeTabDay);
    } catch (err) {
      showToast('Erro ao carregar dados do plano selecionado.', true);
    } finally {
      showLoading(false);
    }
  }

  // Renderiza cabeçalho do plano selecionado
  function renderPlanHeader() {
    if (!currentActivePlan) return;

    const isMassa = currentActivePlan.objetivo === 'ganhar_massa';
    planBadge.innerText = isMassa ? 'Ganhar Massa Muscular' : 'Definição Muscular';
    planBadge.style.backgroundColor = isMassa ? 'var(--primary-color)' : '#00bfff';
    planBadge.style.color = 'var(--primary-text-contrast)';

    planGoalTitle.innerText = isMassa ? 'Hipertrofia & Força' : 'Definição & Queima';
    
    const dateFormatted = new Date(currentActivePlan.criado_em).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    
    // Detectar fonte do plano (IA ou Predefinido)
    let planSource = 'Inteligência Artificial (Gemini)';
    let planSourceColor = 'var(--primary-color)';
    
    if (currentActivePlan.treino_semanal) {
      const mondayWorkout = currentActivePlan.treino_semanal.find(t => t.dia_semana === 'segunda');
      if (mondayWorkout && mondayWorkout.exercicios) {
        const exerciseNames = mondayWorkout.exercicios.map(e => e.exercicio).join('|');
        const predefinedSets = [
          'Supino Reto com Barra|Supino Inclinado com Halteres|Crucifixo na Polia|Tríceps Testa com Barra|Tríceps Pulley com Corda',
          'Supino Reto com Halteres|Supino Inclinado na Máquina|Crossover na Polia|Tríceps Pulley com Barra|Mergulho em Paralelas',
          'Supino Reto com Halteres|Crossover na Polia|Flexão de Braço|Tríceps Pulley|Esteira — Caminhada inclinada',
          'Caminhada Rápida ou Elíptico|Remada Sentada na Polia (leve)|Puxada no Pulley|Flexão de Braço adaptada (joelhos)'
        ];
        if (predefinedSets.includes(exerciseNames)) {
          planSource = 'Plano Padrão do Sistema (Predefinido)';
          planSourceColor = '#ffae00';
        }
      }
    }
    
    planDate.innerHTML = `Criado em ${dateFormatted} <br><span style="display: inline-block; margin-top: 6px; font-size: 0.8rem; padding: 2px 8px; border-radius: 6px; background-color: var(--surface-color-alt); border: 1px solid var(--border-color); color: ${planSourceColor}; font-weight: 600;">Fonte: ${planSource}</span>`;
    
    planHeight.innerText = `${currentActivePlan.altura_cm} cm`;
    planWeight.innerText = `${currentActivePlan.peso_kg} kg`;
    planImc.innerText = `${currentActivePlan.imc} (${currentActivePlan.classificacao_imc})`;
  }

  // Renderiza treinos e dietas para o dia selecionado
  function renderPlanDay(day) {
    if (!currentActivePlan) return;

    // 1. Limpar listas
    workoutList.innerHTML = '';
    dietList.innerHTML = '';

    // 2. Filtrar dados do dia
    const treinoDia = currentActivePlan.treino_semanal.find(t => t.dia_semana === day);
    const dietaDia = currentActivePlan.plano_alimentar.find(d => d.dia_semana === day);

    // 3. Renderizar Treinos
    if (treinoDia && treinoDia.exercicios && treinoDia.exercicios.length > 0) {
      treinoDia.exercicios.forEach(ex => {
        const item = document.createElement('div');
        item.className = 'workout-item';
        item.innerHTML = `
          <div class="workout-item-header">
            <span class="workout-item-name">${ex.exercicio}</span>
            <span class="workout-item-sets">${ex.series} séries</span>
          </div>
          <div class="workout-item-reps">Repetições: ${ex.repeticoes}</div>
          ${ex.observacao ? `<div class="workout-item-obs">${ex.observacao}</div>` : ''}
        `;
        workoutList.appendChild(item);
      });
    } else {
      workoutList.innerHTML = `
        <div class="empty-state">
          <p>Sem treinos programados para hoje.</p>
        </div>
      `;
    }

    // 4. Renderizar Refeições
    if (dietaDia && dietaDia.refeicoes && dietaDia.refeicoes.length > 0) {
      dietaDia.refeicoes.forEach(meal => {
        const item = document.createElement('div');
        item.className = 'diet-item';
        
        const alimentosHtml = meal.alimentos
          .map(alimento => `<li>${alimento}</li>`)
          .join('');

        item.innerHTML = `
          <div class="diet-item-header">
            <span class="diet-item-name">${meal.nome_refeicao}</span>
            <span class="diet-item-time">⏰ ${meal.horario_sugerido}</span>
          </div>
          <ul class="diet-item-food-list">
            ${alimentosHtml}
          </ul>
          ${meal.observacao ? `<div class="diet-item-obs">${meal.observacao}</div>` : ''}
        `;
        dietList.appendChild(item);
      });
    } else {
      dietList.innerHTML = `
        <div class="empty-state">
          <p>Sem refeições programadas para hoje.</p>
        </div>
      `;
    }
  }

  // Ouvir clicks nos botões de tabs dos dias da semana
  dayTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dayTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTabDay = tab.getAttribute('data-day');
      renderPlanDay(activeTabDay);
    });
  });

  // Criar Novo Plano
  generatePlanForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const altura_cm = document.getElementById('form-altura').value;
    const peso_kg = document.getElementById('form-peso').value;
    const objetivo = document.querySelector('input[name="form-objetivo"]:checked').value;

    toggleModal(false);
    showLoading(true, 'A Inteligência Artificial está montando seus treinos e dieta com base nas suas metas. Isso pode levar de 15 a 30 segundos...');

    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ altura_cm, peso_kg, objetivo })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar o plano.');
      }

      if (data.ia_gerado) {
        showToast(`Plano personalizado gerado com sucesso pela Inteligência Artificial (${data.modelo_ia})!`);
      } else {
        showToast(`Aviso: IA falhou (${data.erro_ia || 'Sem detalhes'}). Usando plano padrão.`, true);
      }
      
      // Limpar formulário
      generatePlanForm.reset();
      
      // Recarregar histórico e selecionar o plano que acabou de ser criado
      await loadHistory(false);
      await loadPlanDetails(data.plano_id);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      showLoading(false);
    }
  });

  // Inicializar Página
  loadProfile();
  loadHistory(true);
});
