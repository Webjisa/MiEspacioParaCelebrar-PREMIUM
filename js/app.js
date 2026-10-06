(() => {
  'use strict';

  /* =========================
     NAVEGACIÓN
  ========================= */

  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');

      toggle.setAttribute(
        'aria-expanded',
        String(open)
      );
    });

    nav.addEventListener('click', (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        nav.classList.remove('is-open');

        toggle.setAttribute(
          'aria-expanded',
          'false'
        );
      }
    });
  }


  /* =========================
     AÑO DEL FOOTER
  ========================= */

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });


  /* =========================
     FECHA ACTUAL
  ========================= */

  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const todayString = `${year}-${month}-${day}`;


  /* =========================
     DISPONIBILIDAD
  ========================= */

  const availabilityForm = document.querySelector(
    '#availability-form'
  );

  const startDate = document.querySelector(
    '#start-date'
  );

  const endDate = document.querySelector(
    '#end-date'
  );

  if (startDate && endDate) {

    // No permitir fechas anteriores a hoy.
    startDate.min = todayString;
    endDate.min = todayString;


    // Al seleccionar la fecha inicial,
    // Hasta toma automáticamente la misma fecha.
    startDate.addEventListener('change', () => {

      const startValue = startDate.value;

      if (!startValue) {
        endDate.value = '';
        endDate.min = todayString;
        return;
      }

      endDate.min = startValue;

      // Si no existe fecha final o es anterior,
      // usamos la fecha inicial.
      if (
        !endDate.value ||
        endDate.value < startValue
      ) {
        endDate.value = startValue;
      }

    });


    // Evitar que el usuario deje un rango inválido.
    endDate.addEventListener('change', () => {

      const startValue = startDate.value;
      const endValue = endDate.value;

      if (
        startValue &&
        endValue &&
        endValue < startValue
      ) {
        endDate.value = startValue;
      }

    });

  }


  /* =========================
     FORMULARIO DE DISPONIBILIDAD
  ========================= */

  if (availabilityForm) {

    availabilityForm.addEventListener(
      'submit',
      (event) => {

        event.preventDefault();

        const results = document.querySelector(
          '#available-spaces'
        );

        if (!results || !startDate || !endDate) {
          return;
        }

        const startValue = startDate.value;
        const endValue = endDate.value;

        if (!startValue || !endValue) {
          return;
        }

        if (endValue < startValue) {
          endDate.value = startValue;
          return;
        }

        /*
         * Aquí conectaremos posteriormente
         * la consulta real a Supabase.
         *
         * De momento no mostramos espacios ficticios.
         */

        results.innerHTML = `
          <div class="empty">
            Buscando espacios disponibles para
            <strong>${startValue}</strong>
            ${endValue !== startValue
              ? ` hasta <strong>${endValue}</strong>`
              : ''}
          </div>
        `;
      }
    );


    availabilityForm.addEventListener(
      'reset',
      () => {

        window.setTimeout(() => {

          endDate.min = todayString;
          endDate.value = '';

        }, 0);

      }
    );

  }

})();
