(() => {
  'use strict';

  /* =========================
     NAVEGACIÓN
  ========================= */

  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');

      toggle.setAttribute(
        'aria-expanded',
        String(isOpen)
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

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });


  /* =========================
     FECHA ACTUAL
  ========================= */

  const now = new Date();

  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');

  const todayString =
    `${currentYear}-${currentMonth}-${currentDay}`;


  /* =========================
     DISPONIBILIDAD
  ========================= */

  const availabilityForm =
    document.querySelector('#availability-form');

  const startDate =
    document.querySelector('#start-date');

  const endDate =
    document.querySelector('#end-date');


  if (startDate && endDate) {

    /*
     * No permitir fechas anteriores a hoy.
     */
    startDate.min = todayString;
    endDate.min = todayString;


    /*
     * Mantener "Hasta" sincronizado con
     * la fecha de inicio.
     *
     * Se utilizan tanto "input" como "change"
     * porque los navegadores móviles pueden
     * gestionar el selector de fechas de forma distinta.
     */
    const syncEndDate = () => {

      const startValue = startDate.value;

      if (!startValue) {
        endDate.value = '';
        endDate.min = todayString;
        return;
      }

      /*
       * La fecha final no puede ser anterior
       * a la fecha inicial.
       */
      endDate.min = startValue;

      /*
       * Al elegir una nueva fecha inicial:
       * - si no existe fecha final → copiar inicio
       * - si la fecha final es anterior → copiar inicio
       */
      if (
        !endDate.value ||
        endDate.value < startValue
      ) {
        endDate.value = startValue;

        /*
         * Forzar actualización visual del
         * campo en determinados navegadores móviles.
         */
        endDate.dispatchEvent(
          new Event('change', { bubbles: true })
        );
      }
    };


    startDate.addEventListener(
      'input',
      syncEndDate
    );

    startDate.addEventListener(
      'change',
      syncEndDate
    );


    /*
     * Protección adicional al modificar
     * manualmente la fecha final.
     */
    const validateEndDate = () => {

      const startValue = startDate.value;
      const endValue = endDate.value;

      if (!startValue) {
        return;
      }

      endDate.min = startValue;

      if (
        endValue &&
        endValue < startValue
      ) {
        endDate.value = startValue;
      }
    };


    endDate.addEventListener(
      'input',
      validateEndDate
    );

    endDate.addEventListener(
      'change',
      validateEndDate
    );

  }


  /* =========================
     FORMULARIO DE DISPONIBILIDAD
  ========================= */

  if (availabilityForm) {

    availabilityForm.addEventListener(
      'submit',
      (event) => {

        event.preventDefault();

        if (!startDate || !endDate) {
          return;
        }

        const startValue = startDate.value;
        const endValue = endDate.value;

        /*
         * Validación básica.
         */
        if (!startValue) {
          startDate.focus();
          return;
        }

        /*
         * Si por cualquier motivo no existe
         * fecha final, usamos la inicial.
         */
        if (!endValue) {
          endDate.value = startValue;
        }

        /*
         * La fecha final nunca puede ser anterior
         * a la fecha inicial.
         */
        if (endDate.value < startValue) {
          endDate.value = startValue;
        }


        /* =========================
           RESULTADOS
        ========================= */

        const results =
          document.querySelector('#available-spaces');

        if (!results) {
          return;
        }

        /*
         * Todavía no consultamos Supabase.
         * Esta parte se conectará al backend
         * cuando terminemos la estructura.
         */

        results.replaceChildren();

        const message = document.createElement('div');

        message.className = 'empty';

        const textStart =
          document.createTextNode(
            'Búsqueda preparada para: '
          );

        const strongStart =
          document.createElement('strong');

        strongStart.textContent = startValue;

        message.appendChild(textStart);
        message.appendChild(strongStart);

        if (endDate.value !== startValue) {

          message.appendChild(
            document.createTextNode(' hasta ')
          );

          const strongEnd =
            document.createElement('strong');

          strongEnd.textContent = endDate.value;

          message.appendChild(strongEnd);
        }

        results.appendChild(message);
      }
    );


    /* =========================
       RESET
    ========================= */

    availabilityForm.addEventListener(
      'reset',
      () => {

        /*
         * Esperamos a que el navegador termine
         * el reset nativo del formulario.
         */
        window.setTimeout(() => {

          if (startDate) {
            startDate.min = todayString;
          }

          if (endDate) {
            endDate.min = todayString;
            endDate.value = '';
          }

          const results =
            document.querySelector('#available-spaces');

          if (results) {

            results.replaceChildren();

            const message =
              document.createElement('div');

            message.className = 'empty';
            message.textContent =
              'Selecciona una fecha para buscar espacios disponibles.';

            results.appendChild(message);
          }

        }, 0);
      }
    );

  }

})();
