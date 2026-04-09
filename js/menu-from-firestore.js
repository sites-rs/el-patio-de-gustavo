(function () {
  var cfg = window.__FIREBASE_CONFIG__;
  var path = window.__FIREBASE_MENU_PATH__ || { collection: 'site', docId: 'menu' };
  var root = document.getElementById('menu-blocks-root');
  var __db;

  function showError(msg) {
    if (!root) return;
    root.innerHTML =
      '<p class="menu-firestore-error" role="alert">' +
      (msg || 'No se pudo cargar la carta.') +
      ' Revisa la configuración en <code>js/firebase-config.js</code> y las reglas de Firestore.</p>';
  }

  function showLoading() {
    if (!root) return;
    root.innerHTML = '<p class="menu-firestore-loading">Cargando carta…</p>';
  }

  if (!root) return;

  if (!cfg || !cfg.apiKey || cfg.apiKey.indexOf('REEMPLAZA') !== -1) {
    showError('Falta configurar Firebase.');
    return;
  }

  if (typeof firebase === 'undefined' || !MenuRender) {
    showError('Faltan scripts de Firebase o menu-render.js.');
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(cfg);
    }
  } catch (e) {
    showError('Error al iniciar Firebase.');
    return;
  }

  __db = firebase.firestore();
  try {
    __db.settings({ experimentalForceLongPolling: true, useFetchStreams: false });
  } catch (e) {
    // Ignorar si ya estaba aplicado.
  }
  var db = __db;
  var ref = db.collection(path.collection).doc(path.docId);
  var debugHint = '(proyecto: ' + (cfg && cfg.projectId ? cfg.projectId : 'desconocido') + ', doc: ' + path.collection + '/' + path.docId + ')';

  showLoading();

  // Plan B para móviles/redes: si la conexión en tiempo real se queda “colgada”,
  // hacemos una lectura normal y pintamos el menú igualmente.
  var didRender = false;
  var fallbackTimer = setTimeout(function () {
    if (didRender) return;
    ref
      .get()
      .then(function (snap) {
        if (!snap.exists) {
          root.innerHTML =
            '<p class="menu-firestore-empty">La carta aún no está publicada ' +
            MenuRender.escapeHtml(debugHint) +
            '. Entra en <strong>admin.html</strong>, inicia sesión y pulsa «Cargar carta de ejemplo» o «Guardar carta».</p>';
          didRender = true;
          return;
        }
        var data = snap.data();
        var blocks = data && data.blocks;
        root.innerHTML = MenuRender.renderMenuBlocks(blocks);
        didRender = true;
      })
      .catch(function (e) {
        showError('No se pudo cargar la carta (' + (e && e.message ? e.message : 'error') + ').');
      });
  }, 8000);

  ref.onSnapshot(
    function (snap) {
      didRender = true;
      clearTimeout(fallbackTimer);
      if (!snap.exists) {
        root.innerHTML =
          '<p class="menu-firestore-empty">La carta aún no está publicada ' +
          MenuRender.escapeHtml(debugHint) +
          '. Entra en <strong>admin.html</strong>, inicia sesión y pulsa «Cargar carta de ejemplo» o «Guardar carta».</p>';
        return;
      }
      var data = snap.data();
      var blocks = data && data.blocks;
      root.innerHTML = MenuRender.renderMenuBlocks(blocks);
    },
    function (err) {
      clearTimeout(fallbackTimer);
      // Si falla el realtime, aún puede funcionar la lectura normal.
      ref
        .get()
        .then(function (snap) {
          if (!snap.exists) {
            root.innerHTML =
              '<p class="menu-firestore-empty">La carta aún no está publicada ' +
              MenuRender.escapeHtml(debugHint) +
              '. Entra en <strong>admin.html</strong>, inicia sesión y pulsa «Cargar carta de ejemplo» o «Guardar carta».</p>';
            didRender = true;
            return;
          }
          var data = snap.data();
          var blocks = data && data.blocks;
          root.innerHTML = MenuRender.renderMenuBlocks(blocks);
          didRender = true;
        })
        .catch(function () {
          showError('Error de red o permisos al leer la carta' + (err && err.message ? ': ' + err.message : '.') );
        });
    }
  );
})();
