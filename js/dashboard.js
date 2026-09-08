(() => {
  const key = "student-productivity-tasks";
  const calendarKey = "student-productivity-calendar-events";
  const $ = (selector) => document.querySelector(selector);
  let filter = "all";
  function readTasks() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value)
        ? value
            .filter((t) => t && typeof t === "object")
            .map((t) => ({
              ...t,
              title: t.title ?? t.text ?? "Untitled task",
              completed: t.completed ?? t.done ?? false,
            }))
        : [];
    } catch {
      return [];
    }
  }
  function save(tasks) {
    try {
      localStorage.setItem(key, JSON.stringify(tasks));
      $("#task-error").hidden = true;
      return true;
    } catch {
      $("#task-error").textContent =
        "Your browser could not save this change. Check your browser storage settings and try again.";
      $("#task-error").hidden = false;
      return false;
    }
  }
  function deadline(task) {
    if (!task.date) return "No deadline";
    const date = new Date(`${task.date}T${task.time || "12:00"}`);
    if (Number.isNaN(date.getTime())) return "No deadline";
    return (
      date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      (task.time
        ? " · " +
          date.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })
        : "")
    );
  }
  function empty(list, title, detail) {
    const li = document.createElement("li");
    li.className = "empty-state px-2.5 py-8 text-center text-xs text-[#9298a6]";
    const heading = document.createElement("strong");
    heading.className = "mb-1 block text-[.82rem] text-[#28354b]";
    heading.textContent = title;
    li.append(heading, document.createTextNode(detail));
    list.append(li);
  }
  function readCalendarEvents() {
    try {
      const events = JSON.parse(localStorage.getItem(calendarKey) || "[]");
      const tasks = readTasks()
        .filter((task) => task.date)
        .map((task) => ({
          id: `task-${task.id}`,
          summary: task.title,
          start: { dateTime: `${task.date}T${task.time || "23:59"}` },
          localTask: true,
        }));
      return [...(Array.isArray(events) ? events : []), ...tasks];
    } catch {
      return [];
    }
  }
  function eventDate(event) {
    if (event.start?.date) {
      const [year, month, day] = event.start.date.split("-").map(Number);
      return new Date(year, month - 1, day, 23, 59);
    }
    return new Date(event.start?.dateTime || "");
  }
  function isValidEventDate(event) {
    return !Number.isNaN(eventDate(event).getTime());
  }
  function renderUpcomingEvents() {
    const list = $("#upcoming-list");
    if (!list) return;
    const now = new Date();
    const events = readCalendarEvents()
      .filter(
        (event) =>
          event &&
          event.start &&
          isValidEventDate(event) &&
          eventDate(event) >= now,
      )
      .sort((a, b) => eventDate(a) - eventDate(b))
      .slice(0, 4);
    list.replaceChildren();
    if (!events.length) {
      empty(
        list,
        "No upcoming events.",
        "Connect your calendar or add task deadlines.",
      );
      return;
    }
    events.forEach((event) => {
      const item = document.createElement("li");
      item.className =
        "upcoming-row grid grid-cols-[70px_minmax(0,1fr)] gap-2.5 border-b border-[#edf0f5] py-3.5 text-[.7rem]";
      const date = document.createElement("span");
      date.className = "text-[.65rem] text-[#737b8d]";
      date.textContent = eventDate(event).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const details = document.createElement("div");
      const title = document.createElement("strong");
      title.className = "block break-words text-xs font-semibold";
      title.textContent = event.summary || "Untitled event";
      const time = document.createElement("small");
      time.className = "mt-1 block text-[.65rem] text-[#9298a6]";
      time.textContent = event.start.date
        ? "All day"
        : eventDate(event).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          });
      details.append(title, time);
      item.append(date, details);
      list.append(item);
    });
  }
  function render() {
    const tasks = readTasks();
    const completed = tasks.filter((t) => t.completed).length;
    $("#total-count").textContent = tasks.length;
    $("#complete-count").textContent = completed;
    $("#remaining-count").textContent = tasks.length - completed;
    const percent = tasks.length
      ? Math.round((completed / tasks.length) * 100)
      : 0;
    $("#progress").textContent = `${percent}%`;
    $("#priority-progress").textContent = `${percent}%`;
    $("#additional-progress").textContent =
      `${tasks.length ? Math.round(((tasks.length - completed) / tasks.length) * 100) : 0}%`;
    $("#progress-ring").style.setProperty("--progress", `${percent}%`);
    $("#progress-text").textContent = tasks.length
      ? `${completed} of ${tasks.length} tasks complete`
      : "No tasks yet.";
    const list = $("#task-list");
    list.replaceChildren();
    const visible = tasks.filter(
      (t) =>
        filter === "all" ||
        (filter === "completed" ? t.completed : !t.completed),
    );
    if (!visible.length)
      empty(
        list,
        tasks.length ? "No matching tasks." : "No tasks yet.",
        tasks.length
          ? "Try another filter to see your tasks."
          : "Add a task above.",
      );
    visible.forEach((task, index) => {
      const row = document.createElement("li");
      row.className =
        "task-row flex items-center gap-2.5 border-b border-[#f0f1f5] py-3 text-xs" +
        (task.completed ? " done" : "");
      const check = document.createElement("input");
      check.className = "h-[17px] w-[17px] accent-[#4b7df0]";
      check.type = "checkbox";
      check.checked = task.completed;
      check.id = `dashboard-task-${index}`;
      check.addEventListener("change", () => {
        const updated = readTasks().map((t) =>
          t.id === task.id
            ? { ...t, completed: check.checked, done: check.checked }
            : t,
        );
        if (save(updated))
          $("#task-status").textContent = check.checked
            ? "Task completed."
            : "Task marked incomplete.";
        render();
        document.getElementById(check.id)?.focus();
      });
      renderUpcomingEvents();
      const details = document.createElement("div");
      details.className = "task-details min-w-0 flex-1 break-words";
      const label = document.createElement("label");
      label.className = "cursor-pointer";
      label.htmlFor = check.id;
      label.textContent = task.title;
      const meta = document.createElement("small");
      meta.className = "mt-1 block text-[.68rem] text-[#9298a6]";
      meta.textContent = deadline(task);
      details.append(label, meta);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className =
        "delete-task min-h-8 border-0 bg-transparent p-1 text-[.68rem] text-[#a26670]";
      remove.textContent = "Delete";
      remove.setAttribute("aria-label", `Delete ${task.title}`);
      remove.addEventListener("click", () => {
        if (save(readTasks().filter((t) => t.id !== task.id)))
          $("#task-status").textContent = "Task deleted.";
        render();
        $("#task-input").focus();
      });
      row.append(check, details, remove);
      list.append(row);
    });
  }
  const dateLabel = $("#date");
  if (dateLabel)
    dateLabel.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  $("#task-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = $("#task-input").value.trim();
    if (!title) return;
    if (
      save([
        {
          id: crypto.randomUUID(),
          title,
          completed: false,
          date: "",
          time: "",
          createdAt: new Date().toISOString(),
        },
        ...readTasks(),
      ])
    ) {
      $("#task-form").reset();
      filter = "all";
      updateFilters();
      render();
      $("#task-status").textContent = "Task added.";
      $("#task-input").focus();
    }
  });
  function updateFilters() {
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.filter === filter)),
      );
  }
  document.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      filter = b.dataset.filter;
      updateFilters();
      render();
    }),
  );
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === calendarKey || event.key === null)
      render();
  });
  window.addEventListener("calendar-events-updated", renderUpcomingEvents);
  window.addEventListener("pageshow", renderUpcomingEvents);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") renderUpcomingEvents();
  });
  render();
})();
