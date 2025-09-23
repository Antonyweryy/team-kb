// main.js

// Безопасный доступ к Telegram WebApp — если его нет, не падать
const tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

async function initTelegram() {
  if (!tg) {
    console.log("Telegram WebApp не обнаружен — пропускаю валидацию.");
    // Покажи гостя, чтобы не было пустоты
    const usernameDiv = document.getElementById("username");
    if (usernameDiv) usernameDiv.textContent = "Гость";
    return;
  }

  try {
    // Если SDK доступен — вызови ready и сделай запрос на сервер
    try { tg.ready(); } catch(e){ /* silently */ }

    const res = await fetch("https://broken-meadow-47c5.ivlievd156.workers.dev/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData })
    });
    const data = await res.json();

    if (data && data.ok && data.user) {
      const name = data.user.first_name || "Пользователь";
      const photo = data.user.photo_url;
      const usernameDiv = document.getElementById("username");
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
    } else {
      document.getElementById("username").textContent = "Ошибка доступа";
    }
  } catch (e) {
    console.error("Ошибка в initTelegram:", e);
    document.getElementById("username").textContent = "Ошибка связи с сервером";
  }
}

// UI: навесим обработчики модулей
function attachListeners() {
  const modules = Array.from(document.querySelectorAll('.module'));

  // Убедимся, что не оставлено inline display:none, чтобы CSS мог работать
  modules.forEach(m => m.style.removeProperty('display'));

  document.querySelectorAll('.module-list a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.dataset.module;
      if (!id) return;
      modules.forEach(m => m.classList.remove('active'));
      const modal = document.getElementById(id);
      if (!modal) return;
      // убираем возможный inline display и показываем через класс
      modal.style.removeProperty('display');
      modal.classList.add('active');
      document.body.classList.add('no-scroll');
    });
  });

  // Назад
  document.addEventListener('click', e => {
    if (e.target.closest('.back')) {
      modules.forEach(m => m.classList.remove('active'));
      document.body.classList.remove('no-scroll');
    }
  });

  // Esc чтобы закрыть
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      modules.forEach(m => m.classList.remove('active'));
      document.body.classList.remove('no-scroll');
    }
  });
}

// Когда DOM готов — навесим обработчики и запустим телеграм-инициализацию
document.addEventListener('DOMContentLoaded', () => {
  attachListeners();
  initTelegram();
});
