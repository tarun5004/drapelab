export function initNavigation() {
  const button = document.querySelector('.mobile');
  const links = document.querySelector('.nav-links');
  const menus = [...links.querySelectorAll('details')];
  function closeMenus() {
    button.setAttribute('aria-expanded', 'false');
    menus.forEach(menu => { menu.open = false; });
  }
  button.addEventListener('click', () => {
    button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') === 'false'));
  });
  for (const menu of menus) {
    menu.addEventListener('toggle', () => {
      if (menu.open) menus.filter(other => other !== menu).forEach(other => { other.open = false; });
    });
  }
  links.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenus();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) closeMenus();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const openMenu = menus.find(menu => menu.open);
    const mobileOpen = button.getAttribute('aria-expanded') === 'true';
    closeMenus();
    if (mobileOpen) button.focus();
    else openMenu?.querySelector('summary').focus();
  });
}
