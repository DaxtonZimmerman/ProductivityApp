
(() => {
    const key = "student-productivity-tasks";
    const $ = (selector) => document.querySelector(selector);
    let filter = "all";
    function readTasks() {
        try {
            const value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value.filter(t => t && typeof t === "object").map(t => ({...t, title: t.title ?? t.text ?? "Untitled task", completed: t.completed ?? t.done ?? false})) : [];
        } catch { return []; }
    }
    function save(tasks) {
        try { localStorage.setItem(key, JSON.stringify(tasks)); $("#task-error").hidden = true; return true; }
        catch { $("#task-error").textContent = "Your browser could not save this change. Check your browser storage settings and try again."; $("#task-error").hidden = false; return false; }
    }
    function deadline(task) {
        if (!task.date) return "No deadline";
        const date = new Date(`${task.date}T${task.time || "12:00"}`);
        if (Number.isNaN(date.getTime())) return "No deadline";
        return date.toLocaleDateString(undefined, {month:"short", day:"numeric"}) + (task.time ? " · " + date.toLocaleTimeString(undefined, {hour:"numeric", minute:"2-digit"}) : "");
    }
    function empty(list, title, detail) {
        const li = document.createElement("li"); li.className = "empty-state";
        const heading = document.createElement("strong"); heading.textContent = title;
        li.append(heading, document.createTextNode(detail)); list.append(li);
    }
    function render() {
        const tasks = readTasks(); const completed = tasks.filter(t => t.completed).length;
        $("#total-count").textContent = tasks.length;
        $("#complete-count").textContent = completed;
        $("#remaining-count").textContent = tasks.length - completed;
        const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
        $("#progress").textContent = `${percent}%`;
        $("#progress-ring").style.setProperty("--progress", `${percent}%`);
        $("#progress-text").textContent = tasks.length ? `${completed} of ${tasks.length} tasks complete` : "No tasks yet.";
        const list = $("#task-list"); list.replaceChildren();
        const visible = tasks.filter(t => filter === "all" || (filter === "completed" ? t.completed : !t.completed));
        if (!visible.length) empty(list, tasks.length ? "No matching tasks." : "No tasks yet.", tasks.length ? "Try another filter to see your tasks." : "Add a task above.");
        visible.forEach((task, index) => {
            const row = document.createElement("li"); row.className = "task-row" + (task.completed ? " done" : "");
            const check = document.createElement("input"); check.type = "checkbox"; check.checked = task.completed; check.id = `dashboard-task-${index}`;
            check.addEventListener("change", () => {
                const updated = readTasks().map(t => t.id === task.id ? {...t, completed: check.checked, done: check.checked} : t);
                if (save(updated)) $("#task-status").textContent = check.checked ? "Task completed." : "Task marked incomplete.";
                render(); document.getElementById(check.id)?.focus();
            });
            const details = document.createElement("div"); details.className = "task-details";
            const label = document.createElement("label"); label.htmlFor = check.id; label.textContent = task.title;
            const meta = document.createElement("small"); meta.textContent = deadline(task); details.append(label, meta);
            const remove = document.createElement("button"); remove.type = "button"; remove.className = "delete-task"; remove.textContent = "Delete"; remove.setAttribute("aria-label", `Delete ${task.title}`);
            remove.addEventListener("click", () => { if (save(readTasks().filter(t => t.id !== task.id))) $("#task-status").textContent = "Task deleted."; render(); $("#task-input").focus(); });
            row.append(check, details, remove); list.append(row);
        });
        const upcoming = $("#upcoming-list"); upcoming.replaceChildren();
        const today = new Date(); today.setHours(0,0,0,0);
        const scheduled = tasks.filter(t => !t.completed && t.date && new Date(`${t.date}T${t.time || "23:59"}`) >= today).sort((a,b) => (a.date + (a.time || "23:59")).localeCompare(b.date + (b.time || "23:59"))).slice(0,3);
        if (!scheduled.length) empty(upcoming, "No upcoming deadlines.", "Add a deadline on the Tasks page to see it here.");
        scheduled.forEach(t => { const row = document.createElement("li"); row.className = "upcoming-row"; const title = document.createElement("a"); title.href = "tasks.html"; title.textContent = t.title; const date = document.createElement("span"); date.textContent = deadline(t); row.append(title,date); upcoming.append(row); });
    }
    $("#date").textContent = new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date());
    $("#task-form").addEventListener("submit", event => {
        event.preventDefault(); const title = $("#task-input").value.trim(); if (!title) return;
        if (save([{id:crypto.randomUUID(), title, completed:false, date:"", time:"", createdAt:new Date().toISOString()}, ...readTasks()])) {
            $("#task-form").reset(); filter = "all"; updateFilters(); render(); $("#task-status").textContent = "Task added."; $("#task-input").focus();
        }
    });
    function updateFilters() { document.querySelectorAll("[data-filter]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.filter === filter))); }
    document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => { filter = b.dataset.filter; updateFilters(); render(); }));
    window.addEventListener("storage", event => { if (event.key === key || event.key === null) render(); });
    render();
})();
