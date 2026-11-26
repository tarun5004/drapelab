import { models } from '../gallery/gallery.js';

const groups = {
  Garments: [['Pink wool coat', 't-flat-coat.webp'], ['Denim jacket', 't-ghost-denim.webp'], ['Mustard kurta', 'in-kurta-mustard.webp']],
  Models: models,
  Photos: [['Wool coat back view', 'f-coat-back.webp'], ['Denim lifestyle', 's9-denim-woman.webp'], ['Mustard kurta detail', 'f-mustard-detail.webp']],
};

export function initLibrary() {
  const search = document.querySelector('#library-search');
  const categories = document.querySelector('#library-categories');
  const results = document.querySelector('#library-results');
  const names = ['All', ...Object.keys(groups)];
  let category = 'All';

  function render() {
    const items = category === 'All' ? Object.values(groups).flat() : groups[category];
    const query = search.value.trim().toLowerCase();
    const cards = items.filter(([name]) => name.toLowerCase().includes(query)).map(([name, path]) => {
      const card = document.createElement('figure');
      const image = document.createElement('img');
      image.src = 'assets/' + path;
      image.loading = 'lazy';
      image.alt = '';
      const caption = document.createElement('figcaption');
      caption.textContent = name;
      card.append(image, caption);
      return card;
    });
    if (!cards.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No sample assets match your search.';
      cards.push(empty);
    }
    results.replaceChildren(...cards);
  }

  const buttons = names.map(name => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.setAttribute('aria-pressed', String(name === category));
    button.addEventListener('click', () => {
      category = name;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      render();
    });
    return button;
  });
  categories.replaceChildren(...buttons);
  search.addEventListener('input', render);
  render();
}
