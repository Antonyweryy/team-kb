// main.js

//const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
const tg = window.Telegram.WebApp;
document.documentElement.setAttribute('data-theme', tg.colorScheme);
tg.onEvent('themeChanged', () => {
  document.documentElement.setAttribute('data-theme', tg.colorScheme);
});

function closeModule() {
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  document.body.classList.remove('no-scroll');
}

async function checkAccess() {
  // Получаем div для имени
  const usernameDiv = document.getElementById("username");

  // Функция для показа заглушки
  const showAccessDenied = () => {
     const loader = document.getElementById("loader");
    const main = document.getElementById("main-content");
    const topbar = document.getElementById("topbar");
    
    if (loader) loader.remove();
    if (main) main.remove();
    if (topbar) topbar.remove();
  document.body.innerHTML = `
    <div class="access-denied">
      <div class="icon">🚫</div>
      <div class="title">Доступ запрещён</div>
      <div class="subtitle">У вас нет прав для просмотра этой страницы</div>
      <a href="https://t.me/antonywer" target="_blank" class="btn">Связаться с админом</a>
    </div>
  `;
};


  // Если Telegram нет — сразу заглушка
  if (!tg) {
    showAccessDenied();
    return false;
  }

  try {
    tg.ready?.();

    const res = await fetch("https://broken-meadow-47c5.ivlievd156.workers.dev/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData })
    });

    const data = await res.json();

    // Любая ошибка или отсутствующий id → заглушка
    if (!data?.ok || !data?.user?.id || data.allowed === false) {
      showAccessDenied();
      return false;
    }

    // Всё ок — скрываем спиннер и показываем контент
// После проверки доступа, прямо перед return true:
const loader = document.getElementById("loader");
const main = document.getElementById("main-content");
if (loader) loader.style.display = "none";
if (main) main.style.display = "block";


    // Если всё ок — отображаем имя и фото
    const name = data.user.first_name || "Пользователь";
    const photo = data.user.photo_url;
    usernameDiv.textContent = "";
    usernameDiv.style.display = "flex";
    usernameDiv.style.alignItems = "center";
    usernameDiv.style.gap = "12px";

    if (photo) {
      const img = document.createElement("img");
      img.src = photo;
      img.alt = name;
      img.classList.add("my-avatar"); 
      img.style.width = "32px";
      img.style.height = "32px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "50%";
      img.style.marginRight = "12px";
      usernameDiv.appendChild(img);
    }
    usernameDiv.appendChild(document.createTextNode(name));

    // === доступ к модулям ===
    const isPro = data.isPro;
    const isExpert = data.isExpert;
    const isBonus = data.isBonus;

    console.log("User data:", data.user);
    console.log("isPro:", data.isPro, "isExpert:", data.isExpert, "isBonus:", data.isBonus);

    
    // скрываем по умолчанию
    document.querySelectorAll(".pro, .expert, .bonus").forEach(el => {
      el.style.display = "none";
    });

    if (isPro) document.querySelectorAll(".pro").forEach(el => el.style.display = "block");
    if (isExpert) document.querySelectorAll(".expert").forEach(el => el.style.display = "block");
    if (isBonus) document.querySelectorAll(".bonus").forEach(el => el.style.display = "block");



    return true;

  } catch (e) {
    console.error("Ошибка при проверке доступа:", e);
    showAccessDenied();
    return false;
  }
}

// UI: навесим обработчики модулей
// UI: навесим обработчики модулей
function attachListeners() {
  const modules = Array.from(document.querySelectorAll('.module'));

  document.querySelectorAll('.module-list a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.dataset.module;
      if (!id) return;
      
      modules.forEach(m => m.classList.remove('active'));
      const modal = document.getElementById(id);
      if (!modal) return;

      modal.classList.add('active');
      document.body.classList.add('no-scroll');

      // ДОБАВЛЕНО: Если открываем трекер — запускаем его инициализацию
      if (id === 'tracker') {
        if (typeof initTracker === 'function') {
          initTracker();
        }
      }
    });
  });

  document.addEventListener('click', e => {
    if (e.target.closest('.back')) {
      modules.forEach(m => m.classList.remove('active'));
      document.body.classList.remove('no-scroll');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      modules.forEach(m => m.classList.remove('active'));
      document.body.classList.remove('no-scroll');
    }
  });
}
let currentSlideIndex = 1;

function changeSlide(n) {
  showSlide(currentSlideIndex += n);
}

function currentSlide(n) {
  showSlide(currentSlideIndex = n);
}

function showSlide(n) {
  const images = document.querySelectorAll('.carousel-image');
  const dots = document.querySelectorAll('.dot');
  
  if (n > images.length) currentSlideIndex = 1;
  if (n < 1) currentSlideIndex = images.length;
  
  images.forEach(img => img.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  
  images[currentSlideIndex - 1].classList.add('active');
  dots[currentSlideIndex - 1].classList.add('active');
}

// Отслеживание скролла для показа топбара
document.addEventListener('DOMContentLoaded', function() {
  const modules = document.querySelectorAll('.module');
  
  modules.forEach(module => {
    const topbar = module.querySelector('.module-topbar');
    
    if (topbar) {
      module.addEventListener('scroll', function() {
        if (module.scrollTop > 200) {
          topbar.classList.add('visible');
        } else {
          topbar.classList.remove('visible');
        }
      });
    }
  });
});

// Также нужно сбрасывать скролл при закрытии модуля
function closeModule() {
  const activeModule = document.querySelector('.module.active');
  if (activeModule) {
    const topbar = activeModule.querySelector('.module-topbar');
    if (topbar) {
      topbar.classList.remove('visible');
    }
    activeModule.scrollTop = 0; // Сброс скролла
  }
  
  // Остальная логика закрытия модуля
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  document.body.classList.remove('no-scroll');
  document.getElementById('main-content').style.display = 'block';
}
// Запуск после DOM
document.addEventListener('DOMContentLoaded', async () => {
  const allowed = await checkAccess(); // ждем проверки доступа
  if (allowed) {
    attachListeners();
    // скрываем спиннер и показываем основной контент
    const loader = document.getElementById("loader");
    const main = document.getElementById("main-content");
    if (loader) loader.style.display = "none";
    if (main) main.style.display = "block";
  }
  // если allowed=false — страница уже заменена на заглушку
});

