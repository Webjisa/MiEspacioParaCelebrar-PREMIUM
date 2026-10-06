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

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');


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

    startDate.min = todayString;
    endDate.min = todayString;


    /*
     * Sincroniza "Hasta" con "Fecha de inicio".
     */
    const syncEndDate = () => {

      const startValue = startDate.value;

      if (!startValue) {
        endDate.value = '';
        endDate.min = todayString;
        return;
      }

      endDate.min = startValue;

      /*
       * Si no hay fecha final, usamos
       * automáticamente la fecha inicial.
       */
      if (!endDate.value) {
        endDate.value = startValue;
        return;
      }

      /*
       * Si la fecha final queda antes que
       * la fecha inicial, la corregimos.
       */
      if (endDate.value < startValue) {
        endDate.value = startValue;
      }
    };


    /*
     * Escritorio y Android.
     */
    startDate.addEventListener(
      'input',
      syncEndDate
    );

    startDate.addEventListener(
      'change',
      syncEndDate
    );


    /*
     * Safari / iPhone.
     *
     * En algunos casos Safari termina de
     * actualizar el campo al perder el foco.
     */
    startDate.addEventListener(
      'blur',
      syncEndDate
    );

    startDate.addEventListener(
      'focusout',
      syncEndDate
    );


    /*
     * Si el usuario modifica "Hasta",
     * nunca puede quedar antes del inicio.
     */
    const validateEndDate = () => {

      const startValue = startDate.value;
      const endValue = endDate.value;

      if (!startValue) {
        return;
      }

      endDate.min = startValue;

      if (
        !endValue ||
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

    endDate.addEventListener(
      'blur',
      validateEndDate
    );

  }


  /* =========================
     BÚSQUEDA
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

        if (!startValue) {
          startDate.focus();
          return;
        }

        /*
         * Si "Hasta" está vacío, automáticamente
         * utilizamos la fecha de inicio.
         */
        if (!endDate.value) {
          endDate.value = startValue;
        }

        /*
         * Seguridad adicional:
         * nunca permitir un final anterior al inicio.
         */
        if (endDate.value < startValue) {
          endDate.value = startValue;
        }

        const results =
          document.querySelector('#available-spaces');

        if (!results) {
          return;
        }

        results.replaceChildren();

        const message =
          document.createElement('div');

        message.className = 'empty';

        const text =
          document.createTextNode(
            'Búsqueda preparada para: '
          );

        message.appendChild(text);

        const start =
          document.createElement('strong');

        start.textContent = startValue;

        message.appendChild(start);

        if (endDate.value !== startValue) {

          message.appendChild(
            document.createTextNode(' hasta ')
          );

          const end =
            document.createElement('strong');

          end.textContent = endDate.value;

          message.appendChild(end);
        }

        results.appendChild(message);
      }
    );


    /* =========================
       LIMPIAR
    ========================= */

    availabilityForm.addEventListener(
      'reset',
      () => {

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
