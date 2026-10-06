(() => {
  'use strict';

  const root = document.querySelector('[data-calendar]');
  if (!root) return;

  const state = {
    date: new Date(2026, 9, 1),
    selected: new Set(),
    occupied: new Set(['2026-10-18', '2026-10-24']),
    held: new Set(['2026-10-10', '2026-10-31'])
  };

  const pad = (value) => String(value).padStart(2, '0');
  const key = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const monthLabel = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });

  function startOfCalendar(date) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const mondayIndex = (first.getDay() + 6) % 7;
    first.setDate(first.getDate() - mondayIndex);
    return first;
  }

  function render() {
    const start = startOfCalendar(state.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const title = root.querySelector('[data-calendar-title]');
    const grid = root.querySelector('[data-calendar-grid]');
    title.textContent = monthLabel.format(state.date);
    grid.innerHTML = '';

    const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    for (const day of weekdays) {
      const cell = document.createElement('div');
      cell.className = 'calendar-weekday';
      cell.textContent = day;
      grid.appendChild(cell);
    }

    for (let index = 0; index < 42; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-day';
      cell.textContent = String(day.getDate());
      cell.dataset.date = key(day);
      cell.setAttribute('aria-label', new Intl.DateTimeFormat('es-ES', { dateStyle: 'full' }).format(day));

      if (day.getMonth() !== state.date.getMonth()) cell.classList.add('other-month');
      if (day < today) {
        cell.classList.add('past');
        cell.disabled = true;
      }
      if (state.occupied.has(cell.dataset.date)) {
        cell.classList.add('occupied');
        cell.disabled = true;
        cell.title = 'Ocupada';
      } else if (state.held.has(cell.dataset.date)) {
        cell.classList.add('held');
        cell.disabled = true;
        cell.title = 'Retenida';
      } else if (state.selected.has(cell.dataset.date)) {
        cell.classList.add('selected');
        cell.setAttribute('aria-pressed', 'true');
      }

      cell.addEventListener('click', () => {
        if (state.selected.has(cell.dataset.date)) state.selected.delete(cell.dataset.date);
        else state.selected.add(cell.dataset.date);
        render();
      });
      grid.appendChild(cell);
    }
  }

  root.querySelector('[data-calendar-prev]')?.addEventListener('click', () => {
    state.date = new Date(state.date.getFullYear(), state.date.getMonth() - 1, 1);
    render();
  });

  root.querySelector('[data-calendar-next]')?.addEventListener('click', () => {
    state.date = new Date(state.date.getFullYear(), state.date.getMonth() + 1, 1);
    render();
  });

  render();
})();
