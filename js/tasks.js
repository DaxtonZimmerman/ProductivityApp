const taskStorageKey = "student-productivity-tasks";
const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskDate = document.querySelector("#task-date");
const taskTime = document.querySelector("#task-time");
const taskError = document.querySelector("#task-error");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const progress = document.querySelector("#progress");
const progressBar = document.querySelector("#progress-bar");
const progressText = document.querySelector("#progress-text");
const filterButtons = document.querySelectorAll("[data-filter]");
let activeFilter = "all";

function readTasks() {
    try {
        const storedTasks = JSON.parse(localStorage.getItem(taskStorageKey) || "[]");
        return Array.isArray(storedTasks) ? storedTasks : [];
    } catch {
        return [];
    }
}

function saveTasks(tasks) {
    localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent("tasks-updated", { detail: tasks }));
}

function getTimeOfDay(time) {
    if (!time) return "anytime";
    const hour = Number(time.split(":")[0]);
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
}

function formatDeadline(task) {
    if (!task.date && !task.time) return "No deadline";
    if (!task.date) return `At ${task.time}`;
    const date = new Date(`${task.date}T${task.time || "12:00"}`);
    const formattedDate = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return task.time ? `${formattedDate} · ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : formattedDate;
}

function dayPartLabel(task) {
    const dayPart = getTimeOfDay(task.time);
    return dayPart === "anytime" ? "Anytime" : dayPart[0].toUpperCase() + dayPart.slice(1);
}

function updateProgress(tasks) {
    const completed = tasks.filter((task) => task.completed).length;
    const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    progress.textContent = `${percentage}%`;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = tasks.length ? `${completed} of ${tasks.length} task${tasks.length === 1 ? "" : "s"} complete.` : "No tasks yet. Start small.";
    taskCount.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
}

function taskBadgeClass(task) {
    const dayPart = getTimeOfDay(task.time);
    if (dayPart === "morning") return "bg-amber-100 text-amber-800";
    if (dayPart === "afternoon") return "bg-sky-100 text-sky-800";
    if (dayPart === "evening") return "bg-violet-100 text-violet-800";
    return "bg-slate-100 text-slate-700";
}

function renderTasks() {
    const tasks = readTasks();
    updateProgress(tasks);
    taskList.replaceChildren();
    const visibleTasks = tasks
        .filter((task) => activeFilter === "all" || getTimeOfDay(task.time) === activeFilter)
        .sort((first, second) => {
            if (first.completed !== second.completed) return Number(first.completed) - Number(second.completed);
            return (first.date || "9999-12-31").localeCompare(second.date || "9999-12-31") || (first.time || "99:99").localeCompare(second.time || "99:99");
        });

    if (!visibleTasks.length) {
        const emptyState = document.createElement("p");
        emptyState.className = "rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500";
        emptyState.textContent = activeFilter === "all" ? "No tasks yet. Add one above." : `No ${activeFilter} tasks yet.`;
        taskList.append(emptyState);
        return;
    }

    visibleTasks.forEach((task) => {
        const item = document.createElement("article");
        item.className = `group flex items-center gap-3 rounded-xl border p-4 transition hover:shadow-sm ${task.completed ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"}`;
        item.draggable = true;
        item.dataset.taskId = task.id;
        item.title = "Drag this task into a note";

        const checkbox = document.createElement("button");
        checkbox.className = `flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-indigo-500"}`;
        checkbox.type = "button";
        checkbox.setAttribute("aria-label", task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`);
        checkbox.textContent = "✓";
        checkbox.addEventListener("click", () => {
            const updatedTasks = readTasks().map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item);
            saveTasks(updatedTasks);
            renderTasks();
        });

        const details = document.createElement("div");
        details.className = "min-w-0 flex-1";
        const title = document.createElement("p");
        title.className = `truncate font-medium ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`;
        title.textContent = task.title;
        const meta = document.createElement("div");
        meta.className = "mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500";
        const deadline = document.createElement("span");
        deadline.textContent = formatDeadline(task);
        const badge = document.createElement("span");
        badge.className = `rounded-full px-2 py-0.5 font-semibold ${taskBadgeClass(task)}`;
        badge.textContent = dayPartLabel(task);
        meta.append(deadline, badge);
        details.append(title, meta);

        const deleteButton = document.createElement("button");
        deleteButton.className = "rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-rose-50 hover:text-rose-600";
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            saveTasks(readTasks().filter((item) => item.id !== task.id));
            renderTasks();
        });

        item.append(checkbox, details, deleteButton);
        item.addEventListener("dragstart", (event) => {
            event.dataTransfer.effectAllowed = "copy";
            event.dataTransfer.setData("application/x-productivity-task", JSON.stringify(task));
            event.dataTransfer.setData("text/plain", task.title);
            item.classList.add("opacity-50");
        });
        item.addEventListener("dragend", () => item.classList.remove("opacity-50"));
        taskList.append(item);
    });
}

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    taskError.classList.add("hidden");
    if (taskTime.value && !taskDate.value) {
        taskError.textContent = "Choose a date when adding a time so this task can appear on the calendar.";
        taskError.classList.remove("hidden");
        return;
    }
    const task = {
        id: `task-${Date.now()}`,
        title: taskInput.value.trim(),
        date: taskDate.value,
        time: taskTime.value,
        completed: false,
        createdAt: new Date().toISOString()
    };
    saveTasks([task, ...readTasks()]);
    taskForm.reset();
    renderTasks();
    taskInput.focus();
});

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        filterButtons.forEach((item) => {
            const isActive = item === button;
            item.classList.toggle("bg-slate-900", isActive);
            item.classList.toggle("text-white", isActive);
            item.classList.toggle("text-slate-600", !isActive);
            item.setAttribute("aria-selected", String(isActive));
        });
        renderTasks();
    });
});

window.addEventListener("storage", renderTasks);
window.addEventListener("tasks-updated", renderTasks);
renderTasks();
