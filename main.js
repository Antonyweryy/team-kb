<script>
// ==== Настройки ====
const WORKER_URL = "https://broken-meadow-47c5.ivlievd156.workers.dev";

// Дожидаемся, пока Telegram WebApp загрузится
window.Telegram.WebApp.ready();

// Получаем initData от Telegram
const initData = window.Telegram.WebApp.initData;
if (!initData) {
  document.body.innerHTML = "Ошибка: нет initData от Telegram";
  throw new Error("Нет initData");
}

// Показываем, что идёт проверка доступа
document.body.innerHTML = "Проверка доступа...";

// Функция валидации через Worker
async function validate() {
  try {
    const resp = await fetch(`${WORKER_URL}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    });

    const data = await resp.json();

    if (!data.ok) {
      document.body.innerHTML = `Доступ запрещен: ${data.error}`;
      console.error(data);
      return;
    }

    // Доступ разрешен
    document.body.innerHTML = `
      <h2>Привет, ${data.user.first_name || "пользователь"}!</h2>
      <p>Здесь собраны чеклисты, инструкции и учебные модули — всё в одном месте.</p>
    `;

    console.log("Данные пользователя:", data.user);
    console.log("Разрешенные модули:", data.allowedModules);

  } catch (err) {
    document.body.innerHTML = "Ошибка связи с сервером";
    console.error(err);
  }
}

// Запускаем проверку
validate();

</script>
