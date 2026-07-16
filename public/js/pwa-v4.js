// Registro do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado com sucesso: ', registration.scope);
      })
      .catch((err) => {
        console.error('❌ Registro do Service Worker falhou: ', err);
      });
  });
}

// Controle da Instalação do PWA
let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Impede o Chrome de mostrar a barra de instalação automática do navegador
  e.preventDefault();
  // Guarda o evento para disparar depois
  deferredPrompt = e;
  
  // Mostra nosso banner customizado de instalação
  if (installBanner) {
    installBanner.style.display = 'flex';
  }
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Escolha do usuário para a instalação: ${outcome}`);
    
    // Limpa o prompt
    deferredPrompt = null;
    
    // Esconde o banner
    if (installBanner) {
      installBanner.style.display = 'none';
    }
  });
}

// Esconder banner quando o app já está instalado
window.addEventListener('appinstalled', () => {
  console.log('🎉 DietGust instalado com sucesso!');
  if (installBanner) {
    installBanner.style.display = 'none';
  }
});

// Detecta atualização do Service Worker e recarrega a página automaticamente para aplicar o novo cache
let refreshing = false;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
