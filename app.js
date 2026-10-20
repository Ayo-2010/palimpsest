const STORAGE_KEY = 'palimpsest.archive.v1';
const $ = (id) => document.getElementById(id);

const SEED = [
  {
    id: 'salt-road',
    title: 'The Salt Road',
    created: '2026-08-18',
    layers: [
      {
        label: 'Base impression',
        date: '2026-08-18',
        text: 'The road began as a rumour. A line of camels, a sack of salt, a town that had learned to wait. At the edge of the map the dunes turned the colour of weak tea and the caravan became a sentence moving slowly toward its full stop.\n\nOur guide carried a brass compass and a folded page on which every well was marked with a small blue cross. He said the desert was not empty. It was merely written in a language we had not learned to read.'
      },
      {
        label: 'Revision I',
        date: '2026-08-29',
        text: 'The road began as a rumour, but the rumour had a route. A line of camels, a sack of salt, a town that had learned to wait. At the edge of the map the dunes turned the colour of weak tea and the caravan became a sentence moving slowly toward its full stop.\n\nOur guide carried a brass compass and a folded page on which every well was marked with a small blue cross. The ink had bled into the folds. He said the desert was not empty. It was merely written in a language we had not learned to read.\n\nBy noon the salt had begun to shine through the sacks. The whole caravan looked as if it were carrying light.'
      },
      {
        label: 'Revision II',
        date: '2026-09-12',
        text: 'The road began as a rumour, but the rumour had a route and a price. A line of camels, a sack of salt, a town that had learned to wait. At the edge of the map the dunes turned the colour of weak tea. The caravan became a sentence moving slowly toward its full stop.\n\nOur guide carried a brass compass and a folded page on which every well was marked with a small blue cross. The ink had bled into the folds. He said the desert was not empty. It was merely written in a language we had not learned to read.\n\nBy noon the salt began to shine through the sacks. The whole caravan looked as if it were carrying light. I wrote that down, then crossed it out, then wrote it again in the margin where it belonged.'
      }
    ],
    notes: [
      { id: 'n1', text: 'Check the name of the well near the third pass.', date: '2026-08-30' },
      { id: 'n2', text: 'The salt as light — keep this for the final layer.', date: '2026-09-12' }
    ]
  },
  {
    id: 'small-weather',
    title: 'A Field Guide to Small Weather',
    created: '2026-08-24',
    layers: [
      {
        label: 'Base impression',
        date: '2026-08-24',
        text: 'There is weather that never reaches the forecast. Steam lifting from a cup, the private wind of a closing door, the rain that begins and ends inside a single window frame.\n\nI began keeping a ledger of these small disturbances. Monday: a fog in the stairwell. Tuesday: sunlight moving across a kitchen wall like a hand searching for something it had lost.'
      },
      {
        label: 'Revision I',
        date: '2026-09-04',
        text: 'There is weather that never reaches the forecast. Steam lifting from a cup, the private wind of a closing door, the rain that begins and ends inside a single window frame.\n\nI began keeping a ledger of these small disturbances. Monday: a fog in the stairwell. Tuesday: sunlight moving across a kitchen wall like a hand searching for something it had lost. Wednesday: a cold front arriving in the form of a letter.'
      }
    ],
    notes: [
      { id: 'n3', text: 'Add the weather of the basement at closing time.', date: '2026-09-04' }
    ]
  },
  {
    id: 'blue-hour',
    title: 'Notes from the Blue Hour',
    created: '2026-09-01',
    layers: [
      {
        label: 'Base impression',
        date: '2026-09-01',
        text: 'The blue hour is not an hour. It is a negotiation between the streetlamp and the sky. For eleven minutes every window becomes a small stage and every passer-by is an actor who has forgotten the lines.\n\nI stood at the corner with a notebook and wrote nothing. The city was already editing itself.'
      },
      {
        label: 'Revision I',
        date: '2026-09-09',
        text: 'The blue hour is not an hour. It is a negotiation between the streetlamp and the sky. For eleven minutes every window becomes a small stage and every passer-by is an actor who has forgotten the lines.\n\nI stood at the corner with a notebook and wrote nothing. The city was already editing itself. A bus passed. The reflection in its side window carried the whole street away.'
      }
    ],
    notes: []
  }
];

const state = {
  manuscripts: loadArchive(),
  activeId: '',
  layerIndex: 0,
  query: ''
};

function loadArchive() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (error) {}
  return JSON.parse(JSON.stringify(SEED));
}

function saveArchive() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.manuscripts));
  } catch (error) {}
}

function makeId() {
  return `folio-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function roman(number) {
  const map = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let value = Math.max(1, number);
  let output = '';
  for (const [amount, symbol] of map) {
    while (value >= amount) {
      output += symbol;
      value -= amount;
    }
  }
  return output;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function countWords(text) {
  const words = String(text || '').trim().match(/\S+/g);
  return words ? words.length : 0;
}

function activeFolio() {
  return state.manuscripts.find((folio) => folio.id === state.activeId) || state.manuscripts[0];
}

function activeLayer() {
  const folio = activeFolio();
  if (!folio) return null;
  return folio.layers[Math.min(state.layerIndex, folio.layers.length - 1)];
}

function clampLayer() {
  const folio = activeFolio();
  if (!folio) return;
  state.layerIndex = Math.min(state.layerIndex, folio.layers.length - 1);
}

function setActive(id) {
  state.activeId = id;
  state.layerIndex = 0;
  const folio = activeFolio();
  if (folio) state.layerIndex = folio.layers.length - 1;
  renderAll();
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function renderLibrary() {
  const query = state.query.trim().toLowerCase();
  const filtered = state.manuscripts.filter((folio) => {
    if (!query) return true;
    const haystack = `${folio.title} ${folio.layers.map((layer) => layer.text).join(' ')} ${folio.notes.map((note) => note.text).join(' ')}`.toLowerCase();
    return haystack.includes(query);
  });

  $('filter-count').textContent = String(filtered.length).padStart(2, '0');
  $('folio-count').textContent = `${String(state.manuscripts.length).padStart(2, '0')} folios`;
  $('archive-words').textContent = `${state.manuscripts.reduce((total, folio) => total + folio.layers.reduce((sum, layer) => sum + countWords(layer.text), 0), 0).toLocaleString('en-GB')} words archived`;

  const list = $('folio-list');
  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<p class="empty-folios">No folio answers that search.</p>';
    return;
  }

  filtered.forEach((folio) => {
    const index = state.manuscripts.indexOf(folio);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `folio${folio.id === state.activeId ? ' active' : ''}`;
    button.innerHTML = `
      <span class="folio-number">${roman(index + 1)}</span>
      <span><span class="folio-title">${escapeHtml(folio.title)}</span><span class="folio-meta">${folio.layers.length} layer${folio.layers.length === 1 ? '' : 's'} · ${formatDate(folio.layers[folio.layers.length - 1].date)}</span></span>
      <span class="folio-layers">${String(folio.layers.length).padStart(2, '0')}</span>
    `;
    button.addEventListener('click', () => setActive(folio.id));
    list.appendChild(button);
  });
}

function renderPage() {
  const folio = activeFolio();
  if (!folio) return;
  clampLayer();
  const layer = activeLayer();
  const index = state.manuscripts.indexOf(folio);
  $('folio-number').textContent = roman(index + 1);
  $('title-input').value = folio.title;
  $('editor').value = layer.text;
  $('layer-label').textContent = layer.label;
  $('layer-date').textContent = formatDate(layer.date);
  $('edited-label').textContent = `Edited ${formatDate(layer.date)}`;
  $('word-count').textContent = `${countWords(layer.text)} words`;
  $('read-time').textContent = `${Math.max(1, Math.ceil(countWords(layer.text) / 200))} min read`;
  $('layer-count').textContent = `${folio.layers.length} layer${folio.layers.length === 1 ? '' : 's'}`;
  $('revision-note').textContent = `Reading ${layer.label.toLowerCase()} · ${folio.layers.length} layer${folio.layers.length === 1 ? '' : 's'} held`;

  renderNotes();
  renderLayers();
  renderLibrary();
}

function renderNotes() {
  const folio = activeFolio();
  const list = $('note-list');
  list.innerHTML = '';
  $('note-count').textContent = String(folio.notes.length).padStart(2, '0');
  if (!folio.notes.length) {
    list.innerHTML = '<li class="note empty-note"><p>No marginalia yet. The margins are unusually quiet.</p></li>';
    return;
  }
  folio.notes.forEach((note) => {
    const item = document.createElement('li');
    item.className = 'note';
    item.innerHTML = `<p>${escapeHtml(note.text)}</p><small>${formatDate(note.date)}</small><button type="button" aria-label="Remove note">×</button>`;
    item.querySelector('button').addEventListener('click', () => {
      folio.notes = folio.notes.filter((entry) => entry.id !== note.id);
      saveArchive();
      renderPage();
      showToast('Margin note removed');
    });
    list.appendChild(item);
  });
}

function renderLayers() {
  const folio = activeFolio();
  const list = $('layer-list');
  list.innerHTML = '';
  folio.layers.forEach((layer, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `layer${index === state.layerIndex ? ' active' : ''}`;
    button.innerHTML = `
      <span class="layer-index">${roman(index + 1)}</span>
      <span><strong>${escapeHtml(layer.label)}</strong><small>${formatDate(layer.date)} · ${countWords(layer.text)} words</small></span>
    `;
    button.addEventListener('click', () => {
      state.layerIndex = index;
      renderPage();
    });
    item.appendChild(button);
    list.appendChild(item);
  });
}

function renderAll() {
  const folio = activeFolio();
  if (!folio) return;
  state.activeId = folio.id;
  renderPage();
}

function addRevision() {
  const folio = activeFolio();
  const layer = activeLayer();
  const today = new Date().toISOString().slice(0, 10);
  folio.layers.push({
    label: `Revision ${roman(folio.layers.length)}`,
    date: today,
    text: layer.text
  });
  state.layerIndex = folio.layers.length - 1;
  saveArchive();
  renderPage();
  showToast('New layer added');
}

function compareLayers() {
  const folio = activeFolio();
  const first = folio.layers[0];
  const current = activeLayer();
  $('compare-title').textContent = folio.title;
  $('compare-first-label').textContent = `${first.label} · ${formatDate(first.date)}`;
  $('compare-current-label').textContent = `${current.label} · ${formatDate(current.date)}`;
  $('compare-first').textContent = first.text;
  $('compare-current').textContent = current.text;
  $('compare-dialog').showModal();
}

function exportFolio() {
  const folio = activeFolio();
  const layer = activeLayer();
  const text = `${folio.title}\n${layer.label} · ${formatDate(layer.date)}\n\n${layer.text}\n`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${folio.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'folio'}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Current layer exported');
}

function openNewDialog() {
  $('new-title').value = '';
  $('new-text').value = '';
  $('new-dialog').showModal();
  setTimeout(() => $('new-title').focus(), 60);
}

function createFolio(event) {
  event.preventDefault();
  const title = $('new-title').value.trim();
  const text = $('new-text').value.trim();
  if (!title || !text) return;
  const today = new Date().toISOString().slice(0, 10);
  const folio = {
    id: makeId(),
    title,
    created: today,
    layers: [{ label: 'Base impression', date: today, text }],
    notes: []
  };
  state.manuscripts.unshift(folio);
  state.activeId = folio.id;
  state.layerIndex = 0;
  saveArchive();
  $('new-dialog').close();
  renderAll();
  showToast('Folio opened');
}

function bindEvents() {
  $('new-folio').addEventListener('click', openNewDialog);
  $('close-new').addEventListener('click', () => $('new-dialog').close());
  $('new-form').addEventListener('submit', createFolio);
  $('close-compare').addEventListener('click', () => $('compare-dialog').close());
  $('compare').addEventListener('click', compareLayers);
  $('add-revision').addEventListener('click', addRevision);
  $('export').addEventListener('click', exportFolio);

  $('search').addEventListener('input', (event) => {
    state.query = event.target.value;
    renderLibrary();
  });

  $('title-input').addEventListener('input', (event) => {
    activeFolio().title = event.target.value;
    saveArchive();
    renderLibrary();
    renderLayers();
  });

  $('editor').addEventListener('input', (event) => {
    activeLayer().text = event.target.value;
    $('word-count').textContent = `${countWords(event.target.value)} words`;
    $('read-time').textContent = `${Math.max(1, Math.ceil(countWords(event.target.value) / 200))} min read`;
    clearTimeout(bindEvents.saveTimer);
    bindEvents.saveTimer = setTimeout(saveArchive, 350);
  });

  $('note-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('note-input');
    const text = input.value.trim();
    if (!text) return;
    activeFolio().notes.push({
      id: makeId(),
      text,
      date: new Date().toISOString().slice(0, 10)
    });
    input.value = '';
    saveArchive();
    renderPage();
    showToast('Note added to margin');
  });

  $('delete-folio').addEventListener('click', () => {
    if (state.manuscripts.length === 1) {
      showToast('Keep at least one folio');
      return;
    }
    const folio = activeFolio();
    if (!window.confirm(`Discard “${folio.title}”?`)) return;
    state.manuscripts = state.manuscripts.filter((entry) => entry.id !== folio.id);
    state.activeId = state.manuscripts[0].id;
    state.layerIndex = state.manuscripts[0].layers.length - 1;
    saveArchive();
    renderAll();
    showToast('Folio discarded');
  });

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

bindEvents();
const first = state.manuscripts[0];
state.activeId = first.id;
state.layerIndex = first.layers.length - 1;
renderAll();
