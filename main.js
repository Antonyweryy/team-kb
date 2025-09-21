<script>
const tg = window.TelegramWebApp;
tg.ready();

fetch('https://broken-meadow-47c5.ivlievd156.workers.dev/validate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ initData: tg.initData })
})
.then(res => res.json())
.then(data => {
  if (data.allowed) {
    document.body.innerHTML = "<h1>Доступ разрешён!</h1>";
  } else {
    document.body.innerHTML = "<h1>Доступ запрещён</h1>";
  }
});
</script>
