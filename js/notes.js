const sidebar = document.querySelector("#notes-sidebar");
const toggle = document.querySelector("#sidebar-toggle");
const arrow = toggle.querySelector("span");
const sidebarActions = document.querySelector("#sidebar-actions");
const addNoteButton = document.querySelector("#add-note");
const deleteNoteButton = document.querySelector("#delete-note");
const organizeNotesButton = document.querySelector("#organize-notes");
const sidebarTaskList = document.querySelector("#sidebar-task-list");
const sidebarEventList = document.querySelector("#sidebar-event-list");
const canvas = document.querySelector("#notes-canvas");
const emptyState = document.querySelector("#empty-state");
const noteStatus = document.querySelector("#note-status");

const notes = [];
let selectedNote = null;
let noteNumber = 0;
let isOrganized = false;
const noteStorageKey = "student-productivity-notes";
const taskStorageKey = "student-productivity-tasks";
const calendarStorageKey = "student-productivity-calendar-events";

function readNotes() {
  try {
    const storedNotes = JSON.parse(
      localStorage.getItem(noteStorageKey) || "[]",
    );
    return Array.isArray(storedNotes)
      ? storedNotes.filter((note) => note && typeof note === "object")
      : [];
  } catch {
    return [];
  }
}

function saveNotes() {
  try {
    const storedNotes = notes.map((note) => ({
      id: note.id,
      left: note.left,
      top: note.top,
      width: note.element.style.width || `${note.element.offsetWidth}px`,
      text: note.element.querySelector(".note-text").value,
      items: [...note.element.querySelectorAll("[data-note-item-type]")].map(
        (item) => ({
          type: item.dataset.noteItemType,
          task: item.dataset.task ? JSON.parse(item.dataset.task) : null,
          event: item.dataset.event ? JSON.parse(item.dataset.event) : null,
        }),
      ),
    }));
    localStorage.setItem(noteStorageKey, JSON.stringify(storedNotes));
  } catch {}
}

function readTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem(taskStorageKey) || "[]");
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [];
  }
}

function readCalendarEvents() {
  try {
    const events = JSON.parse(localStorage.getItem(calendarStorageKey) || "[]");
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

function renderSidebarTasks() {
  const tasks = readTasks();
  sidebarTaskList.replaceChildren();
  if (!tasks.length) {
    const emptyTaskState = document.createElement("p");
    emptyTaskState.className =
      "sidebar-label hidden px-2 py-2 text-xs text-slate-400";
    emptyTaskState.textContent = "No tasks yet.";
    sidebarTaskList.append(emptyTaskState);
    return;
  }

  tasks.forEach((task) => {
    const taskCard = document.createElement("div");
    taskCard.className = `group flex cursor-grab items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs font-semibold shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 active:cursor-grabbing ${task.completed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"}`;
    taskCard.draggable = true;
    taskCard.dataset.taskId = task.id;
    taskCard.title = "Drag into a note";

    const marker = document.createElement("span");
    marker.className = `h-2 w-2 shrink-0 rounded-full ${task.completed ? "bg-emerald-500" : "bg-indigo-500"}`;
    const title = document.createElement("span");
    title.className = `min-w-0 flex-1 truncate ${task.completed ? "line-through opacity-70" : ""}`;
    title.textContent = task.title;
    const time = document.createElement("span");
    time.className = "shrink-0 text-[10px] font-medium text-slate-400";
    time.textContent = task.time || "";
    taskCard.append(marker, title, time);
    taskCard.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(
        "application/x-productivity-task",
        JSON.stringify(task),
      );
      event.dataTransfer.setData("text/plain", task.title);
      taskCard.classList.add("opacity-50");
    });
    taskCard.addEventListener("dragend", () =>
      taskCard.classList.remove("opacity-50"),
    );
    sidebarTaskList.append(taskCard);
  });
}

function formatEventDate(event) {
  if (event.start?.date)
    return new Date(`${event.start.date}T12:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  if (event.start?.dateTime)
    return new Date(event.start.dateTime).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  return "";
}

function renderSidebarEvents() {
  const taskIds = new Set(readTasks().map((task) => task.id));
  const uniqueEvents = [
    ...new Map(
      readCalendarEvents()
        .filter((event) => !event.taskId || !taskIds.has(event.taskId))
        .map((event) => [
          event.id ||
            `${event.summary}-${event.start?.dateTime || event.start?.date}`,
          event,
        ]),
    ).values(),
  ];
  sidebarEventList.replaceChildren();
  if (!uniqueEvents.length) {
    const emptyEventState = document.createElement("p");
    emptyEventState.className =
      "sidebar-label hidden px-2 py-2 text-xs text-slate-400";
    emptyEventState.textContent = "No calendar events yet.";
    sidebarEventList.append(emptyEventState);
    return;
  }

  uniqueEvents.forEach((event) => {
    const eventCard = document.createElement("div");
    eventCard.className =
      "group flex cursor-grab items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-2 text-left text-xs font-semibold text-indigo-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 active:cursor-grabbing";
    eventCard.draggable = true;
    eventCard.dataset.eventId = event.id || "";
    eventCard.title = "Drag into a note";
    const marker = document.createElement("span");
    marker.className = "h-2 w-2 shrink-0 rounded-full bg-indigo-500";
    const title = document.createElement("span");
    title.className = "min-w-0 flex-1 truncate";
    title.textContent = event.summary || "Untitled event";
    const date = document.createElement("span");
    date.className = "shrink-0 text-[10px] font-medium text-indigo-700/70";
    date.textContent = formatEventDate(event);
    eventCard.append(marker, title, date);
    eventCard.addEventListener("dragstart", (dragEvent) => {
      dragEvent.dataTransfer.effectAllowed = "copy";
      dragEvent.dataTransfer.setData(
        "application/x-productivity-calendar-event",
        JSON.stringify(event),
      );
      dragEvent.dataTransfer.setData(
        "text/plain",
        event.summary || "Calendar event",
      );
      eventCard.classList.add("opacity-50");
    });
    eventCard.addEventListener("dragend", () =>
      eventCard.classList.remove("opacity-50"),
    );
    sidebarEventList.append(eventCard);
  });
}

function updateStatus() {
  const count = notes.length;
  noteStatus.textContent = `${count} note${count === 1 ? "" : "s"}${selectedNote ? " · 1 selected" : ""}`;
  emptyState.classList.toggle("hidden", count > 0);
}

function selectNote(note) {
  selectedNote = note;
  notes.forEach((item) =>
    item.element.classList.toggle("ring-2", item === note),
  );
  notes.forEach((item) =>
    item.element.classList.toggle("ring-indigo-500", item === note),
  );
  notes.forEach((item) => item.element.classList.toggle("z-10", item === note));
  updateStatus();
}

function refreshLayout() {
  canvas.classList.toggle("grid", isOrganized);
  canvas.classList.toggle("grid-cols-1", isOrganized);
  canvas.classList.toggle("sm:grid-cols-2", isOrganized);
  canvas.classList.toggle("lg:grid-cols-3", isOrganized);
  canvas.classList.toggle("auto-rows-[12px]", isOrganized);

  notes.forEach((note, index) => {
    const currentHeight = note.element.offsetHeight;
    note.element.classList.toggle("relative", isOrganized);
    note.element.classList.toggle("absolute", !isOrganized);
    note.element.classList.toggle("w-full", isOrganized);
    note.element.classList.toggle("m-4", isOrganized);
    note.element.classList.toggle("mb-0", isOrganized);

    if (isOrganized) {
      const noteHeight = Math.max(150, currentHeight);
      const rowSpan = Math.max(12, Math.ceil(noteHeight / 12));
      note.element.style.height = `${noteHeight}px`;
      note.element.style.gridRow = `span ${rowSpan}`;
      note.element.style.left = "";
      note.element.style.top = "";
      note.element.style.width = "";
    } else {
      note.element.style.gridRow = "";
      note.element.style.left = note.left || `${32 + (index % 3) * 240}px`;
      note.element.style.top =
        note.top || `${32 + Math.floor(index / 3) * 190}px`;
      note.element.style.width = note.width || "208px";
    }
  });
}

function createNote(savedNote = {}) {
  noteNumber += 1;
  const note = {
    id: savedNote.id || `note-${Date.now()}-${noteNumber}`,
    left: savedNote.left || `${32 + (notes.length % 3) * 240}px`,
    top: savedNote.top || `${32 + Math.floor(notes.length / 3) * 190}px`,
    width: savedNote.width || "208px",
    element: document.createElement("article"),
  };

  note.element.className =
    "absolute flex min-h-[150px] min-w-[180px] resize overflow-hidden rounded-2xl border border-amber-200 bg-amber-100 p-4 shadow-md transition-shadow hover:shadow-lg";
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
            <div class="note-task-list mt-3 space-y-1.5 border-t border-amber-200 pt-3" aria-label="Tasks in this note">
                <p class="note-task-hint text-xs font-medium text-amber-700/70">Drop tasks here</p>
            </div>
        </div>`;

  canvas.append(note.element);
  notes.push(note);
  note.element.addEventListener("pointerdown", () => selectNote(note));
  note.element
    .querySelector(".delete-single-note")
    .addEventListener("click", (event) => {
      event.stopPropagation();
      deleteNote(note);
    });
  note.element.querySelector(".note-text").value = savedNote.text || "";
  note.element.querySelector(".note-text").addEventListener("input", saveNotes);
  note.element.addEventListener("dragover", (event) => {
    if (
      event.dataTransfer.types.includes("application/x-productivity-task") ||
      event.dataTransfer.types.includes(
        "application/x-productivity-calendar-event",
      )
    ) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      note.element.classList.add("ring-2", "ring-indigo-400");
    }
  });
  note.element.addEventListener("dragleave", () =>
    note.element.classList.remove("ring-2", "ring-indigo-400"),
  );
  note.element.addEventListener("drop", (event) => {
    event.preventDefault();
    note.element.classList.remove("ring-2", "ring-indigo-400");
    try {
      if (
        event.dataTransfer.types.includes("application/x-productivity-task")
      ) {
        const task = JSON.parse(
          event.dataTransfer.getData("application/x-productivity-task"),
        );
        addTaskToNote(note, task);
      } else {
        const calendarEvent = JSON.parse(
          event.dataTransfer.getData(
            "application/x-productivity-calendar-event",
          ),
        );
        addCalendarEventToNote(note, calendarEvent);
      }
    } catch {}
  });
  note.element.addEventListener("pointerup", saveNotes);
  makeDraggable(note);
  (savedNote.items || []).forEach((item) => {
    if (item.type === "task" && item.task) addTaskToNote(note, item.task);
    if (item.type === "event" && item.event)
      addCalendarEventToNote(note, item.event);
  });
  selectNote(note);
  refreshLayout();
  if (!savedNote.id) note.element.querySelector(".note-text").focus();
  saveNotes();
}

function addTaskToNote(note, task) {
  const taskList = note.element.querySelector(".note-task-list");
  if (taskList.querySelector(`[data-task-id="${task.id}"]`)) return;
  taskList.querySelector(".note-task-hint")?.remove();
  const taskChip = document.createElement("div");
  taskChip.className =
    "flex items-center gap-2 rounded-lg bg-amber-200/70 px-2 py-1.5 text-xs font-semibold text-amber-950";
  taskChip.dataset.taskId = task.id;
  taskChip.dataset.noteItemType = "task";
  taskChip.dataset.task = JSON.stringify(task);
  taskChip.draggable = false;
  const marker = document.createElement("span");
  marker.className = `h-2 w-2 shrink-0 rounded-full ${task.completed ? "bg-emerald-500" : "bg-indigo-500"}`;
  const label = document.createElement("span");
  label.className = `min-w-0 flex-1 truncate ${task.completed ? "line-through opacity-60" : ""}`;
  label.textContent = task.title;
  const deadline = document.createElement("span");
  deadline.className = "shrink-0 text-[10px] font-medium text-amber-800/70";
  deadline.textContent = task.time || "";
  taskChip.append(marker, label, deadline);
  taskList.append(taskChip);
  saveNotes();
}

function addCalendarEventToNote(note, event) {
  const taskList = note.element.querySelector(".note-task-list");
  if (
    event.taskId &&
    taskList.querySelector(`[data-task-id="${event.taskId}"]`)
  )
    return;
  if (taskList.querySelector(`[data-event-id="${event.id}"]`)) return;
  taskList.querySelector(".note-task-hint")?.remove();
  const eventChip = document.createElement("div");
  eventChip.className =
    "flex items-center gap-2 rounded-lg bg-indigo-100/80 px-2 py-1.5 text-xs font-semibold text-indigo-950";
  eventChip.dataset.eventId = event.id || "";
  eventChip.dataset.noteItemType = "event";
  eventChip.dataset.event = JSON.stringify(event);
  if (event.taskId) eventChip.dataset.taskId = event.taskId;
  const marker = document.createElement("span");
  marker.className = "h-2 w-2 shrink-0 rounded-full bg-indigo-500";
  const label = document.createElement("span");
  label.className = "min-w-0 flex-1 truncate";
  label.textContent = event.summary || "Untitled event";
  const deadline = document.createElement("span");
  deadline.className = "shrink-0 text-[10px] font-medium text-indigo-800/70";
  deadline.textContent = formatEventDate(event);
  eventChip.append(marker, label, deadline);
  taskList.append(eventChip);
  saveNotes();
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
  saveNotes();
}

function makeDraggable(note) {
  const grip = note.element.querySelector(".note-grip");
  grip.addEventListener("pointerdown", (event) => {
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
      grip.removeEventListener("pointermove", moveNote);
      grip.removeEventListener("pointerup", stopMoving);
      saveNotes();
    };
    grip.addEventListener("pointermove", moveNote);
    grip.addEventListener("pointerup", stopMoving);
  });
}

function setSidebarExpanded(isExpanded) {
  sidebar.classList.toggle("w-72", isExpanded);
  sidebar.classList.toggle("w-16", !isExpanded);
  sidebar.classList.toggle("p-6", isExpanded);
  sidebar.classList.toggle("p-3", !isExpanded);
  sidebarActions.classList.toggle("opacity-0", !isExpanded);
  sidebarActions.classList.toggle("pointer-events-none", !isExpanded);
  sidebarActions.setAttribute("aria-hidden", String(!isExpanded));
  sidebar
    .querySelectorAll(".sidebar-label")
    .forEach((label) => label.classList.toggle("hidden", !isExpanded));
  toggle.setAttribute("aria-expanded", String(isExpanded));
  toggle.setAttribute(
    "aria-label",
    isExpanded ? "Close notes sidebar" : "Open notes sidebar",
  );
  arrow.textContent = isExpanded ? "←" : "→";
}

toggle.addEventListener("click", () => {
  setSidebarExpanded(toggle.getAttribute("aria-expanded") !== "true");
});

addNoteButton.addEventListener("click", createNote);
deleteNoteButton.addEventListener("click", () => {
  if (selectedNote) deleteNote(selectedNote);
});
organizeNotesButton.addEventListener("click", () => {
  isOrganized = true;
  refreshLayout();
  requestAnimationFrame(refreshLayout);
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.target === canvas) {
    selectedNote = null;
    notes.forEach((note) =>
      note.element.classList.remove("ring-2", "ring-indigo-500", "z-10"),
    );
    updateStatus();
  }
});

window.addEventListener("resize", () => {
  if (isOrganized) refreshLayout();
});

window.addEventListener("storage", renderSidebarTasks);
window.addEventListener("tasks-updated", renderSidebarTasks);
window.addEventListener("storage", renderSidebarEvents);
window.addEventListener("calendar-events-updated", renderSidebarEvents);

readNotes().forEach(createNote);
renderSidebarTasks();
renderSidebarEvents();
updateStatus();
