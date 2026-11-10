/* Анкета на лендингах → Telegram-бот (через Google Apps Script).
   Один файл на все лендинги: рилсмейкеры, эксперты, специалисты.
   Сегмент берётся из скрытого поля segment в форме конкретного лендинга. */
(function () {
  // Сюда вставляется ссылка на развёрнутый Google Apps Script (см. apps-script/ИНСТРУКЦИЯ.md)
  var ENDPOINT = '';

  var form = document.getElementById('af');
  if (!form) return;
  var err = document.getElementById('af-err');
  var done = document.getElementById('af-done');
  var btn = form.querySelector('button[type=submit]');

  function clean(v) { return (v || '').trim(); }

  // @nick, nick, t.me/nick, https://t.me/nick → nick
  function tgNick(v) {
    v = clean(v).replace(/^https?:\/\//i, '').replace(/^(www\.)?(t\.me|telegram\.me)\//i, '').replace(/^@+/, '');
    return v.split(/[/?#\s]/)[0];
  }
  // @nick, nick, instagram.com/nick/?igsh=… → nick
  function igNick(v) {
    v = clean(v).replace(/^https?:\/\//i, '').replace(/^(www\.|m\.)?(instagram\.com|instagr\.am)\//i, '').replace(/^@+/, '');
    return v.split(/[/?#\s]/)[0];
  }

  function fail(msg) { err.textContent = msg; err.hidden = false; err.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var f = form.elements;
    if (clean(f.website.value)) return; // бот-спамер

    var name = clean(f.name.value);
    var tg = tgNick(f.telegram.value);
    var ig = igNick(f.instagram.value);
    var checkEl = form.querySelector('input[name=check]:checked');

    if (!name) return fail('Напиши, как тебя зовут 🙂');
    if (!/^[A-Za-z0-9_]{4,32}$/.test(tg)) return fail('Проверь ник в Telegram: только латиница, цифры и _, например @nastya');
    if (!/^[A-Za-z0-9._]{1,30}$/.test(ig)) return fail('Проверь Instagram: вставь ссылку на профиль или ник, например @nastya');
    if (!checkEl) return fail('Выбери, сколько сейчас берёшь за проект');
    if (!ENDPOINT) return fail('Анкета пока не подключена. Напиши мне в Telegram, пожалуйста 🙏');

    var params = new URLSearchParams(location.search);
    var data = {
      segment: f.segment.value,
      name: name,
      telegram: tg,
      instagram: ig,
      check: checkEl.value,
      pain: clean(f.pain.value),
      page: location.origin + location.pathname,
      utm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(function (k) { return params.get(k) ? k.replace('utm_', '') + '=' + params.get(k) : ''; }).filter(Boolean).join(', ')
    };

    btn.disabled = true; btn.textContent = 'Отправляю…';
    // text/plain + no-cors: Apps Script принимает без CORS-префлайта
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
      .then(function () {
        form.hidden = true; done.hidden = false;
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'Отправить анкету';
        fail('Не получилось отправить, проверь интернет и попробуй ещё раз');
      });
  });
})();
