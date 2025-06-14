document.addEventListener('DOMContentLoaded', () => {
  const calendarGrid = document.getElementById('calendarGrid');
  const currentMonthLabel = document.getElementById('currentMonthLabel');
  const yearSelector = document.getElementById('yearSelector');
  const prevMonthBtn = document.getElementById('prevMonth');
  const nextMonthBtn = document.getElementById('nextMonth');

  const eventModal = document.getElementById('eventModal');
  const closeViewEvent = document.getElementById('closeViewEvent');
  const modalEventTitle = document.getElementById('modalEventTitle');
  const modalEventDate = document.getElementById('modalEventDate');
  const modalEventDescription = document.getElementById('modalEventDescription');

  const addEventBtn = document.getElementById('addEventBtn');
  const addEventModal = document.getElementById('addEventModal');
  const closeAddEvent = document.getElementById('closeAddEvent');
  const addEventForm = document.getElementById('addEventForm');

  let currentMonth = new Date();
  let allImportantDates = [];
  let schedule = [];

  async function fetchData() {
    try {
      const response = await fetch('important-dates.json');
      const data = await response.json();
      allImportantDates = data.importantDates || [];
      schedule = data.schedule || [];
      renderCalendar();
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }

  function renderCalendar() {
    calendarGrid.querySelectorAll('.day:not(.day-name)').forEach(el => el.remove());

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    currentMonthLabel.textContent = currentMonth.toLocaleString('en-US', { month: 'long' });
    yearSelector.value = year;

    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'day other-month';
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      const dayElem = document.createElement('div');
      dayElem.className = 'day';
      if (date.toDateString() === new Date().toDateString()) {
        dayElem.classList.add('today');
      }

      dayElem.innerHTML = `<div class="number">${day}</div>`;

      dayElem.addEventListener('click', (e) => {
        if (e.target.classList.contains('event') || e.target.closest('.event')) return;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        document.getElementById('eventDate').value = dateStr;
        addEventModal.style.display = 'flex';
      });

      getEventsForDate(date).forEach(event => {
        const ev = document.createElement('div');
        ev.className = 'event';

        const isCustom = event.event.includes('(');
        const eventDay = parseInt(event.date);
        const eventDate = new Date(`${event.month} ${eventDay}, ${year}`);

        if (isCustom) {
          const timeMatch = event.event.match(/\(([^)]+)\)/);
          const [timeStr] = timeMatch?.[1]?.split(',').map(s => s.trim()) || [];
          const displayTime = `${timeStr}`;

          ev.innerHTML = `
            <div class="event-title">${event.event.split('(')[0].trim()}</div>
            <div class="event-time">${displayTime}</div>
          `;

          if (event.source === 'schedule' && eventDate < new Date()) {
            ev.classList.add('past-event');
          }
        } else {
          ev.textContent = event.event;
        }

        ev.title = event.event;
        ev.addEventListener('click', () => {
          modalEventTitle.textContent = event.event;
          modalEventDate.textContent = `${event.month}, ${event.date}`;
          modalEventDescription.textContent = event.event;
          eventModal.style.display = 'flex';
        });

        dayElem.appendChild(ev);
      });

      calendarGrid.appendChild(dayElem);
    }

    const total = firstDay + numDays;
    const fill = (7 - total % 7) % 7;
    for (let i = 0; i < fill; i++) {
      const empty = document.createElement('div');
      empty.className = 'day other-month';
      calendarGrid.appendChild(empty);
    }
  }

  function getEventsForDate(date) {
    const events = [];
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();
    const dayName = date.toLocaleString('en-US', { weekday: 'long' });

    allImportantDates.forEach(ev => {
      if (ev.month === monthName) {
        if (ev.date.match(/^\d+(st|nd|rd|th)$/)) {
          if (parseInt(ev.date) === day) events.push({ ...ev, source: 'important' });
        } else if (ev.date.includes('-')) {
          const [start, end] = ev.date.split('-').map(s => parseInt(s));
          if (day >= start && day <= end) events.push({ ...ev, source: 'important' });
        }
      }
    });

    schedule.forEach(sch => {
      if (sch.date && sch.date.includes(day)) {
        events.push({
          month: monthName,
          date: `${day}`,
          event: `${sch.title} (${sch.startTime} - ${sch.endTime})`,
          source: 'schedule'
        });
      } else if (sch.days && sch.days.includes(dayName)) {
        events.push({
          month: monthName,
          date: `${day}`,
          event: `${sch.title} (${sch.startTime} - ${sch.endTime})`,
          source: 'schedule'
        });
      }
    });

    return events;
  }

  for (let y = 1990; y <= 2100; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelector.appendChild(opt);
  }

  yearSelector.addEventListener('change', () => {
    currentMonth.setFullYear(parseInt(yearSelector.value));
    renderCalendar();
  });

  prevMonthBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
  });

  closeViewEvent.addEventListener('click', () => eventModal.style.display = 'none');
  closeAddEvent.addEventListener('click', () => addEventModal.style.display = 'none');

  window.addEventListener('click', e => {
    if (e.target === eventModal) eventModal.style.display = 'none';
    if (e.target === addEventModal) addEventModal.style.display = 'none';
  });

  addEventBtn.addEventListener('click', () => {
    document.getElementById('eventDate').value = '';
    addEventModal.style.display = 'flex';
  });

  addEventForm.addEventListener('submit', e => {
    e.preventDefault();

    const title = document.getElementById('eventTitle').value;
    const date = new Date(document.getElementById('eventDate').value);
    const time = document.getElementById('eventTime').value;

    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();

    let eventStr = title;
    if (time) {
      eventStr += ` (${time})`;
    }

    allImportantDates.push({
      month,
      date: `${day}th`,
      event: eventStr,
      source: 'important'
    });

    renderCalendar();
    addEventModal.style.display = 'none';
    addEventForm.reset();
  });

  fetchData();
});





