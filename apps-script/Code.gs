/**
 * Приёмник анкет с лендингов → сообщение в Telegram.
 * 1) Вставь токен бота в BOT_TOKEN.
 * 2) Напиши своему боту /start, запусти функцию getChatId и вставь число в CHAT_ID.
 * 3) Развернуть → Новое развёртывание → Веб-приложение, доступ «Все».
 * Код хранится в твоём Google-аккаунте, на сайте его никто не видит.
 */
var BOT_TOKEN = 'ВСТАВЬ_ТОКЕН_БОТА';
var CHAT_ID = 'ВСТАВЬ_CHAT_ID';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.website) return ok_(); // ловушка для спам-ботов
    sendToTelegram_(buildMessage_(d));
  } catch (err) {
    console.error(err);
  }
  return ok_();
}

function buildMessage_(d) {
  var tg = nick_(d.telegram, /^(www\.)?(t\.me|telegram\.me)\//i);
  var ig = nick_(d.instagram, /^(www\.|m\.)?(instagram\.com|instagr\.am)\//i);
  var lines = [
    '🔥 <b>Новая анкета</b>',
    '📍 Лендинг: <b>' + esc_(d.segment || '—') + '</b>',
    '',
    '👤 Имя: ' + esc_(d.name),
    '✈️ Telegram: ' + (tg ? '<a href="https://t.me/' + tg + '">@' + tg + '</a>' : esc_(d.telegram)),
    '📸 Instagram: ' + (ig ? '<a href="https://www.instagram.com/' + ig + '/">instagram.com/' + ig + '</a>' : esc_(d.instagram)),
    '💰 Чек за проект: ' + esc_(d.check || '—'),
    '😩 Что мешает: ' + esc_(d.pain || '—')
  ];
  if (d.utm) lines.push('🏷 Метки: ' + esc_(d.utm));
  if (d.page) lines.push('🔗 ' + esc_(d.page));
  return lines.join('\n');
}

function nick_(v, host) {
  v = String(v || '').trim().replace(/^https?:\/\//i, '').replace(host, '').replace(/^@+/, '');
  v = v.split(/[\/?#\s]/)[0];
  return /^[A-Za-z0-9._]{1,32}$/.test(v) ? v : '';
}

function esc_(s) {
  return String(s == null ? '' : s).slice(0, 1500)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sendToTelegram_(text) {
  UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'HTML', disable_web_page_preview: true }),
    muteHttpExceptions: true
  });
}

function ok_() {
  return ContentService.createTextOutput('ok');
}

/** Запусти один раз после того, как написала боту /start. Chat id появится в «Журнале выполнения». */
function getChatId() {
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/getUpdates', { muteHttpExceptions: true });
  var res = JSON.parse(r.getContentText()).result || [];
  if (!res.length) { console.log('Пусто. Напиши боту /start и запусти ещё раз.'); return; }
  res.forEach(function (u) {
    var c = (u.message || u.my_chat_member || {}).chat;
    if (c) console.log('CHAT_ID = ' + c.id + '  (' + (c.username || c.first_name || c.title) + ')');
  });
}

/** Тест: отправит тебе в бот пробную анкету. */
function testMessage() {
  sendToTelegram_(buildMessage_({
    segment: 'Рилсмейкеры (тест)', name: 'Тест', telegram: '@durov',
    instagram: 'https://www.instagram.com/instagram/?igsh=123', check: '30 000–70 000 ₽', pain: 'Проверка связи'
  }));
}
