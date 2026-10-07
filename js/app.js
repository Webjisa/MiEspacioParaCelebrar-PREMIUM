'use strict';

(() => {

  /*
   * ============================================================
   * MiEspacioParaCelebrar
   * app.js
   * ============================================================
   *
   * Funciones principales:
   *
   * - Navegación móvil
   * - Selector de fechas general
   * - Calendario específico de cada espacio
   * - Fechas ocupadas
   * - Fechas retenidas
   * - Festivos nacionales/autonómicos/locales
   * - Vísperas de festivo
   * - Selección de rangos
   * - Enlace hacia reservar.html
   *
   * IMPORTANTE:
   * La clave utilizada debe ser la ANON KEY pública de Supabase.
   * Nunca debe colocarse aquí una service_role key.
   */

  const SUPABASE_URL =
    'https://hvuseljtqdgekotrsiwd.supabase.co';

  const SUPABASE_ANON_KEY =
    window.MIESPACIO_SUPABASE_ANON_KEY || '';

  /*
   * UUID real de La Nube existente en Supabase.
   *
   * Se utiliza únicamente como respaldo mientras las tarjetas
   * de espacios todavía no pasan el UUID mediante ?id=...
   */
  const LA_NUBE_ID =
    '340c371d-e09b-4a59-bfaa-343d7509a35c';


  /* ============================================================
     UTILIDADES GENERALES
     ============================================================ */

  function getTodayString() {

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }


  function localISODate(date) {

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }


  function isoFromParts(year, month, day) {

    return [
      String(year).padStart(4, '0'),
      String(month).padStart(2, '0'),
      String(day).padStart(2, '0')
    ].join('-');
  }


  function dateToParts(iso) {

    const parts = String(iso || '')
      .split('-')
      .map(Number);

    return {
      year: parts[0],
      month: parts[1],
      day: parts[2]
    };
  }


  function addDaysISO(iso, days) {

    const date = new Date(`${iso}T12:00:00`);

    date.setDate(date.getDate() + days);

    return localISODate(date);
  }


  function formatDateDisplay(iso) {

    if (!iso) {
      return '';
    }

    const parts = iso.split('-');

    if (parts.length !== 3) {
      return '';
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }


  function parseDisplayDate(value) {

    const clean = String(value || '')
      .replace(/\D/g, '');

    if (clean.length !== 8) {
      return '';
    }

    const day = Number(clean.slice(0, 2));
    const month = Number(clean.slice(2, 4));
    const year = Number(clean.slice(4, 8));

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      !Number.isInteger(year)
    ) {
      return '';
    }

    if (month < 1 || month > 12) {
      return '';
    }

    if (day < 1 || day > 31) {
      return '';
    }

    const check = new Date(year, month - 1, day);

    if (
      check.getFullYear() !== year ||
      check.getMonth() !== month - 1 ||
      check.getDate() !== day
    ) {
      return '';
    }

    return isoFromParts(year, month, day);
  }


  function formatDateTyping(value) {

    const digits = String(value || '')
      .replace(/\D/g, '')
      .slice(0, 8);

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    return (
      `${digits.slice(0, 2)}/` +
      `${digits.slice(2, 4)}/` +
      `${digits.slice(4)}`
    );
  }


  function escapeHTML(value) {

    return String(value ?? '')
      .replace(/[&<>'"]/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      })[character]);
  }


  function dateInRange(iso, start, end) {

    if (!iso || !start || !end) {
      return false;
    }

    return iso >= start && iso <= end;
  }


  function rangeHasUnavailable(start, end, unavailable) {

    if (!start || !end) {
      return false;
    }

    let current =
      new Date(`${start}T12:00:00`);

    const last =
      new Date(`${end}T12:00:00`);

    while (current <= last) {

      const iso = localISODate(current);

      if (unavailable.has(iso)) {
        return true;
      }

      current.setDate(current.getDate() + 1);
    }

    return false;
  }


  function showMessage(element, message, type = 'info') {

    if (!element) {
      return;
    }

    element.textContent = message;

    element.classList.remove(
      'notice-success',
      'notice-error',
      'notice-warning'
    );

    if (type === 'success') {
      element.classList.add('notice-success');
    }

    if (type === 'error') {
      element.classList.add('notice-error');
    }

    if (type === 'warning') {
      element.classList.add('notice-warning');
    }

    element.hidden = false;
  }


  /* ============================================================
     SUPABASE
     ============================================================ */

  function getSupabaseClient() {

    if (
      !SUPABASE_ANON_KEY ||
      !window.supabase
    ) {
      return null;
    }

    try {

      return window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    } catch (error) {

      console.error(
        'Error creando el cliente de Supabase:',
        error
      );

      return null;
    }
  }


  /* ============================================================
     NAVEGACIÓN
     ============================================================ */

  function initNavigation() {

    const toggle =
      document.querySelector('[data-nav-toggle]');

    const nav =
      document.querySelector('[data-nav]');

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener('click', () => {

      const expanded =
        toggle.getAttribute('aria-expanded') === 'true';

      toggle.setAttribute(
        'aria-expanded',
        String(!expanded)
      );

      nav.classList.toggle(
        'is-open',
        !expanded
      );

    });

    nav.querySelectorAll('a').forEach(link => {

      link.addEventListener('click', () => {

        toggle.setAttribute(
          'aria-expanded',
          'false'
        );

        nav.classList.remove('is-open');

      });

    });
  }


  /* ============================================================
     AÑO DEL FOOTER
     ============================================================ */

  function initFooterYear() {

    document
      .querySelectorAll('[data-year]')
      .forEach(element => {

        element.textContent =
          new Date().getFullYear();

      });
  }


  /* ============================================================
     SELECTOR DE FECHAS GENERAL
     disponibilidad.html
     ============================================================ */

  function setupNativeDateRange({
    startInput,
    endInput
  }) {

    if (!startInput || !endInput) {
      return;
    }

    const today = getTodayString();

    startInput.min = today;
    endInput.min = today;

    function syncEndMinimum() {

      const start = startInput.value;

      if (!start) {
        endInput.min = today;
        return;
      }

      endInput.min = start;

      if (
        !endInput.value ||
        endInput.value < start
      ) {

        endInput.value = start;
      }
    }


    startInput.addEventListener(
      'change',
      syncEndMinimum
    );

    startInput.addEventListener(
      'input',
      syncEndMinimum
    );

    startInput.addEventListener(
      'blur',
      syncEndMinimum
    );

    endInput.addEventListener(
      'change',
      () => {

        const start = startInput.value;

        if (
          start &&
          endInput.value &&
          endInput.value < start
        ) {

          endInput.value = start;
        }
      }
    );


    /*
     * Safari/iPhone:
     *
     * Cuando se abre el selector "Hasta", dejamos preparada
     * la fecha inicial igual que "Desde".
     */
    ['pointerdown', 'touchstart', 'focus'].forEach(eventName => {

      endInput.addEventListener(
        eventName,
        () => {

          if (
            startInput.value &&
            (
              !endInput.value ||
              endInput.value < startInput.value
            )
          ) {

            endInput.value =
              startInput.value;

            endInput.min =
              startInput.value;
          }

        },
        {
          passive: true
        }
      );

    });


    syncEndMinimum();
  }


  function initGeneralAvailability() {

    const form =
      document.querySelector('#availability-form');

    if (!form) {
      return;
    }

    const startInput =
      document.querySelector('#start-date');

    const endInput =
      document.querySelector('#end-date');

    const result =
      document.querySelector('#availability-results');

    const list =
      document.querySelector('#available-spaces');

    const resetButton =
      form.querySelector('[type="reset"]');


    setupNativeDateRange({
      startInput,
      endInput
    });


    form.addEventListener('submit', event => {

      event.preventDefault();

      const start =
        startInput?.value || '';

      const end =
        endInput?.value || start;

      if (!start) {

        showMessage(
          result,
          'Selecciona una fecha.',
          'error'
        );

        return;
      }

      if (end < start) {

        showMessage(
          result,
          'La fecha final no puede ser anterior a la inicial.',
          'error'
        );

        return;
      }


      if (list) {
        list.innerHTML = '';
      }


      showMessage(
        result,
        `Búsqueda preparada para ${formatDateDisplay(start)}${
          end !== start
            ? ` → ${formatDateDisplay(end)}`
            : ''
        }.`,
        'success'
      );

    });


    resetButton?.addEventListener(
      'click',
      () => {

        window.setTimeout(() => {

          if (result) {
            result.hidden = true;
            result.textContent = '';
          }

          if (list) {
            list.innerHTML = '';
          }

          setupNativeDateRange({
            startInput,
            endInput
          });

        }, 0);

      }
    );
  }


  /* ============================================================
     RESOLUCIÓN DEL ESPACIO
     ============================================================ */

  function getSpaceIdFromURL() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      params.get('id') ||
      params.get('space') ||
      window.MIESPACIO_SPACE_ID ||
      LA_NUBE_ID
    );
  }


  function getSpaceName() {

    const heading =
      document.querySelector('main h1');

    if (!heading) {
      return 'Espacio';
    }

    return heading.textContent.trim();
  }


  /* ============================================================
     CARGA DE FECHAS OCUPADAS / RETENIDAS
     ============================================================ */

  async function getUnavailableDates(spaceId) {

    const map = new Map();

    const client =
      getSupabaseClient();

    if (!client || !spaceId) {
      return map;
    }

    try {

      const {
        data,
        error
      } = await client.rpc(
        'get_space_unavailable_ranges',
        {
          p_space_id: spaceId
        }
      );

      if (error) {
        throw error;
      }


      for (const row of data || []) {

        if (
          !row.start_date ||
          !row.end_date
        ) {
          continue;
        }

        let current =
          new Date(
            `${row.start_date}T12:00:00`
          );

        const last =
          new Date(
            `${row.end_date}T12:00:00`
          );


        /*
         * confirmed:
         *   reserva confirmada
         *   fecha bloqueada
         *
         * pending:
         *   solicitud pendiente
         */
        const reason =
          (
            row.reason === 'confirmed' ||
            row.reason === 'blocked'
          )
            ? 'confirmed'
            : 'pending';


        while (current <= last) {

          const iso =
            localISODate(current);


          /*
           * Si una fecha tiene simultáneamente
           * pending y confirmed, prevalece confirmed.
           */
          if (
            !map.has(iso) ||
            reason === 'confirmed'
          ) {

            map.set(
              iso,
              reason
            );
          }


          current.setDate(
            current.getDate() + 1
          );
        }

      }

    } catch (error) {

      console.error(
        'No se pudieron cargar las fechas ocupadas:',
        error
      );

    }

    return map;
  }


  /* ============================================================
     FESTIVOS
     ============================================================ */

  async function getHolidaysForYear(
    client,
    spaceId,
    year
  ) {

    const holidays = new Map();

    if (
      !client ||
      !spaceId ||
      !year
    ) {
      return holidays;
    }


    try {

      const {
        data,
        error
      } = await client.rpc(
        'get_public_space_holidays',
        {
          p_space_id: spaceId,
          p_year: year
        }
      );


      if (error) {
        throw error;
      }


      for (const row of data || []) {

        if (!row.holiday_date) {
          continue;
        }

        holidays.set(
          row.holiday_date,
          {
            name:
              row.name ||
              'Festivo'
          }
        );

      }

    } catch (error) {

      console.error(
        `No se pudieron cargar los festivos de ${year}:`,
        error
      );

    }


    return holidays;
  }


  async function loadHolidayData(
    state,
    year
  ) {

    const client =
      getSupabaseClient();

    if (!client) {
      return;
    }


    if (
      state.holidayYears.has(year)
    ) {
      return;
    }


    const holidays =
      await getHolidaysForYear(
        client,
        state.spaceId,
        year
      );


    holidays.forEach(
      (value, iso) => {

        state.holidays.set(
          iso,
          value
        );

      }
    );


    /*
     * Víspera:
     * un día antes de cada festivo.
     */
    holidays.forEach(
      (value, iso) => {

        const eve =
          addDaysISO(
            iso,
            -1
          );

        /*
         * No sustituimos un festivo existente.
         */
        if (
          !state.holidays.has(eve)
        ) {

          state.eves.set(
            eve,
            {
              name:
                `Víspera de ${value.name}`
            }
          );

        }

      }
    );


    state.holidayYears.add(year);
  }


  /* ============================================================
     ESTILOS DEL CALENDARIO
     ============================================================ */

  function injectCalendarStyles() {

    if (
      document.querySelector(
        '#miespacio-calendar-runtime-styles'
      )
    ) {
      return;
    }


    const style =
      document.createElement('style');

    style.id =
      'miespacio-calendar-runtime-styles';


    style.textContent = `

      .space-calendar {
        position: relative;
        width: 100%;
      }

      .date-input-wrap {
        position: relative;
      }

      .date-input-button {
        width: 100%;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid var(--line, #dfe5df);
        border-radius: 12px;
        background: #fff;
        color: var(--text, #20231f);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .date-input-button:hover {
        border-color: var(--green-border, #a8c1af);
      }

      .date-input-button:focus-visible {
        outline: 3px solid rgba(41, 77, 61, .16);
        outline-offset: 2px;
        border-color: var(--green, #294d3d);
      }

      .date-input-button span:last-child {
        color: var(--muted, #6d756d);
        font-size: .9rem;
      }

      .calendar-panel {
        width: min(100%, 420px);
        margin-top: 10px;
        padding: 16px;
        border: 1px solid var(--line, #dfe5df);
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 14px 36px rgba(24, 36, 29, .12);
        z-index: 20;
      }

      .calendar-panel[hidden] {
        display: none;
      }

      .calendar-head {
        display: grid;
        grid-template-columns: 40px 1fr 40px;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
      }

      .calendar-head strong {
        text-align: center;
        font-size: 1rem;
        color: var(--text, #20231f);
      }

      .calendar-nav {
        width: 40px;
        height: 40px;
        border: 1px solid var(--line, #dfe5df);
        border-radius: 10px;
        background: #fff;
        color: var(--green, #294d3d);
        font-size: 1.4rem;
        line-height: 1;
        cursor: pointer;
      }

      .calendar-nav:hover {
        background: var(--surface-soft, #edf2ed);
      }

      .calendar-weekdays,
      .calendar-grid {
        display: grid !important;
        grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
        column-gap: 0 !important;
        row-gap: 0 !important;
      }

      /* Cada día lleva su propio recuadro. El margen interior evita que
         los bordes de dos días consecutivos se toquen o se solapen. */
      .calendar-grid {
        overflow: visible !important;
      }

      .calendar-weekdays {
        margin-bottom: 6px;
      }

      .calendar-weekdays span {
        text-align: center;
        color: var(--muted, #6d756d);
        font-size: .76rem;
        font-weight: 800;
      }

      .calendar-grid .calendar-day {
        position: relative;
        min-width: 0;
        width: auto !important;
        margin: 3px !important;
        aspect-ratio: 1 / 1;
        box-sizing: border-box;
        border: 1px solid transparent;
        border-radius: 10px;
        background: #fff;
        color: var(--text, #20231f);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .calendar-day:hover:not(:disabled) {
        border-color: var(--green-border, #a8c1af);
        background: var(--surface-soft, #edf2ed);
      }

      .calendar-day.outside {
        color: #c7cdc8;
        background: transparent;
        cursor: default;
      }

      .calendar-day:disabled {
        cursor: not-allowed;
      }

      .calendar-day.unavailable-confirmed {
        background: #faeded;
        border-color: #e4aaaa;
        color: #a84f4f;
      }

      .calendar-day.unavailable-confirmed::after {
        content: "×";
        position: absolute;
        right: 4px;
        top: 1px;
        font-size: .72rem;
        font-weight: 900;
      }

      .calendar-day.unavailable-pending {
        background: #fbf1e4;
        border-color: #e6bf8f;
        color: #a96522;
      }

      .calendar-day.unavailable-pending::after {
        content: "◷";
        position: absolute;
        right: 4px;
        top: 1px;
        font-size: .66rem;
        font-weight: 900;
      }

      .calendar-day.holiday {
        background: #edf4fb;
        border-color: #b6cfe7;
        color: #38658d;
      }

      /* Festivo y víspera usan exactamente el mismo tratamiento visual. */
      .calendar-day.eve {
        background: #edf4fb;
        border-color: #b6cfe7;
        color: #38658d;
      }

      .calendar-day.selected {
        background: #e7f0e9;
        border: 1px solid #7ea58c;
        color: #294d3d;
        box-shadow: inset 0 0 0 0.5px #7ea58c;
      }

      .calendar-day.today {
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }

      .calendar-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--line, #dfe5df);
      }

      .calendar-legend-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--muted, #6d756d);
        font-size: .76rem;
        line-height: 1.2;
      }

      .calendar-legend-mark {
        display: inline-block;
        width: 13px;
        height: 13px;
        border-radius: 4px;
        border: 1px solid transparent;
        flex: 0 0 auto;
      }

      .calendar-legend-inline {
        margin-top: 14px;
      }

      .legend-available {
        background: #fff;
        border-color: #dfe5df;
      }

      .legend-selected {
        background: #e7f0e9;
        border-color: #7ea58c;
      }

      .legend-confirmed {
        background: #faeded;
        border-color: #e4aaaa;
      }

      .legend-pending {
        background: #fbf1e4;
        border-color: #e6bf8f;
      }

      .legend-holiday {
        background: #edf4fb;
        border-color: #b6cfe7;
      }

      .legend-eve {
        background: #edf4fb;
        border-color: #b6cfe7;
      }

      .space-detail-image {
        min-height: 360px;
        overflow: hidden;
        background: #eef2ee;
        border-radius: var(--radius-md, 16px);
      }

      .space-detail-image img {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 360px;
        object-fit: cover;
      }

      .space-gallery {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }

      .space-gallery-thumb {
        padding: 0;
        border: 1px solid var(--line, #dfe5df);
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
        cursor: pointer;
        aspect-ratio: 4 / 3;
      }

      .space-gallery-thumb:hover {
        border-color: var(--green-border, #a8c1af);
      }

      .space-gallery-thumb.is-active {
        border-color: var(--green, #294d3d);
        box-shadow: 0 0 0 2px var(--green-soft, #e7f0e9);
      }

      .space-gallery-thumb img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .space-condition-row {
        display: grid;
        grid-template-columns: minmax(120px, .35fr) 1fr;
        gap: 16px;
        padding: 13px 0;
        border-bottom: 1px solid var(--line, #dfe5df);
      }

      .space-condition-row:last-child {
        border-bottom: 0;
      }

      @media (max-width: 767px) {

        .calendar-panel {
          width: 100%;
          padding: 12px;
        }

        .calendar-grid .calendar-day {
          margin: 2px !important;
          border-radius: 8px;
          font-size: .9rem;
        }

        .calendar-legend {
          gap: 7px 10px;
        }

        .calendar-legend-item {
          font-size: .7rem;
        }

      }

    `;


    /* Refuerzo final: algunas hojas antiguas del proyecto también definen
       .calendar-grid/.calendar-day. Estas reglas garantizan que el calendario
       nuevo conserve siempre separación visible entre casillas. */
    style.textContent += `
      #space-calendar-panel .calendar-grid {
        display: grid !important;
        grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
        gap: 0 !important;
        overflow: visible !important;
      }
      #space-calendar-panel .calendar-grid .calendar-day {
        width: auto !important;
        min-width: 0 !important;
        margin: 3px !important;
        box-sizing: border-box !important;
      }
      @media (max-width: 767px) {
        #space-calendar-panel .calendar-grid .calendar-day {
          margin: 2px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }


  /* ============================================================
     CALENDARIO DEL ESPACIO
     ============================================================ */

  function createSpaceCalendarState(
    spaceId
  ) {

    const today =
      getTodayString();

    return {

      spaceId,

      minDate: today,

      maxDate: '',

      unavailable:
        new Map(),

      holidays:
        new Map(),

      eves:
        new Map(),

      holidayYears:
        new Set(),

      start: '',

      end: '',

      activeTarget: 'start',

      year:
        new Date().getFullYear(),

      month:
        new Date().getMonth() + 1,

      calendarOpen: false

    };
  }


  function setSpaceDateInput(
    id,
    iso
  ) {

    const input =
      document.querySelector(`#${id}`);

    if (!input) {
      return;
    }

    const display =
      iso ? formatDateDisplay(iso) : 'Selecciona una fecha';

    if ('value' in input) {
      input.value = display;
    } else {
      input.textContent = display;
    }

    input.dataset.iso =
      iso || '';
  }


  function getSpaceInputISO(id) {

    const input =
      document.querySelector(`#${id}`);

    if (!input) {
      return '';
    }

    return (
      input.dataset.iso ||
      parseDisplayDate(input.value)
    );
  }


  function isDateUnavailable(
    iso,
    state
  ) {

    return (
      state.unavailable.has(iso) ||
      (
        state.minDate &&
        iso < state.minDate
      ) ||
      (
        state.maxDate &&
        iso > state.maxDate
      )
    );
  }


  function getDateClasses(
    iso,
    state
  ) {

    const classes = [
      'calendar-day'
    ];

    const reason =
      state.unavailable.get(iso);

    const selected =
      dateInRange(
        iso,
        state.start,
        state.end
      );

    /*
     * Una fecha solo muestra UN estado visual principal.
     * Así evitamos que festivo, víspera y selección se
     * pisen entre sí. Las fechas ocupadas/retenidas no
     * pueden formar parte de una selección.
     */
    if (selected) {
      classes.push('selected');
    } else if (reason === 'confirmed') {
      classes.push('unavailable-confirmed');
    } else if (reason === 'pending') {
      classes.push('unavailable-pending');
    } else if (state.holidays.has(iso) || state.eves.has(iso)) {
      /* Festivo y víspera comparten deliberadamente el mismo estado visual. */
      classes.push('holiday');
    }

    if (iso === getTodayString()) {
      classes.push('today');
    }

    return classes;
  }


  function getHolidayTitle(
    iso,
    state
  ) {

    if (
      state.holidays.has(iso)
    ) {

      return (
        state.holidays.get(iso).name ||
        'Festivo'
      );
    }


    if (
      state.eves.has(iso)
    ) {

      return (
        state.eves.get(iso).name ||
        'Víspera de festivo'
      );
    }


    return '';
  }


  function renderSpaceCalendar(
    state
  ) {

    const calendar =
      document.querySelector(
        '#space-calendar-panel'
      );

    if (!calendar) {
      return;
    }


    const firstDay =
      new Date(
        state.year,
        state.month - 1,
        1
      );


    const daysInMonth =
      new Date(
        state.year,
        state.month,
        0
      ).getDate();


    const firstWeekday =
      (
        firstDay.getDay() + 6
      ) % 7;


    const monthLabel =
      new Intl.DateTimeFormat(
        'es-ES',
        {
          month: 'long',
          year: 'numeric'
        }
      ).format(firstDay);


    let html = '';


    html += `
      <div class="calendar-head">

        <button
          type="button"
          class="calendar-nav"
          data-calendar-prev
          aria-label="Mes anterior"
        >
          ‹
        </button>

        <strong>
          ${escapeHTML(
            monthLabel.charAt(0).toUpperCase() +
            monthLabel.slice(1)
          )}
        </strong>

        <button
          type="button"
          class="calendar-nav"
          data-calendar-next
          aria-label="Mes siguiente"
        >
          ›
        </button>

      </div>
    `;


    html += `
      <div class="calendar-weekdays">
        <span>L</span>
        <span>M</span>
        <span>X</span>
        <span>J</span>
        <span>V</span>
        <span>S</span>
        <span>D</span>
      </div>
    `;


    html += `
      <div class="calendar-grid">
    `;


    const previousMonthDays =
      new Date(
        state.year,
        state.month - 1,
        0
      ).getDate();


    const previousMonth =
      state.month === 1
        ? 12
        : state.month - 1;


    const previousYear =
      state.month === 1
        ? state.year - 1
        : state.year;


    for (
      let i = 0;
      i < firstWeekday;
      i++
    ) {

      const day =
        previousMonthDays -
        firstWeekday +
        i +
        1;


      const iso =
        isoFromParts(
          previousYear,
          previousMonth,
          day
        );


      html += `
        <button
          type="button"
          class="calendar-day outside"
          disabled
        >
          ${day}
        </button>
      `;
    }


    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {

      const iso =
        isoFromParts(
          state.year,
          state.month,
          day
        );


      const reason =
        state.unavailable.get(iso);


      const disabled =
        isDateUnavailable(
          iso,
          state
        );


      const classes =
        getDateClasses(
          iso,
          state
        );


      const title =
        getHolidayTitle(
          iso,
          state
        );


      html += `
        <button
          type="button"
          class="${classes.join(' ')}"
          data-space-calendar-date="${iso}"
          ${disabled ? 'disabled' : ''}
          ${title ? `title="${escapeHTML(title)}"` : ''}
          aria-label="${escapeHTML(
            formatDateDisplay(iso)
          )}${title ? `, ${escapeHTML(title)}` : ''}"
        >
          ${day}
        </button>
      `;
    }


    const usedCells =
      firstWeekday +
      daysInMonth;


    const trailingCells =
      (
        7 -
        (usedCells % 7)
      ) % 7;


    const nextMonth =
      state.month === 12
        ? 1
        : state.month + 1;


    const nextYear =
      state.month === 12
        ? state.year + 1
        : state.year;


    for (
      let day = 1;
      day <= trailingCells;
      day++
    ) {

      html += `
        <button
          type="button"
          class="calendar-day outside"
          disabled
        >
          ${day}
        </button>
      `;
    }


    html += `
      </div>

      <div class="calendar-legend calendar-legend-inline" aria-label="Leyenda del calendario">
        <span class="calendar-legend-item"><i class="calendar-legend-mark legend-available"></i>Disponible</span>
        <span class="calendar-legend-item"><i class="calendar-legend-mark legend-selected"></i>Seleccionada</span>
        <span class="calendar-legend-item"><i class="calendar-legend-mark legend-confirmed"></i>Ocupada</span>
        <span class="calendar-legend-item"><i class="calendar-legend-mark legend-pending"></i>Pendiente de confirmación</span>
        <span class="calendar-legend-item"><i class="calendar-legend-mark legend-holiday"></i>Festivo/Víspera</span>
      </div>

    `;


    calendar.innerHTML =
      html;


    const previousButton =
      calendar.querySelector(
        '[data-calendar-prev]'
      );


    const nextButton =
      calendar.querySelector(
        '[data-calendar-next]'
      );


    previousButton?.addEventListener(
      'click',
      async event => {

        event.preventDefault();
        event.stopPropagation();

        await changeCalendarMonth(
          state,
          -1
        );

      }
    );


    nextButton?.addEventListener(
      'click',
      async event => {

        event.preventDefault();
        event.stopPropagation();

        await changeCalendarMonth(
          state,
          1
        );

      }
    );
  }


  async function changeCalendarMonth(
    state,
    delta
  ) {

    let month =
      state.month + delta;

    let year =
      state.year;


    if (month < 1) {

      month = 12;
      year--;

    }


    if (month > 12) {

      month = 1;
      year++;

    }


    state.month =
      month;

    state.year =
      year;


    await loadHolidayData(
      state,
      year
    );


    renderSpaceCalendar(
      state
    );
  }


  function openSpaceCalendar(
    state,
    target
  ) {

    state.activeTarget =
      target;


    const inputId =
      target === 'start'
        ? 'space-start-date'
        : 'space-end-date';


    const current =
      getSpaceInputISO(
        inputId
      );


    const fallback =
      current ||
      state.start ||
      state.minDate;


    const parts =
      dateToParts(
        fallback
      );


    state.year =
      parts.year;


    state.month =
      parts.month;


    const panel =
      document.querySelector(
        '#space-calendar-panel'
      );


    if (!panel) {
      return;
    }


    panel.hidden =
      false;


    state.calendarOpen =
      true;


    loadHolidayData(
      state,
      state.year
    ).finally(() => {

      renderSpaceCalendar(
        state
      );

    });
  }


  function closeSpaceCalendar() {

    const panel =
      document.querySelector(
        '#space-calendar-panel'
      );


    if (!panel) {
      return;
    }


    panel.hidden =
      true;
  }


  function updateReservationLink(
    state
  ) {

    const button =
      document.querySelector(
        '#space-book-button'
      );


    if (!button) {
      return;
    }


    if (
      !state.start ||
      !state.end
    ) {

      button.hidden =
        true;

      return;
    }


    const params =
      new URLSearchParams();


    params.set(
      'space',
      state.spaceId
    );


    params.set(
      'start',
      state.start
    );


    params.set(
      'end',
      state.end
    );


    button.href =
      `reservar.html?${params.toString()}`;
  }


  function setRangeMessage(
    state,
    message,
    type
  ) {

    const result =
      document.querySelector(
        '#space-availability-result'
      );


    showMessage(
      result,
      message,
      type
    );
  }


  async function selectSpaceCalendarDate(
    iso,
    state
  ) {

    if (
      isDateUnavailable(
        iso,
        state
      )
    ) {
      return;
    }

    /*
     * PRIMER CLIC: Desde = fecha seleccionada.
     * Hasta se sincroniza con Desde y el siguiente clic
     * sobre un día disponible pasa automáticamente a
     * seleccionar Hasta.
     */
    if (state.activeTarget === 'start' || !state.start) {

      state.start = iso;
      state.end = iso;
      state.activeTarget = 'end';

      setSpaceDateInput('space-start-date', state.start);
      setSpaceDateInput('space-end-date', state.end);

      updateReservationLink(state);
      renderSpaceCalendar(state);

      await checkSelectedSpaceAvailability(state);
      return;
    }

    /*
     * SEGUNDO CLIC: Hasta = fecha seleccionada.
     */
    if (iso < state.start) {
      state.start = iso;
      state.end = iso;
      state.activeTarget = 'end';

      setSpaceDateInput('space-start-date', state.start);
      setSpaceDateInput('space-end-date', state.end);

      setRangeMessage(
        state,
        'La fecha seleccionada se ha establecido como inicio.',
        'warning'
      );

      updateReservationLink(state);
      renderSpaceCalendar(state);
      await checkSelectedSpaceAvailability(state);
      return;
    }

    if (
      rangeHasUnavailable(
        state.start,
        iso,
        state.unavailable
      )
    ) {
      state.end = state.start;
      state.activeTarget = 'end';

      setSpaceDateInput('space-end-date', state.end);

      setRangeMessage(
        state,
        'El intervalo contiene una fecha ocupada o retenida. Elige otra fecha final.',
        'error'
      );

      updateReservationLink(state);
      renderSpaceCalendar(state);
      return;
    }

    state.end = iso;
    state.activeTarget = 'end';

    setSpaceDateInput('space-end-date', state.end);
    updateReservationLink(state);
    renderSpaceCalendar(state);

    await checkSelectedSpaceAvailability(state);
  }


  async function checkSelectedSpaceAvailability(
    state
  ) {

    if (
      !state.start ||
      !state.end
    ) {

      setRangeMessage(
        state,
        'Selecciona primero las fechas.',
        'error'
      );

      return false;
    }


    if (
      rangeHasUnavailable(
        state.start,
        state.end,
        state.unavailable
      )
    ) {

      setRangeMessage(
        state,
        'El intervalo seleccionado contiene una fecha ocupada o retenida.',
        'error'
      );

      return false;
    }


    const client =
      getSupabaseClient();


    /*
     * Sin Supabase no fingimos que la disponibilidad
     * está comprobada en servidor.
     */
    if (!client) {

      setRangeMessage(
        state,
        'No se ha podido conectar con la disponibilidad del espacio.',
        'error'
      );

      return false;
    }


    try {

      const {
        data,
        error
      } = await client.rpc(
        'check_space_availability',
        {
          p_space_id:
            state.spaceId,

          p_start_date:
            state.start,

          p_end_date:
            state.end
        }
      );


      if (error) {
        throw error;
      }


      /*
       * La función puede devolver boolean,
       * un objeto o un resultado equivalente.
       * Lo normalizamos de forma conservadora.
       */
      let available = false;


      if (typeof data === 'boolean') {

        available = data;

      } else if (
        data &&
        typeof data === 'object'
      ) {

        if (
          typeof data.available === 'boolean'
        ) {

          available =
            data.available;

        } else if (
          typeof data.is_available === 'boolean'
        ) {

          available =
            data.is_available;

        } else if (
          typeof data.result === 'boolean'
        ) {

          available =
            data.result;

        }

      }


      if (!available) {

        /*
         * Refrescamos los estados por si otra
         * persona acaba de reservar mientras
         * el usuario tenía el calendario abierto.
         */
        state.unavailable =
          await getUnavailableDates(
            state.spaceId
          );


        renderSpaceCalendar(
          state
        );


        setRangeMessage(
          state,
          'El intervalo ya no está disponible. El calendario se ha actualizado.',
          'error'
        );


        return false;
      }


      setRangeMessage(
        state,
        'Las fechas seleccionadas están disponibles.',
        'success'
      );


      const button =
        document.querySelector(
          '#space-book-button'
        );


      if (button) {

        button.hidden =
          false;

        button.focus({
          preventScroll: true
        });

      }


      return true;

    } catch (error) {

      console.error(
        'Error comprobando disponibilidad:',
        error
      );


      /*
       * Si la RPC no responde, NO mostramos
       * "disponible" porque no podemos confirmarlo.
       */
      setRangeMessage(
        state,
        'No se ha podido comprobar la disponibilidad en este momento.',
        'error'
      );


      return false;
    }
  }


  /* ============================================================
     EDICIÓN MANUAL
     ============================================================ */

  function initManualSpaceDateInputs(
    state
  ) {

    const startInput =
      document.querySelector(
        '#space-start-date'
      );


    const endInput =
      document.querySelector(
        '#space-end-date'
      );


    if (!startInput || !endInput) {
      return;
    }


    startInput.addEventListener(
      'input',
      () => {

        startInput.value =
          formatDateTyping(
            startInput.value
          );

      }
    );


    endInput.addEventListener(
      'input',
      () => {

        endInput.value =
          formatDateTyping(
            endInput.value
          );

      }
    );


    startInput.addEventListener(
      'blur',
      () => {

        const iso =
          parseDisplayDate(
            startInput.value
          );


        if (!iso) {
          return;
        }


        if (
          isDateUnavailable(
            iso,
            state
          )
        ) {

          startInput.value = '';

          setRangeMessage(
            state,
            'Esa fecha no está disponible.',
            'error'
          );

          return;
        }


        state.start =
          iso;


        /*
         * Igual que con el calendario:
         * al cambiar Desde, Hasta se sincroniza
         * inicialmente con Desde.
         */
        if (
          !state.end ||
          state.end < iso ||
          rangeHasUnavailable(
            iso,
            state.end,
            state.unavailable
          )
        ) {

          state.end =
            iso;

          setSpaceDateInput(
            'space-end-date',
            iso
          );
        }


        setSpaceDateInput(
          'space-start-date',
          iso
        );


        updateReservationLink(
          state
        );


        renderSpaceCalendar(
          state
        );

      }
    );


    endInput.addEventListener(
      'blur',
      () => {

        const iso =
          parseDisplayDate(
            endInput.value
          );


        if (!iso) {
          return;
        }


        if (
          !state.start
        ) {

          state.start =
            iso;

          state.end =
            iso;

          setSpaceDateInput(
            'space-start-date',
            iso
          );

          setSpaceDateInput(
            'space-end-date',
            iso
          );

          updateReservationLink(
            state
          );

          renderSpaceCalendar(
            state
          );

          return;
        }


        if (
          iso < state.start
        ) {

          endInput.value =
            formatDateDisplay(
              state.start
            );

          setRangeMessage(
            state,
            'La fecha final no puede ser anterior a la fecha inicial.',
            'error'
          );

          return;
        }


        if (
          rangeHasUnavailable(
            state.start,
            iso,
            state.unavailable
          )
        ) {

          endInput.value =
            formatDateDisplay(
              state.start
            );

          state.end =
            state.start;


          setRangeMessage(
            state,
            'El intervalo contiene una fecha ocupada o retenida.',
            'error'
          );

          updateReservationLink(
            state
          );

          renderSpaceCalendar(
            state
          );

          return;
        }


        state.end =
          iso;


        setSpaceDateInput(
          'space-end-date',
          iso
        );


        updateReservationLink(
          state
        );


        renderSpaceCalendar(
          state
        );

      }
    );


    /*
     * Compatibilidad con Safari/iPhone.
     */
    ['focus', 'pointerdown', 'touchstart']
      .forEach(eventName => {

        endInput.addEventListener(
          eventName,
          () => {

            if (
              state.start &&
              (
                !state.end ||
                state.end < state.start
              )
            ) {

              state.end =
                state.start;

              setSpaceDateInput(
                'space-end-date',
                state.end
              );

            }

          },
          {
            passive: true
          }
        );

      });

  }


  /* ============================================================
     INICIALIZACIÓN DEL CALENDARIO DEL ESPACIO
     ============================================================ */

  async function initSpaceCalendar() {

    const form =
      document.querySelector(
        '#space-availability-form'
      );


    const calendar =
      document.querySelector(
        '#space-calendar'
      );

    const calendarPanel =
      document.querySelector(
        '#space-calendar-panel'
      );


    if (!form || !calendar || !calendarPanel) {
      return;
    }


    injectCalendarStyles();


    const state =
      createSpaceCalendarState(
        getSpaceIdFromURL()
      );


    /*
     * Cargamos primero las fechas ocupadas.
     */
    state.unavailable =
      await getUnavailableDates(
        state.spaceId
      );


    /*
     * Cargamos festivos del año actual.
     */
    await loadHolidayData(
      state,
      state.year
    );


    /*
     * Fecha inicial:
     * hoy.
     */
    state.start =
      '';

    state.end =
      '';


    setSpaceDateInput(
      'space-start-date',
      ''
    );


    setSpaceDateInput(
      'space-end-date',
      ''
    );


    renderSpaceCalendar(
      state
    );


    updateReservationLink(
      state
    );


    /*
     * Botones Desde / Hasta.
     */
    document
      .querySelectorAll(
        '[data-space-calendar-target]'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          event => {

            event.preventDefault();

            const target =
              button.dataset
                .spaceCalendarTarget ||
              'start';

            openSpaceCalendar(
              state,
              target
            );

          }
        );

      });


    /*
     * Clic sobre un día.
     */
    calendarPanel.addEventListener(
      'click',
      event => {

        const day =
          event.target.closest(
            '[data-space-calendar-date]'
          );


        if (
          !day ||
          day.disabled
        ) {
          return;
        }


        event.preventDefault();


        selectSpaceCalendarDate(
          day.dataset.spaceCalendarDate,
          state
        );

      }
    );


    /*
     * Cerrar calendario al pulsar fuera.
     */
    document.addEventListener(
      'click',
      event => {

        const panel =
          document.querySelector(
            '#space-calendar-panel'
          );


        if (
          !panel ||
          panel.hidden
        ) {
          return;
        }


        if (
          panel.contains(event.target)
        ) {
          return;
        }


        if (
          event.target.closest(
            '[data-space-calendar-target]'
          )
        ) {
          return;
        }


        closeSpaceCalendar();

      }
    );


    /*
     * Comprobar disponibilidad.
     */
    form.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        await checkSelectedSpaceAvailability(
          state
        );

      }
    );


    /*
     * Botón de reserva.
     *
     * No mostramos "Solicitar reserva"
     * hasta haber comprobado disponibilidad.
     */
    const bookingButton =
      document.querySelector(
        '#space-book-button'
      );


    if (bookingButton) {

      bookingButton.hidden =
        true;

      bookingButton.addEventListener(
        'click',
        event => {

          if (
            !state.start ||
            !state.end
          ) {

            event.preventDefault();

            setRangeMessage(
              state,
              'Selecciona las fechas antes de solicitar la reserva.',
              'error'
            );

          }

        }
      );

    }


    initManualSpaceDateInputs(
      state
    );


    /*
     * Si el usuario pulsa Esc, cerramos el calendario.
     */
    document.addEventListener(
      'keydown',
      event => {

        if (
          event.key === 'Escape'
        ) {

          closeSpaceCalendar();

        }

      }
    );

  }


  /* ============================================================
     RESERVAR.HTML
     ============================================================ */

  function initBookingPage() {

    const form =
      document.querySelector(
        '#booking-request-form'
      );


    if (!form) {
      return;
    }


    const params =
      new URLSearchParams(
        window.location.search
      );


    const space =
      params.get('space') || '';


    const start =
      params.get('start') || '';


    const end =
      params.get('end') || start;


    const selectedSpace =
      document.querySelector(
        '#selected-space'
      );


    const selectedStart =
      document.querySelector(
        '#selected-start'
      );


    const selectedEnd =
      document.querySelector(
        '#selected-end'
      );


    const result =
      document.querySelector(
        '#booking-request-result'
      );


    const submit =
      document.querySelector(
        '#booking-submit'
      );


    if (selectedSpace) {

      selectedSpace.value =
        space || 'Espacio seleccionado';

    }


    if (selectedStart) {

      selectedStart.value =
        formatDateDisplay(start);

    }


    if (selectedEnd) {

      selectedEnd.value =
        formatDateDisplay(end);

    }


    if (
      !space ||
      !start ||
      !end
    ) {

      if (submit) {
        submit.disabled = true;
      }


      showMessage(
        result,
        'Faltan las fechas o el espacio seleccionado. Vuelve al espacio y realiza la selección desde allí.',
        'error'
      );


      return;
    }


    form.addEventListener(
      'submit',
      event => {

        event.preventDefault();


        showMessage(
          result,
          'La solicitud está preparada. La conexión con Supabase se realizará en el siguiente paso.',
          'success'
        );

      }
    );

  }



  /* ============================================================
     DATOS REALES DEL ESPACIO
     ============================================================ */

  function getSpaceImageUrl(row) {
    if (!row || typeof row !== 'object') return '';

    const candidates = [
      row.image_url,
      row.url,
      row.public_url,
      row.storage_url,
      row.src
    ];

    const value = candidates.find(item =>
      typeof item === 'string' && item.trim() !== ''
    );

    return value ? value.trim() : '';
  }


  async function getPublicSpace(spaceId) {

    const client = getSupabaseClient();

    if (!client || !spaceId) {
      return { space: null, images: [] };
    }

    const {
      data: space,
      error: spaceError
    } = await client
      .from('spaces')
      .select(`
        id,
        name,
        city,
        province,
        description,
        weekday_price,
        friday_price,
        saturday_price,
        sunday_price,
        holiday_price,
        deposit,
        opening_time,
        closing_time,
        cleaning_available,
        cleaning_price,
        cancellation_policy,
        conditions_text,
        latitude,
        longitude,
        active,
        admin_enabled,
        owner_active,
        active_from,
        active_until
      `)
      .eq('id', spaceId)
      .maybeSingle();

    if (spaceError) {
      throw spaceError;
    }

    if (!space) {
      return { space: null, images: [] };
    }

    let images = [];

    try {

      const {
        data: imageRows,
        error: imageError
      } = await client
        .from('space_images')
        .select('image_url,sort_order')
        .eq('space_id', spaceId)
        .order('sort_order', { ascending: true });

      if (!imageError) {
        images = (imageRows || [])
          .sort((a, b) =>
            Number(a?.sort_order ?? 0) -
            Number(b?.sort_order ?? 0)
          )
          .map(row => row?.image_url)
          .filter(value =>
            typeof value === 'string' && value.trim() !== ''
          )
          .map(value => value.trim());
      } else {
        console.warn(
          'No se pudieron cargar las imágenes del espacio:',
          imageError
        );
      }

    } catch (error) {

      console.warn(
        'No se pudieron cargar las imágenes del espacio:',
        error
      );

    }

    return {
      space,
      images
    };
  }


  function formatEuro(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return '';
    }

    return new Intl.NumberFormat(
      'es-ES',
      {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
      }
    ).format(number);
  }


  function getStartingPrice(space) {

    if (!space) {
      return null;
    }

    const values = [
      space.weekday_price,
      space.friday_price,
      space.saturday_price,
      space.sunday_price,
      space.holiday_price
    ]
      .map(Number)
      .filter(Number.isFinite)
      .filter(value => value >= 0);

    if (!values.length) {
      return null;
    }

    return Math.min(...values);
  }


  function renderSpaceDetail(space, images) {

    const nameElement = document.querySelector('#space-name');
    const locationElement = document.querySelector('#space-location');
    const descriptionElement = document.querySelector('#space-description');
    const detailDescriptionElement = document.querySelector('#space-detail-description');
    const priceElement = document.querySelector('#space-price');
    const imageElement = document.querySelector('#space-image');
    const galleryElement = document.querySelector('#space-gallery');
    const conditionsElement = document.querySelector('#space-conditions');

    if (!space) {
      if (nameElement) nameElement.textContent = 'Espacio no encontrado';
      if (locationElement) locationElement.textContent = '';
      if (descriptionElement) descriptionElement.textContent = 'No hemos podido encontrar el espacio solicitado.';
      if (detailDescriptionElement) detailDescriptionElement.textContent = 'El espacio que has solicitado no está disponible en el catálogo público.';
      if (priceElement) priceElement.textContent = '';
      if (imageElement) imageElement.textContent = 'Espacio no disponible';
      if (galleryElement) galleryElement.replaceChildren();
      if (conditionsElement) conditionsElement.replaceChildren();
      document.title = 'Espacio no encontrado · MiEspacioParaCelebrar';
      return;
    }

    const name = space.name || 'Espacio';
    const location = [space.city || '', space.province || ''].filter(Boolean).join(' · ');
    const description = space.description || 'Este espacio todavía no tiene una descripción pública.';
    const imageList = Array.from(new Set((images || []).filter(Boolean)));

    if (nameElement) nameElement.textContent = name;
    if (locationElement) locationElement.textContent = location;
    if (descriptionElement) descriptionElement.textContent = description;
    if (detailDescriptionElement) detailDescriptionElement.textContent = description;

    const startingPrice = getStartingPrice(space);
    if (priceElement) {
      priceElement.textContent = startingPrice !== null ? `Desde ${formatEuro(startingPrice)}` : 'Consultar precio';
    }

    if (imageElement) {
      const firstImage = imageList[0] || '';
      if (firstImage) {
        const image = document.createElement('img');
        image.src = firstImage;
        image.alt = `Imagen principal de ${name}`;
        image.loading = 'eager';
        image.decoding = 'async';
        imageElement.replaceChildren(image);
      } else {
        imageElement.textContent = 'Imagen del espacio no disponible';
      }
    }

    if (galleryElement) {
      galleryElement.replaceChildren();

      /*
       * Se muestran TODAS las imágenes publicadas del espacio.
       * La primera es la principal y también aparece como miniatura,
       * permitiendo volver a seleccionarla después de cambiarla.
       */
      imageList.forEach((src, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'space-gallery-thumb';
        button.dataset.galleryIndex = String(index);
        button.setAttribute(
          'aria-label',
          index === 0
            ? `Volver a imagen principal de ${name}`
            : `Ver imagen ${index + 1} de ${name}`
        );

        const image = document.createElement('img');
        image.src = src;
        image.alt =
          index === 0
            ? `Imagen principal de ${name}`
            : `${name} · imagen ${index + 1}`;
        image.loading = index === 0 ? 'eager' : 'lazy';
        image.decoding = 'async';

        button.appendChild(image);

        button.addEventListener('click', () => {
          if (!imageElement) return;

          const main = document.createElement('img');
          main.src = src;
          main.alt =
            index === 0
              ? `Imagen principal de ${name}`
              : `${name} · imagen ${index + 1}`;
          main.loading = 'eager';
          main.decoding = 'async';
          imageElement.replaceChildren(main);

          galleryElement
            .querySelectorAll('.space-gallery-thumb')
            .forEach(item => item.classList.remove('is-active'));
          button.classList.add('is-active');
        });

        if (index === 0) {
          button.classList.add('is-active');
        }

        galleryElement.appendChild(button);
      });
    }

    if (conditionsElement) {
      conditionsElement.replaceChildren();

      const rows = [];
      if (space.deposit != null) rows.push(['Fianza', formatEuro(space.deposit)]);
      if (space.opening_time || space.closing_time) {
        rows.push(['Horario', `${String(space.opening_time || '').slice(0,5)}–${String(space.closing_time || '').slice(0,5)}`]);
      }
      if (space.cleaning_available) rows.push(['Limpieza', space.cleaning_price != null ? `${formatEuro(space.cleaning_price)} · opcional` : 'Disponible']);
      if (space.conditions_text) rows.push(['Condiciones', space.conditions_text]);
      if (space.cancellation_policy) rows.push(['Cancelación', space.cancellation_policy]);

      rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'space-condition-row';
        const labelEl = document.createElement('strong');
        labelEl.textContent = label;
        const valueEl = document.createElement('span');
        valueEl.textContent = value;
        row.append(labelEl, valueEl);
        conditionsElement.appendChild(row);
      });
    }

    document.title = `${name} · MiEspacioParaCelebrar`;
  }


  async function initSpaceDetail() {

    const calendar =
      document.querySelector('#space-calendar');

    if (!calendar) {
      return;
    }

    const spaceId =
      getSpaceIdFromURL();

    const result =
      document.querySelector(
        '#space-availability-result'
      );

    if (!spaceId) {

      renderSpaceDetail(null, []);

      showMessage(
        result,
        'No se ha indicado qué espacio quieres consultar.',
        'error'
      );

      return;
    }

    const client =
      getSupabaseClient();

    if (!client) {

      showMessage(
        result,
        'No se ha podido conectar con el catálogo de espacios.',
        'error'
      );

      return;
    }

    try {

      const {
        space,
        images
      } = await getPublicSpace(spaceId);

      if (!space) {

        renderSpaceDetail(null, []);

        showMessage(
          result,
          'El espacio solicitado no está disponible.',
          'error'
        );

        return;
      }

      const today = getTodayString();

      const isWithinPublicationPeriod =
        (!space.active_from || today >= space.active_from) &&
        (!space.active_until || today <= space.active_until);

      const isPublic =
        space.active === true &&
        space.admin_enabled !== false &&
        space.owner_active !== false &&
        isWithinPublicationPeriod;

      if (!isPublic) {

        renderSpaceDetail(null, []);

        showMessage(
          result,
          'El espacio solicitado no está disponible.',
          'error'
        );

        return;
      }

      renderSpaceDetail(
        space,
        images
      );

    } catch (error) {

      console.error(
        'Error cargando el espacio:',
        error
      );

      renderSpaceDetail(null, []);

      showMessage(
        result,
        'No se ha podido cargar la información del espacio.',
        'error'
      );

    }
  }

  /* ============================================================
     ESPACIO
     ============================================================ */

  async function initSpacePage() {

    /*
     * Primero cargamos los datos reales del espacio.
     * Después inicializamos el calendario con el mismo UUID.
     */
    await initSpaceDetail();

    await initSpaceCalendar();

  }


  /* ============================================================
     INICIO
     ============================================================ */

  async function init() {

    initNavigation();

    initFooterYear();

    initGeneralAvailability();

    initBookingPage();

    await initSpacePage();

  }


  /*
   * Esperamos a DOMContentLoaded.
   */
  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }

})();