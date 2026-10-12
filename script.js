// Здесь хранится "состояние игры"
const state = {
  skin: null,      // номер выбранного скина: 1, 2, 3 или 4
  muted: false     // выключил ли игрок звук сам
};

const screens = document.querySelectorAll('.screen');
const skinsScreen = document.getElementById('screen-skins');
const skinButtons = document.querySelectorAll('.skin');
const btnPlay = document.getElementById('btn-play');
const btnReady = document.getElementById('btn-ready');
const btnLook = document.getElementById('btn-look');
const startVideo = document.getElementById('start-video');
const airdropVideo = document.getElementById('airdrop-video');

// Показать нужный экран, остальные скрыть
function showScreen(id) {
  screens.forEach(function (screen) {
    screen.classList.toggle('active', screen.id === id);
  });

  // Видео на стартовом экране нужно только пока он виден
  if (id === 'screen-start') {
    startVideo.play();
  } else {
    startVideo.pause();
  }
}

// ---------- Звуки ----------
const ambient = document.getElementById('ambient');   // ветер: стартовый экран и выбор скина
const music = document.getElementById('music');
const lobbyMusic = document.getElementById('lobby-music');   // last-track
const musicBtn = document.getElementById('music-btn');

ambient.volume = 1;
music.volume = 0.5;
lobbyMusic.volume = 0.5;

// Применить "звук выключен / включён" ко всем источникам звука сразу
function applyMute() {
  ambient.muted = state.muted;
  music.muted = state.muted;
  lobbyMusic.muted = state.muted;
  airdropVideo.muted = state.muted;
  musicBtn.textContent = state.muted ? '🔇' : '🔊';
}

musicBtn.addEventListener('click', function () {
  state.muted = !state.muted;
  applyMute();
});

applyMute();

// ---------- Звуки кнопок: клик и наведение ----------
const clickSound = new Audio('audio/click.mp3');
const hoverSound = new Audio('audio/hover.mp3');
clickSound.preload = 'auto';
hoverSound.preload = 'auto';

let lastHover = 0;   // когда последний раз играл звук наведения

// Каждый раз играем новую копию, чтобы звуки не обрывали друг друга
function playUi(sound, volume) {
  if (state.muted) return;
  const copy = sound.cloneNode();
  copy.volume = volume;
  copy.play().catch(function (err) {
    console.log('Звук не сыграл:', err.message);
  });
}

// Всё, что считается кнопкой
const clickable = '.btn, .skin, .gift, .music-btn';

document.addEventListener('click', function (e) {
  const el = e.target.closest(clickable);
  if (el && !el.disabled) playUi(clickSound, 1);
});

document.addEventListener('mouseover', function (e) {
  const el = e.target.closest(clickable);
  if (!el || el.disabled) return;
  if (el.contains(e.relatedTarget)) return;   // мышь двигается внутри той же кнопки

  const now = Date.now();
  if (now - lastHover < 150) return;          // не чаще раза в 0,15 с
  lastHover = now;
  playUi(hoverSound, 1);
});

// Разовый звук (открытие подарка): звук выключен -> молчим
function playSfx(src) {
  if (state.muted) return;
  const a = new Audio(src);
  a.play().catch(function (err) {
    console.log('Звук не сыграл:', err.message);
  });
}

// Плавно убавить громкость и остановить
function fadeOut(audio, ms) {
  const step = audio.volume / (ms / 50);
  const timer = setInterval(function () {
    if (audio.volume > step) {
      audio.volume -= step;
    } else {
      audio.pause();
      clearInterval(timer);
    }
  }, 50);
}

// ---------- Кнопка "ИГРАТЬ" ----------
// Ветер продолжает играть, просто идём к выбору скина
btnPlay.addEventListener('click', function () {
  showScreen('screen-skins');
});

// ---------- Выбор скина ----------
skinButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    state.skin = button.dataset.skin;

    // Подсвечиваем только нажатую карточку
    skinButtons.forEach(function (b) {
      b.classList.toggle('selected', b === button);
    });

    skinsScreen.classList.add('has-choice');
    btnReady.disabled = false;   // теперь "ГОТОВ" можно нажать
  });
});

// ---------- Кнопка "ГОТОВ": видео про аирдроп ----------
function goToIntro() {
  showScreen('screen-intro');
}

btnReady.addEventListener('click', function () {
  btnReady.disabled = true;   // чтобы не нажали второй раз

  // skin-1-1.png, skin-2-2.png, skin-3-3.png, skin-4-4.png
  document.getElementById('intro-skin').src =
    'images/skin-' + state.skin + '-' + state.skin + '.png';

  fadeOut(ambient, 800);               // ветер затихает
  showScreen('screen-airdrop');
  airdropVideo.currentTime = 0;
  airdropVideo.play().catch(goToIntro);   // если видео не запустилось, идём дальше
});

// Видео закончилось -> экран с репликой
airdropVideo.addEventListener('ended', goToIntro);
airdropVideo.addEventListener('error', goToIntro);

// Кнопка "ОСМОТРЕТЬСЯ" -> экран с 12 подарками
btnLook.addEventListener('click', function () {
  showScreen('screen-gifts');
});

// ---------- Экран с 12 подарками ----------
const giftsScreen = document.getElementById('screen-gifts');
const giftButtons = [];

for (let i = 0; i < 12; i++) {
  const col = i % 4;              // номер столбца 0..3
  const row = Math.floor(i / 4);  // номер ряда 0..2

  const button = document.createElement('button');
  button.className = 'gift';
  button.style.left = (20.9 + col * 15.03) + '%';
  button.style.top = (25.5 + row * 22) + '%';
  button.style.setProperty('--i', i);   // для появления по очереди
  button.innerHTML =
    '<img src="images/gift-closed.png" alt="Подарок ' + (i + 1) + '">';

  button.addEventListener('click', function () {
    openGift(i);
  });

  giftsScreen.appendChild(button);
  giftButtons.push(button);
}

// Сделать подарок "открытым": меняем картинку на серую, кнопку блокируем
function markGiftOpened(index) {
  const button = giftButtons[index];
  button.querySelector('img').src = 'images/gift-opened.png';
  button.classList.add('opened');
  button.disabled = true;
}

// ---------- Содержимое подарков (в порядке получения) ----------
// 'simple' = обычный, 'gold' = ценный. Картинки: images/prize-1.png ... prize-12.png
const prizeTypes = [
  'simple', 'simple', 'gold',    // 1, 2, 3
  'simple', 'simple', 'simple',  // 4, 5, 6
  'gold',                        // 7
  'simple', 'simple',            // 8, 9
  'gold',                        // 10
  'simple',                      // 11
  'gold'                         // 12
];

let openedCount = 0;    // сколько подарков уже открыто
let currentGift = null; // какую коробку сейчас открываем

const revealScreen = document.getElementById('screen-reveal');
const btnTake = document.getElementById('btn-take');

const btnTakeImg = btnTake.querySelector('img');
const lagIcon = document.getElementById('lag-icon');
const blackout = document.getElementById('blackout');
let lagClicks = 0;      // сколько раз нажали "забрать" на последнем подарке
let lagNeeded = 5;      // после скольких кликов появится "network lag" (5 или 6)
let lagShown = false;

function openGift(index) {
    // Защита от двойного клика и от открытия сверх 12
  if (revealScreen.classList.contains('active') || openedCount >= prizeTypes.length) return;
  const type = prizeTypes[openedCount];
  currentGift = index;
    // Сброс "лага" (он включается только на последнем подарке)
  lagClicks = 0;
  lagShown = false;
  lagNeeded = 5 + Math.round(Math.random());   // 5 или 6
  lagIcon.classList.remove('show');
  btnTake.classList.remove('restart');
  btnTakeImg.src = 'images/btn-take.png';
  revealScreen.dataset.prize = openedCount + 1;   // номер подарка для индивидуальной подстройки

  document.getElementById('reveal-prize').src =
    'images/prize-' + (openedCount + 1) + '.png';

  revealScreen.classList.toggle('gold', type === 'gold');
  giftsScreen.classList.add('seen');   // при возврате подарки не появляются заново

  btnTake.disabled = true;             // "Забрать" включится, когда анимация доиграет
  showScreen('screen-reveal');
  playSfx(type === 'gold' ? 'audio/gold.mp3' : 'audio/simple.mp3');
  // Золотой: кнопка включается после появления предмета (3,3 с + анимация)
  setTimeout(function () { btnTake.disabled = false; }, type === 'gold' ? 4800 : 1400);
}

btnTake.addEventListener('click', function () {
  if (btnTake.disabled) return;

  // Последний подарок: сначала "лаг"
  if (openedCount === prizeTypes.length - 1) {
    if (!lagShown) {
      lagClicks++;

      // кнопка дёргается, но ничего не происходит
      btnTake.classList.remove('glitch');
      void btnTake.offsetWidth;
      btnTake.classList.add('glitch');

      if (lagClicks >= lagNeeded) {
        lagShown = true;
        lagIcon.classList.add('show');
        btnTakeImg.src = 'images/btn-restart.png';
        btnTake.classList.add('restart');

        // Кнопка временно неактивна, чтобы её нельзя было прокликать
        btnTake.disabled = true;
        setTimeout(function () { btnTake.disabled = false; }, 1500); // 1,5 сек
      }
      return;
    }

    // "Перезапустить лобби": через чёрный экран на финал
    btnTake.disabled = true;
    fadeThroughBlack(showFinal);
    return;
  }

  btnTake.disabled = true;   // второй клик сразу ничего не делает
  markGiftOpened(currentGift);
  openedCount++;
  showScreen('screen-gifts');
});

// ---------- Переходы через чёрный экран, финал и лобби ----------
const btnLobby = document.getElementById('btn-lobby');
const matchBar = document.getElementById('match-bar');
const matchTimer = document.getElementById('match-timer');

let matchInterval = null;

// Запустить таймер поиска матча (в секундах)
// Таймер поиска матча: считает ВВЕРХ от 0 до `seconds`
function startMatchTimer(seconds) {
  clearInterval(matchInterval);
  let passed = 0;               // сколько секунд уже прошло

  function render() {
    const m = Math.floor(passed / 60);
    const s = passed % 60;
    matchTimer.textContent =
      String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  render();
  matchBar.classList.add('show');

  matchInterval = setInterval(function () {
    passed++;
    render();
    if (passed >= seconds) {
      clearInterval(matchInterval);
      // тут можно что-то сделать, когда 10:00 достигнуто
    }
  }, 1000);
}

function stopMatchTimer() {
  clearInterval(matchInterval);
  matchBar.classList.remove('show');
}

// Экран темнеет, внутри темноты меняем экран, потом светлеет
function fadeThroughBlack(action) {
  blackout.classList.add('on');
  setTimeout(function () {
    action();
    setTimeout(function () { blackout.classList.remove('on'); }, 400);
  }, 1100);
}

function showFinal() {
  showScreen('screen-final');
  music.currentTime = 0;
  music.play().catch(function (err) {
    console.log('Музыка не сыграла:', err.message);
  });

  // Кнопка "В ЛОББИ" появляется через 5 секунд
  btnLobby.classList.remove('ready');
  setTimeout(function () { btnLobby.classList.add('ready'); }, 5000);
}

btnLobby.addEventListener('click', function () {
  if (!btnLobby.classList.contains('ready')) return;
  btnLobby.classList.remove('ready');   // второй клик не сработает

  fadeThroughBlack(function () {
    document.getElementById('lobby-skin').src =
      'images/skin-' + state.skin + '-' + state.skin + '.png';
    showScreen('screen-lobby');

    // Звук старта матча
    if (!state.muted) {
      const startSfx = new Audio('audio/start-game.mp3');
      startSfx.volume = 1;
      startSfx.play().catch(function (err) {
        console.log('Звук старта не сыграл:', err.message);
      });
    }

    // Плашка поиска матча + таймер на 600 секунд
    startMatchTimer(10 * 60);
  });
});

// ---------- Заставка ----------
const splashVideo = document.getElementById('splash-video');
const splashPrompt = document.getElementById('splash-prompt');
const splashScreen = document.getElementById('screen-splash');
let splashReady = false;   // можно ли уже нажимать "продолжить"

// Видео закончилось: гасим его и показываем мигающую надпись
function showSplashPrompt() {
  splashReady = true;
  splashVideo.classList.add('done');
  splashPrompt.classList.add('visible');
}

splashVideo.addEventListener('ended', showSplashPrompt);
splashVideo.addEventListener('error', showSplashPrompt);   // если видео не загрузилось
splashVideo.play().catch(showSplashPrompt);                // если браузер не дал запустить

// Клик по заставке: стартовый экран и ветер пустыни
splashScreen.addEventListener('click', function () {
  if (!splashReady) return;      // пока видео идёт, клик ничего не делает
  musicBtn.hidden = false;
  showScreen('screen-start');
  ambient.play().catch(function () {});
});