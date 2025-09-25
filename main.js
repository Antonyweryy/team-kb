// main.js

const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

async function checkAccess() {
  // Получаем div для имени
  const usernameDiv = document.getElementById("username");

  // Функция для показа заглушки
  const showAccessDenied = () => {
    document.body.innerHTML = `
      <div class="access-denied">
        <div class="icon">🚫</div>
        <div class="title">Доступ запрещён</div>
        <div class="subtitle">Обратитесь к администратору</div>
        <a href="mailto:admin@example.com" class="btn">Связаться с админом</a>
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

    console.log("User data:", data.user);
    console.log("isPro:", data.isPro, "isExpert:", data.isExpert);

    
    // скрываем по умолчанию
    document.querySelectorAll(".pro, .expert").forEach(el => {
      el.style.display = "none";
    });

    if (isPro) document.querySelectorAll(".pro").forEach(el => el.style.display = "block");
    if (isExpert) document.querySelectorAll(".expert").forEach(el => el.style.display = "block");



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
      modal.style.removeProperty('display');
      modal.classList.add('active');
      document.body.classList.add('no-scroll');
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

