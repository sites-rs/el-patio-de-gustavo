(function () {
  var cfg = window.__FIREBASE_CONFIG__;
  var path = window.__FIREBASE_MENU_PATH__ || { collection: 'site', docId: 'menu' };

  var authArea = document.getElementById('admin-auth');
  var appArea = document.getElementById('admin-app');
  var loginForm = document.getElementById('admin-login-form');
  var btnLogout = document.getElementById('admin-logout');
  var btnSave = document.getElementById('admin-save');
  var btnSeed = document.getElementById('admin-seed');
  var btnAddSection = document.getElementById('admin-add-section');
  var statusEl = document.getElementById('admin-status');
  var statusAppEl = document.getElementById('admin-status-app');
  var sectionsRoot = document.getElementById('admin-sections');

  var state = { blocks: [] };
  var __db;

  function setStatus(msg, isError) {
    var cls = 'admin-status' + (isError ? ' admin-status--error' : '');
    if (statusEl) {
      statusEl.textContent = msg || '';
      statusEl.className = cls;
    }
    if (statusAppEl) {
      statusAppEl.textContent = msg || '';
      statusAppEl.className = cls;
    }
  }

  function getDb() {
    if (__db) return __db;
    __db = firebase.firestore();
    // En algunas redes Firestore tarda mucho o se queda “colgado” con WebChannel.
    // Long polling suele ser más lento pero más fiable.
    try {
      __db.settings({ experimentalForceLongPolling: true, useFetchStreams: false });
    } catch (e) {
      // Ignorar si settings ya fue aplicado (o si el navegador no lo soporta).
    }
    return __db;
  }

  function cloneBlocks(blocks) {
    return JSON.parse(JSON.stringify(blocks || []));
  }

  function showAuth() {
    if (authArea) authArea.hidden = false;
    if (appArea) appArea.hidden = true;
  }

  function showApp() {
    if (authArea) authArea.hidden = true;
    if (appArea) appArea.hidden = false;
  }

  function validateConfig() {
    if (!cfg || !cfg.apiKey || cfg.apiKey.indexOf('REEMPLAZA') !== -1) {
      setStatus('Configura js/firebase-config.js con las claves de tu proyecto Firebase.', true);
      return false;
    }
    return true;
  }

  function renderEditor() {
    if (!sectionsRoot) return;
    sectionsRoot.innerHTML = '';
    state.blocks.forEach(function (block, bi) {
      var wrap = document.createElement('div');
      wrap.className = 'admin-section';
      wrap.dataset.index = String(bi);

      var head = document.createElement('div');
      head.className = 'admin-section__head';
      var titleLab = document.createElement('label');
      titleLab.textContent = 'Título de la sección';
      var titleInp = document.createElement('input');
      titleInp.type = 'text';
      titleInp.className = 'admin-input admin-input--wide';
      titleInp.value = block.title || '';
      titleInp.addEventListener('input', function () {
        state.blocks[bi].title = titleInp.value;
      });
      titleLab.appendChild(titleInp);

      var accLab = document.createElement('label');
      accLab.className = 'admin-check';
      var acc = document.createElement('input');
      acc.type = 'checkbox';
      acc.checked = !!block.accent;
      acc.addEventListener('change', function () {
        state.blocks[bi].accent = acc.checked;
      });
      accLab.appendChild(acc);
      accLab.appendChild(document.createTextNode(' Tarjeta con estilo destacado'));

      var delSec = document.createElement('button');
      delSec.type = 'button';
      delSec.className = 'admin-btn admin-btn--danger admin-btn--small';
      delSec.textContent = 'Eliminar sección';
      delSec.addEventListener('click', function () {
        state.blocks.splice(bi, 1);
        renderEditor();
      });

      head.appendChild(titleLab);
      head.appendChild(accLab);
      head.appendChild(delSec);
      wrap.appendChild(head);

      var itemsWrap = document.createElement('div');
      itemsWrap.className = 'admin-items';
      var items = Array.isArray(block.items) ? block.items : [];
      items.forEach(function (item, ii) {
        var row = document.createElement('div');
        row.className = 'admin-item-row';

        function field(placeholder, val, key) {
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'admin-input';
          inp.placeholder = placeholder;
          inp.value = val != null ? val : '';
          inp.addEventListener('input', function () {
            state.blocks[bi].items[ii][key] = inp.value;
          });
          return inp;
        }

        row.appendChild(field('Nombre del plato', item.name, 'name'));
        row.appendChild(field('Precio', item.price, 'price'));
        row.appendChild(field('Descripción (opcional)', item.desc, 'desc'));

        var delItem = document.createElement('button');
        delItem.type = 'button';
        delItem.className = 'admin-btn admin-btn--danger admin-btn--small';
        delItem.textContent = 'Quitar';
        delItem.addEventListener('click', function () {
          state.blocks[bi].items.splice(ii, 1);
          renderEditor();
        });
        row.appendChild(delItem);
        itemsWrap.appendChild(row);
      });

      var addItem = document.createElement('button');
      addItem.type = 'button';
      addItem.className = 'admin-btn admin-btn--secondary admin-btn--small';
      addItem.textContent = '+ Añadir plato en esta sección';
      addItem.addEventListener('click', function () {
        if (!Array.isArray(state.blocks[bi].items)) state.blocks[bi].items = [];
        state.blocks[bi].items.push({ name: '', price: '', desc: '' });
        renderEditor();
      });
      itemsWrap.appendChild(addItem);
      wrap.appendChild(itemsWrap);
      sectionsRoot.appendChild(wrap);
    });
  }

  function loadFromFirestore() {
    var db = getDb();
    return db
      .collection(path.collection)
      .doc(path.docId)
      .get()
      .then(function (snap) {
        if (snap.exists && snap.data().blocks) {
          state.blocks = cloneBlocks(snap.data().blocks);
        } else {
          state.blocks = [];
        }
        renderEditor();
        setStatus(snap.exists ? 'Carta cargada desde la nube.' : 'No hay carta en Firebase. Puedes cargar la de ejemplo.');
      });
  }

  function saveToFirestore() {
    setStatus('Guardando…');
    var db = getDb();
    var ref = db.collection(path.collection).doc(path.docId);

    var writePromise = ref.set(
      {
        blocks: state.blocks,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    // Si la red está bloqueada/lenta, el SDK puede tardar bastante.
    // Mostramos un mensaje útil tras unos segundos en vez de “Guardando…” indefinido.
    var timeoutMs = 12000;
    var timeoutPromise = new Promise(function (resolve) {
      setTimeout(function () {
        resolve('__timeout__');
      }, timeoutMs);
    });

    return Promise.race([writePromise.then(function () { return '__ok__'; }), timeoutPromise])
      .then(function (result) {
        if (result === '__timeout__') {
          setStatus('Sigue guardando… si tarda mucho, revisa la conexión o prueba otra red (esto suele pasar si la red bloquea Firestore).');
          return writePromise
            .then(function () {
              setStatus('Carta guardada. La web pública se actualizará sola en unos segundos.');
            })
            .catch(function (e) {
              setStatus('Error al guardar: ' + (e.message || String(e)), true);
            });
        }
        setStatus('Carta guardada. La web pública se actualizará sola en unos segundos.');
      })
      .catch(function (e) {
        setStatus('Error al guardar: ' + (e.message || String(e)), true);
      });
  }

  function importSeed() {
    setStatus('Descargando carta de ejemplo…');
    return fetch('data/menu-seed.json')
      .then(function (r) {
        if (!r.ok) throw new Error('No se encontró data/menu-seed.json');
        return r.json();
      })
      .then(function (data) {
        state.blocks = cloneBlocks(data.blocks);
        renderEditor();
        setStatus('Carta de ejemplo cargada en el editor. Pulsa «Guardar carta» para publicarla.');
      })
      .catch(function (e) {
        setStatus(e.message || 'Error al importar', true);
      });
  }

  function init() {
    if (!validateConfig()) return;

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
    } catch (e) {
      setStatus('No se pudo iniciar Firebase.', true);
      return;
    }

    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        showApp();
        loadFromFirestore().catch(function (e) {
          setStatus('Error al leer: ' + (e.message || String(e)), true);
        });
      } else {
        showAuth();
      }
    });

    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById('admin-email').value.trim();
        var pass = document.getElementById('admin-password').value;
        setStatus('Entrando…');
        firebase
          .auth()
          .signInWithEmailAndPassword(email, pass)
          .catch(function (err) {
            setStatus(err.message || 'Error de acceso', true);
          });
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', function () {
        firebase.auth().signOut();
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', function () {
        saveToFirestore();
      });
    }

    if (btnSeed) {
      btnSeed.addEventListener('click', function () {
        importSeed();
      });
    }

    if (btnAddSection) {
      btnAddSection.addEventListener('click', function () {
        state.blocks.push({
          title: 'Nueva sección',
          accent: false,
          items: [{ name: '', price: '', desc: '' }]
        });
        renderEditor();
      });
    }
  }

  init();
})();
