import { models, settings, poses } from '../gallery/gallery.js';

const tools = [
  { id: 'shoot', name: 'Fashion photoshoot', description: 'Plan a full set of on-model catalog shots.', image: 's1-mustard.webp' },
  { id: 'tryon', name: 'Virtual try-on', description: 'Pair a garment with a model and setting.', image: 's8b-denim-man.webp' },
  { id: 'model', name: 'Model creator', description: 'Explore model references for a consistent cast.', image: 'm-asian-woman.webp' },
  { id: 'angles', name: 'Angle drafts', description: 'Review front, back and side views.', image: 'f-coat-back.webp' },
  { id: 'ghost', name: 'Ghost mannequin', description: 'Explore invisible-mannequin catalog shots.', image: 't-ghost-denim.webp' },
  { id: 'flatlay', name: 'Flat lay', description: 'Preview clean, garment-only photography.', image: 't-flat-coat.webp' },
];

const views = ['Front', 'Back', 'Left', 'Right'];
const angleSamples = [
  ['Front', 'cam-front.webp'], ['Back', 'cam-back.webp'],
  ['Side', 'cam-side.webp'], ['Detail', 'f-coat-detail.webp'],
];

function addOptions(select, items) {
  select.replaceChildren(...items.map(([value, label]) => new Option(label, value)));
}

function createToolCard(tool) {
  const link = document.createElement('a');
  link.href = '#studio';
  link.dataset.tool = tool.id;
  link.className = 'tool-card';
  const image = document.createElement('img');
  image.src = 'assets/' + tool.image;
  image.alt = '';
  image.loading = 'lazy';
  const body = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = tool.name;
  const description = document.createElement('p');
  description.textContent = tool.description;
  body.append(title, description);
  link.append(image, body);
  return link;
}

function sampleCard([name, path]) {
  const card = document.createElement('article');
  const image = document.createElement('img');
  image.src = 'assets/' + path;
  image.alt = 'Prepared sample: ' + name;
  const link = document.createElement('a');
  link.href = image.src;
  link.download = 'drapelab-' + path.split('/').pop();
  link.textContent = 'Download ' + name;
  card.append(image, link);
  return card;
}

export function initStudio() {
  const form = document.querySelector('#studio-form');
  const tool = document.querySelector('#tool');
  const model = document.querySelector('#model');
  const setting = document.querySelector('#background');
  const pose = document.querySelector('#pose');
  const status = document.querySelector('#studio-status');
  const results = document.querySelector('#results');
  addOptions(tool, tools.map(({ id, name }) => [id, name]));
  addOptions(model, models.map(([name]) => [name, name]));
  addOptions(setting, settings.map(([name]) => [name, name]));
  addOptions(pose, poses.map(([name]) => [name, name]));
  document.querySelector('#tool-cards').replaceChildren(...tools.map(createToolCard));
  const previews = new Map();
  const uploads = document.querySelector('#uploads');
  for (const view of views) {
    const label = document.createElement('label');
    label.textContent = view;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.setAttribute('aria-label', view + ' garment photo');
    const image = document.createElement('img');
    image.alt = view + ' upload preview';
    image.hidden = true;
    input.addEventListener('change', () => {
      const previous = previews.get(view);
      if (previous) URL.revokeObjectURL(previous);
      previews.delete(view);
      image.hidden = true;
      image.removeAttribute('src');
      const file = input.files[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
        input.value = '';
        status.textContent = 'Select a JPG, PNG or WebP image under 15 MB.';
        return;
      }
      const url = URL.createObjectURL(file);
      previews.set(view, url);
      image.src = url;
      image.hidden = false;
      status.textContent = view + ' photo added locally.';
    });
    label.append(input, image);
    uploads.append(label);
  }
  function render() {
    const activeTool = tools.find(item => item.id === tool.value);
    const chosenSetting = settings.find(([name]) => name === setting.value);
    const chosenPose = poses.find(([name]) => name === pose.value);
    const chosenModel = models.find(([name]) => name === model.value);
    const toolSamples = {
      shoot: [['Campaign', activeTool.image], chosenSetting, chosenPose],
      tryon: [['Try-on', activeTool.image], chosenModel, chosenSetting],
      model: [chosenModel, chosenPose],
      angles: angleSamples,
      ghost: [['Denim jacket', activeTool.image], ['Kurta', 't-ghost-mustard.webp']],
      flatlay: [['Wool coat', activeTool.image], ['Dress', 't-hanger-dress.webp']],
    };
    results.replaceChildren(...toolSamples[tool.value].map(sampleCard));
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-tool], a[data-model], a[data-setting], a[data-pose]');
    if (!link) return;
    if (link.dataset.tool) tool.value = link.dataset.tool;
    if (link.dataset.setting || link.dataset.pose) tool.value = 'shoot';
    if (link.dataset.setting) setting.value = link.dataset.setting;
    if (link.dataset.pose) pose.value = link.dataset.pose;
    if (link.dataset.model) {
      tool.value = 'model';
      model.value = link.dataset.model;
    }
    render();
  });
  tool.addEventListener('change', () => {
    status.textContent = '';
    render();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    render();
    status.textContent = 'Sample results ready. You can download each example.';
  });
  render();
}
