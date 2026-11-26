export const models = [
  ['Avery', 'm-pk-woman.webp'], ['Jordan', 'm-black-man.webp'],
  ['Mina', 'm-asian-woman.webp'], ['Ari', 'm-pk-man.webp'], ['Ellis', 'm-white-woman.webp'],
];

export const settings = [
  ['Studio', 's6-coat-asian.webp'], ['Neon Rain', 'templates/neon_rain.webp'],
  ['Giant Moon', 'templates/giant_moon.webp'], ['Palace Morning', 'templates/palace_morning.webp'],
  ['Desert Wind', 'templates/desert_wind.webp'], ['Petal Storm', 'templates/petal_storm.webp'],
  ['Flash Arrival', 'templates/flash_arrival.webp'], ['Storm Cliff', 'templates/storm_cliff.webp'],
  ['Grand Ballroom', 'templates/grand_ballroom.webp'], ['Ember Smoke', 'templates/ember_smoke.webp'],
  ['Paris 1970', 'templates/paris_film.webp'], ['Underwater Dream', 'templates/underwater_dream.webp'],
  ['Flower Cathedral', 'templates/flower_cathedral.webp'], ['Snow Peak', 'templates/snow_peak.webp'],
  ['Mirror Room', 'templates/mirror_room.webp'], ['Skyline Dusk', 'templates/skyline_dusk.webp'],
  ['Disco 70s', 'templates/disco_seventies.webp'],
];

export const poses = [
  ['Power Pose', 'cutouts/f_full_pose.webp'], ['Crossed Arms', 'cutouts/m_upper_arms.webp'],
  ['Vogue Cover', 'cutouts/f_ultra_vogue.webp'], ['Action Step', 'cutouts/m_full_action.webp'],
  ['Fabric Toss', 'cutouts/f_cine_motion.webp'], ['Adjusting Fit', 'cutouts/m_upper_tie.webp'],
  ['Hair Motion', 'cutouts/f_upper_hair.webp'], ['Hero Low Angle', 'cutouts/m_cine_low.webp'],
  ['Gala Flash', 'cutouts/f_ultra_gala.webp'], ['Neon Cyber', 'cutouts/m_ultra_neon.webp'],
  ['Street Walk', 'cutouts/f_full_walk.webp'], ['Wall Lean', 'cutouts/m_full_lean.webp'],
];

const garments = [
  ['Mustard kurta', 'in-kurta-mustard.webp', 's1-mustard.webp'],
  ['Wool coat', 't-flat-coat.webp', 's6-coat-asian.webp'],
  ['Denim jacket', 't-ghost-denim.webp', 's8b-denim-man.webp'],
  ['Printed dress', 't-hanger-dress.webp', 's5-dress-bw.webp'],
];

const angles = [
  ['Front', 'cam-front.webp'], ['Side', 'cam-side.webp'],
  ['Back', 'cam-back.webp'], ['Detail', 'f-coat-detail.webp'],
];

function options(container, items, onSelect) {
  const buttons = items.map(([name]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    return button;
  });
  function select(index) {
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    onSelect(items[index]);
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
  container.replaceChildren(...buttons);
  select(0);
}

function figure([name, path]) {
  const element = document.createElement('figure');
  const image = document.createElement('img');
  image.src = 'assets/' + path;
  image.alt = name;
  image.loading = 'lazy';
  const caption = document.createElement('figcaption');
  caption.textContent = name;
  element.append(image, caption);
  return element;
}

export function initGallery() {
  const before = document.querySelector('#before-image');
  const after = document.querySelector('#after-image');
  options(document.querySelector('#comparison-options'), garments, ([name, input, output]) => {
    before.src = 'assets/' + input;
    after.src = 'assets/' + output;
    before.alt = 'Original photo of ' + name.toLowerCase();
    after.alt = 'On-model sample of ' + name.toLowerCase();
  });
  const slider = document.querySelector('#compare-slider');
  slider.addEventListener('input', () => {
    document.querySelector('.comparison').style.setProperty('--position', slider.value + '%');
  });
  options(document.querySelector('#angle-options'), angles, ([name, path]) => {
    const image = document.querySelector('#angle-image');
    image.src = 'assets/' + path;
    image.alt = name + ' view of the pink wool coat';
    document.querySelector('#angle-caption').textContent = name + ' view';
  });
  document.querySelector('#model-gallery').replaceChildren(...models.map(model => {
    const card = figure(model);
    const link = document.createElement('a');
    link.href = '#studio';
    link.dataset.model = model[0];
    link.textContent = 'Select ' + model[0];
    card.querySelector('figcaption').replaceChildren(link);
    return card;
  }));
  const lookGallery = document.querySelector('#look-gallery');
  const lookButtons = [...document.querySelectorAll('[data-look]')];
  function showLooks(category) {
    const items = category === 'settings' ? settings : poses;
    lookGallery.replaceChildren(...items.map(figure));
    lookGallery.scrollLeft = 0;
    lookButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.look === category)));
  }
  lookButtons.forEach(button => button.addEventListener('click', () => showLooks(button.dataset.look)));
  showLooks('settings');
}
