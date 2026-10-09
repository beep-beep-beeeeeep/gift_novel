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
const music = document.getElementById('music');       // музыка (подключим позже)
const musicBtn = document.getElementById('music-btn');

ambient.volume = 0.6;   // громкость от 0 до 1, при желании поменяйте
music.volume = 0.5;

// Применить "звук выключен / включён" ко всем источникам звука сразу
function applyMute() {
  ambient.muted = state.muted;
  music.muted = state.muted;
  airdropVideo.muted = state.muted;
  musicBtn.textContent = state.muted ? '🔇' : '🔊';
}

musicBtn.addEventListener('click', function () {
  state.muted = !state.muted;
  applyMute();
});

applyMute();

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

// Кнопка "ОСМОТРЕТЬСЯ" -> экран с 12 подарками (добавим на следующем шаге)
btnLook.addEventListener('click', function () {
  console.log('Здесь будет переход к экрану с 12 подарками');
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