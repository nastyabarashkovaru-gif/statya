/* Анкета на лендингах → Telegram-бот (через Google Apps Script).
   Один файл на все лендинги: рилсмейкеры, эксперты, специалисты.
   Сегмент берётся из скрытого поля segment в форме конкретного лендинга.
   Все поля с data-label уходят в бот как «Вопрос: ответ», поэтому вопросы
   можно менять прямо в HTML, не трогая скрипт в Google. */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxKoqzrEWBQJOcPePfNyPCRbviyjFXMJm3F2ChJ9ozHh1pWplikvHF3ev_iAE8iqshD/exec';

  var form = document.getElementById('af');
  if (!form) return;
  var err = document.getElementById('af-err');
  var done = document.getElementById('af-done');
  var btn = form.querySelector('button[type=submit]');

  function clean(v) { return (v || '').trim(); }
  function tgNick(v) {
    v = clean(v).replace(/^https?:\/\//i, '').replace(/^(www\.)?(t\.me|telegram\.me)\//i, '').replace(/^@+/, '');
    return v.split(/[/?#\s]/)[0];
  }
  function igNick(v) {
    v = clean(v).replace(/^https?:\/\//i, '').replace(/^(www\.|m\.)?(instagram\.com|instagr\.am)\//i, '').replace(/^@+/, '');
    return v.split(/[/?#\s]/)[0];
  }
  function fail(msg, el) {
    err.textContent = msg; err.hidden = false;
    (el || err).scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el && el.focus) setTimeout(function () { el.focus({ preventScroll: true }); }, 300);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var f = form.elements;
    if (clean(f.website.value)) return; // спам-бот

    var tg = tgNick(f.telegram.value);
    var ig = igNick(f.instagram.value);
    var ready = form.querySelector('input[name=ready]:checked');

    if (!clean(f.name.value)) return fail('Напиши имя, возраст и город 🙂', f.name);
    if (!/^[A-Za-z0-9._]{1,30}$/.test(ig)) return fail('Проверь Instagram: вставь ссылку на профиль или ник, например @nastya', f.instagram);
    if (!/^[A-Za-z0-9_]{4,32}$/.test(tg)) return fail('Проверь ник в Telegram: только латиница, цифры и _, например @nastya', f.telegram);
    var texts = form.querySelectorAll('[data-label]');
    for (var i = 0; i < texts.length; i++) {
      if (texts[i].required && !clean(texts[i].value)) return fail('Ответь, пожалуйста, на все вопросы 🙏', texts[i]);
    }
    if (!ready) return fail('Выбери, насколько готов(а) ворваться в обучение', form.querySelector('input[name=ready]'));

    var fields = [];
    for (var j = 0; j < texts.length; j++) fields.push([texts[j].getAttribute('data-label'), clean(texts[j].value)]);
    fields.push(['Готовность', ready.value]);

    var params = new URLSearchParams(location.search);
    var data = {
      segment: f.segment.value,
      name: clean(f.name.value),
      telegram: tg,
      instagram: ig,
      fields: fields,
      page: location.origin + location.pathname,
      utm: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(function (k) { return params.get(k) ? k.replace('utm_', '') + '=' + params.get(k) : ''; }).filter(Boolean).join(', ')
    };

    btn.disabled = true; btn.textContent = 'Отправляю…';
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
