document.addEventListener('DOMContentLoaded', () => {
  const loginCard = document.getElementById('login-card');
  const registerCard = document.getElementById('register-card');
  const toRegisterBtn = document.getElementById('to-register');
  const toLoginBtn = document.getElementById('to-login');
  
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  const loadingOverlay = document.getElementById('loading');
  const toast = document.getElementById('toast');

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

  // Redireciona se já estiver autenticado
  if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Alterna entre telas de Login e Registro
  toRegisterBtn.addEventListener('click', () => {
    loginCard.style.display = 'none';
    registerCard.style.display = 'block';
  });

  toLoginBtn.addEventListener('click', () => {
    registerCard.style.display = 'none';
    loginCard.style.display = 'block';
  });

  // Funções Utilitárias para Feedbacks
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

  // Salvar Token nas duas camadas (localStorage + cookies para o Express)
  function saveToken(token) {
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
  }

  // Enviar Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    showLoading(true, 'Autenticando...');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      saveToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Bem-vindo de volta!');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      showLoading(false);
    }
  });

  // Enviar Registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('reg-nome').value;
    const email = document.getElementById('reg-email').value;
    const idade = document.getElementById('reg-idade').value;
    const senha = document.getElementById('reg-senha').value;

    showLoading(true, 'Registrando conta...');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, idade, senha })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha no cadastro.');
      }

      saveToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Cadastro realizado com sucesso!');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      showLoading(false);
    }
  });
});
