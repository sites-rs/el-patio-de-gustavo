/**
 * Genera el HTML de la carta a partir del array `blocks` guardado en Firestore.
 * Cada bloque: { title, accent?: boolean, items: [{ name, price, desc }] }
 */
(function (global) {
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMenuBlocks(blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return '<p class="menu-firestore-empty">No hay platos publicados todavía.</p>';
    }
    var parts = [];
    for (var b = 0; b < blocks.length; b++) {
      var section = blocks[b];
      var title = section.title || 'Sin título';
      var accent = section.accent ? ' menu-card--accent' : '';
      var items = Array.isArray(section.items) ? section.items : [];
      parts.push('<article class="menu-card' + accent + '">');
      parts.push('<h3 class="menu-card__title">' + escapeHtml(title) + '</h3>');
      parts.push('<ul class="menu-list">');
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var name = escapeHtml(it.name || '');
        var price = escapeHtml(it.price != null ? it.price : '');
        var desc = (it.desc != null && String(it.desc).trim() !== '') ? escapeHtml(it.desc) : '';
        parts.push('<li class="menu-item">');
        parts.push('<div class="menu-item__head"><span class="menu-item__name">' + name + '</span>');
        parts.push('<span class="menu-item__price">' + price + '</span></div>');
        if (desc) {
          parts.push('<p class="menu-item__desc">' + desc + '</p>');
        } else {
          parts.push('<p class="menu-item__desc"></p>');
        }
        parts.push('</li>');
      }
      parts.push('</ul></article>');
    }
    return parts.join('');
  }

  global.MenuRender = { renderMenuBlocks: renderMenuBlocks, escapeHtml: escapeHtml };
})(typeof window !== 'undefined' ? window : this);
