const find = id => document.getElementById(id);
const form = find('shoot-form');
const provider = find('provider');
const key = find('provider-key');
const cast = find('cast');
const status = find('shoot-status');
const shots = [];
const garmentInputs = {};
let models = [];
let configured = {};
let busy = false;

for (const angle of ['front', 'back', 'left', 'right', 'detail']) {
  const label = document.createElement('label');
  label.textContent = angle === 'front' ? 'Front (required)' : angle;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp';
  garmentInputs[angle] = input;
  label.append(input);
  find('references').append(label);
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Start DrapeLab with the FastAPI command in the README.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'The request could not be completed.');
  return data;
}

function configureProvider() {
  const live = provider.value !== 'sample';
  find('credentials').hidden = !live;
  find('consent').checked = false;
  key.value = '';
  find('provider-note').textContent = configured[provider.value]
    ? 'Leave blank to use the key set on your local server.'
    : 'The key stays in this tab and is sent only to your local DrapeLab backend.';
  renderShots();
}

function showModel() {
  const model = models.find(item => item.id === cast.value);
  const preview = find('cast-preview');
  preview.hidden = !model;
  if (model) preview.src = model.image;
}

function addShot() {
  if (shots.length >= 6) {
    status.textContent = 'This shoot supports up to six shots.';
    return;
  }
  shots.push({
    angle: find('angle').value,
    pose: find('shot-pose').value,
    background: find('scene').value,
    crop: find('crop').value,
  });
  renderShots();
}

function button(text, activate) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'button secondary';
  element.textContent = text;
  element.disabled = busy;
  element.addEventListener('click', activate);
  return element;
}

function figure(src, caption) {
  const element = document.createElement('figure');
  const image = document.createElement('img');
  image.src = src;
  image.alt = caption;
  const label = document.createElement('figcaption');
  label.textContent = caption;
  element.append(image, label);
  return element;
}

function renderShots() {
  const estimate = {
    sample: 'Sample mode · no provider charges.',
    fashn: 'Estimated ' + shots.length * 4 + ' FASHN credits for the full list. Each retry is a new generation.',
    gemini: shots.length + ' Gemini image requests. Google bills input and output usage separately.',
  };
  find('estimate').textContent = estimate[provider.value];
  find('shot-list').replaceChildren(...shots.map(shot => {
    const card = document.createElement('article');
    card.className = 'shot-card';
    const title = document.createElement('h3');
    title.textContent = [shot.angle, shot.pose, shot.background, shot.crop].join(' · ');
    card.append(title);
    if (shot.message) {
      const message = document.createElement('p');
      message.textContent = shot.message;
      card.append(message);
    }
    if (shot.result) {
      const results = document.createElement('div');
      results.className = 'form-row';
      results.append(figure(shot.reference, 'Garment reference'), figure(shot.result.image, shot.result.sample ? 'Prepared sample' : 'AI result'));
      const download = document.createElement('a');
      download.href = shot.result.image;
      download.download = 'drapelab-' + shot.angle + '.webp';
      download.textContent = 'Download image';
      card.append(results, download);
    }
    if (shot.result || shot.message) card.append(button('Generate this shot again', () => run([shot])));
    card.append(button('Remove shot', () => {
      if (shot.reference) URL.revokeObjectURL(shot.reference);
      shots.splice(shots.indexOf(shot), 1);
      renderShots();
    }));
    return card;
  }));
}

function buildRequests(selected) {
  if (!selected.length) throw new Error('Add at least one shot.');
  if (provider.value !== 'sample' && (!find('consent').checked || (!key.value.trim() && !configured[provider.value]))) {
    throw new Error('Enter the provider key and confirm the upload and billing before generating.');
  }
  const front = garmentInputs.front.files[0];
  if (!front) throw new Error('Upload a front garment photo first.');
  return selected.map(shot => {
    const matching = garmentInputs[shot.angle]?.files[0];
    const garment = matching || front;
    const body = new FormData();
    const model = cast.value;
    if (!model) throw new Error('Choose a model first.');
    if (model === 'uploaded' && !find('model-photo').files[0]) throw new Error('Upload a person reference.');
    if (shot.pose === 'reference' && !find('pose-photo').files[0]) throw new Error('Upload a pose reference.');
    body.set('brief', JSON.stringify({ provider: provider.value, model, angle: shot.angle, pose: shot.pose, background: shot.background, crop: shot.crop }));
    body.set('garment', garment);
    if (model === 'uploaded') body.set('model_photo', find('model-photo').files[0]);
    if (shot.pose === 'reference') body.set('pose_photo', find('pose-photo').files[0]);
    return { shot, body, garment, estimated: !matching && ['back', 'left', 'right', 'detail'].includes(shot.angle) };
  });
}

async function run(selected) {
  if (busy) return;
  let requests;
  try {
    requests = buildRequests(selected);
  } catch (error) {
    status.textContent = error.message;
    return;
  }
  busy = true;
  const fields = [...form.querySelectorAll('input, select, button')];
  fields.forEach(field => { field.disabled = true; });
  const headers = { 'X-DrapeLab': 'studio' };
  if (key.value.trim()) headers['DrapeLab-Key'] = key.value.trim();
  let completed = 0;
  try {
    for (const { shot, body, garment, estimated } of requests) {
      shot.message = 'Generating…';
      status.textContent = 'Processing ' + shot.angle + ' view…';
      renderShots();
      try {
        const result = await getJson('/api/shots', { method: 'POST', body, headers });
        if (shot.reference) URL.revokeObjectURL(shot.reference);
        shot.reference = URL.createObjectURL(garment);
        shot.result = result;
        shot.message = estimated ? 'AI-estimated angle · matching garment reference was missing.' : '';
        completed++;
      } catch (error) {
        shot.message = error.message;
        renderShots();
        break;
      }
      renderShots();
    }
    status.textContent = completed + ' of ' + requests.length + ' shots ready.';
  } finally {
    busy = false;
    fields.forEach(field => { field.disabled = false; });
    renderShots();
  }
}

provider.addEventListener('change', configureProvider);
cast.addEventListener('change', showModel);
find('model-photo').addEventListener('change', () => {
  if (find('model-photo').files.length) cast.value = 'uploaded';
  showModel();
});
find('add-shot').addEventListener('click', addShot);
form.addEventListener('submit', event => {
  event.preventDefault();
  run(shots.filter(shot => !shot.result));
});

try {
  const [available, state] = await Promise.all([getJson('/api/models'), getJson('/api/providers')]);
  models = available;
  configured = state.configured;
  cast.replaceChildren(...models.map(model => new Option(model.id, model.id)), new Option('My uploaded person', 'uploaded'));
  showModel();
  configureProvider();
  addShot();
} catch (error) {
  status.textContent = error.message;
}
