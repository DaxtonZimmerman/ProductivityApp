const sidebar = document.querySelector('#notes-sidebar');
const toggle = document.querySelector('#sidebar-toggle');
const arrow = toggle.querySelector('span');

function setSidebarExpanded(isExpanded) {
    sidebar.classList.toggle('w-1/4', isExpanded);
    sidebar.classList.toggle('w-12', !isExpanded);
    sidebar.classList.toggle('p-6', isExpanded);
    sidebar.classList.toggle('p-3', !isExpanded);
    toggle.setAttribute('aria-expanded', String(isExpanded));
    toggle.setAttribute('aria-label', isExpanded ? 'Close notes sidebar' : 'Open notes sidebar');
    arrow.textContent = isExpanded ? '←' : '→';
}

toggle.addEventListener('click', () => {
    setSidebarExpanded(toggle.getAttribute('aria-expanded') !== 'true');
});
