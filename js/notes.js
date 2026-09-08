const sidebar = document.querySelector('#notes-sidebar');
const toggle = document.querySelector('#sidebar-toggle');
const arrow = toggle.querySelector('span');
const sidebarActions = document.querySelector('#sidebar-actions');
const addNoteButton = document.querySelector('#add-note');
const deleteNoteButton = document.querySelector('#delete-note');
const organizeNotesButton = document.querySelector('#organize-notes');
const canvas = document.querySelector('#notes-canvas');
const emptyState = document.querySelector('#empty-state');
const noteStatus = document.querySelector('#note-status');

const notes = [];
let selectedNote = null;
let noteNumber = 0;
let isOrganized = false;

function updateStatus() {
    const count = notes.length;
    noteStatus.textContent = `${count} note${count === 1 ? '' : 's'}${selectedNote ? ' · 1 selected' : ''}`;
    emptyState.classList.toggle('hidden', count > 0);
}

function selectNote(note) {
    selectedNote = note;
    notes.forEach((item) => item.element.classList.toggle('ring-2', item === note));
    notes.forEach((item) => item.element.classList.toggle('ring-indigo-500', item === note));
    notes.forEach((item) => item.element.classList.toggle('z-10', item === note));
    updateStatus();
}

function refreshLayout() {
    canvas.classList.toggle('grid', isOrganized);
    canvas.classList.toggle('grid-cols-1', isOrganized);
    canvas.classList.toggle('sm:grid-cols-2', isOrganized);
    canvas.classList.toggle('lg:grid-cols-3', isOrganized);
    canvas.classList.toggle('auto-rows-[12px]', isOrganized);

    notes.forEach((note, index) => {
        const currentHeight = note.element.offsetHeight;
        note.element.classList.toggle('relative', isOrganized);
        note.element.classList.toggle('absolute', !isOrganized);
        note.element.classList.toggle('w-full', isOrganized);
        note.element.classList.toggle('m-4', isOrganized);
        note.element.classList.toggle('mb-0', isOrganized);

        if (isOrganized) {
            const noteHeight = Math.max(150, currentHeight);
            const rowSpan = Math.max(12, Math.ceil(noteHeight / 12));
            note.element.style.height = `${noteHeight}px`;
            note.element.style.gridRow = `span ${rowSpan}`;
            note.element.style.left = '';
            note.element.style.top = '';
            note.element.style.width = '';
        } else {
            note.element.style.gridRow = '';
            note.element.style.left = note.left || `${32 + (index % 3) * 240}px`;
            note.element.style.top = note.top || `${32 + Math.floor(index / 3) * 190}px`;
            note.element.style.width = note.width || '208px';
        }
    });
}

function createNote() {
    noteNumber += 1;
    const note = {
        id: `note-${Date.now()}-${noteNumber}`,
        left: `${32 + (notes.length % 3) * 240}px`,
        top: `${32 + Math.floor(notes.length / 3) * 190}px`,
        width: '208px',
        element: document.createElement('article')
    };

    note.element.className = 'absolute flex min-h-[150px] min-w-[180px] resize overflow-hidden rounded-2xl border border-amber-200 bg-amber-100 p-4 shadow-md transition-shadow hover:shadow-lg';
    note.element.style.left = note.left;
    note.element.style.top = note.top;
    note.element.style.width = note.width;
    note.element.dataset.noteId = note.id;
    note.element.innerHTML = `
        <div class="flex min-w-0 flex-1 flex-col">
            <div class="mb-3 flex items-center justify-between gap-2">
                <span class="note-grip cursor-grab text-xs font-bold uppercase tracking-widest text-amber-700" title="Drag to move">Note</span>
                <button class="delete-single-note rounded-md px-1.5 text-lg leading-none text-amber-700 transition hover:bg-amber-200 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500" type="button" title="Delete this note" aria-label="Delete this note">×</button>
            </div>
            <textarea class="note-text min-h-0 flex-1 resize-none border-0 bg-transparent text-sm leading-6 text-amber-950 outline-none placeholder:text-amber-700/60" placeholder="Write something..." aria-label="Note text"></textarea>
        </div>`;

    canvas.append(note.element);
    notes.push(note);
    note.element.addEventListener('pointerdown', () => selectNote(note));
    note.element.querySelector('.delete-single-note').addEventListener('click', (event) => {
        event.stopPropagation();
        deleteNote(note);
    });
    makeDraggable(note);
    selectNote(note);
    refreshLayout();
    note.element.querySelector('.note-text').focus();
}

function deleteNote(note) {
    const noteIndex = notes.indexOf(note);
    if (noteIndex === -1) return;
    note.element.remove();
    notes.splice(noteIndex, 1);
    selectedNote = notes[noteIndex - 1] || notes[noteIndex] || null;
    if (selectedNote) selectNote(selectedNote);
    refreshLayout();
    updateStatus();
}

function makeDraggable(note) {
    const grip = note.element.querySelector('.note-grip');
    grip.addEventListener('pointerdown', (event) => {
        if (isOrganized) return;
        event.preventDefault();
        grip.setPointerCapture(event.pointerId);
        const startX = event.clientX;
        const startY = event.clientY;
        const initialLeft = note.element.offsetLeft;
        const initialTop = note.element.offsetTop;

        const moveNote = (moveEvent) => {
            note.left = `${Math.max(8, initialLeft + moveEvent.clientX - startX)}px`;
            note.top = `${Math.max(8, initialTop + moveEvent.clientY - startY)}px`;
            note.element.style.left = note.left;
            note.element.style.top = note.top;
        };
        const stopMoving = () => {
            grip.removeEventListener('pointermove', moveNote);
            grip.removeEventListener('pointerup', stopMoving);
        };
        grip.addEventListener('pointermove', moveNote);
        grip.addEventListener('pointerup', stopMoving);
    });
}

function setSidebarExpanded(isExpanded) {
    sidebar.classList.toggle('w-72', isExpanded);
    sidebar.classList.toggle('w-16', !isExpanded);
    sidebar.classList.toggle('p-6', isExpanded);
    sidebar.classList.toggle('p-3', !isExpanded);
    sidebarActions.classList.toggle('opacity-0', !isExpanded);
    sidebarActions.classList.toggle('pointer-events-none', !isExpanded);
    sidebarActions.setAttribute('aria-hidden', String(!isExpanded));
    sidebar.querySelectorAll('.sidebar-label').forEach((label) => label.classList.toggle('hidden', !isExpanded));
    toggle.setAttribute('aria-expanded', String(isExpanded));
    toggle.setAttribute('aria-label', isExpanded ? 'Close notes sidebar' : 'Open notes sidebar');
    arrow.textContent = isExpanded ? '←' : '→';
}

toggle.addEventListener('click', () => {
    setSidebarExpanded(toggle.getAttribute('aria-expanded') !== 'true');
});

addNoteButton.addEventListener('click', createNote);
deleteNoteButton.addEventListener('click', () => {
    if (selectedNote) deleteNote(selectedNote);
});
organizeNotesButton.addEventListener('click', () => {
    isOrganized = true;
    refreshLayout();
    requestAnimationFrame(refreshLayout);
});

canvas.addEventListener('pointerdown', (event) => {
    if (event.target === canvas) {
        selectedNote = null;
        notes.forEach((note) => note.element.classList.remove('ring-2', 'ring-indigo-500', 'z-10'));
        updateStatus();
    }
});

window.addEventListener('resize', () => {
    if (isOrganized) refreshLayout();
});

updateStatus();
