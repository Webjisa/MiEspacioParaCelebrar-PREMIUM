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


    /* =========================
       SINCRONIZAR FECHA FINAL
    ========================= */

    const syncEndDate = () => {

      const startValue = startDate.value;

      if (!startValue) {
        endDate.value = '';
        endDate.min = todayString;
        return;
      }

      endDate.min = startValue;

      /*
       * Si Hasta está vacío,
       * debe ser exactamente igual
       * a Fecha de inicio.
       */
      if (!endDate.value) {
        endDate.value = startValue;
        return;
      }

      /*
       * Nunca permitimos que Hasta
       * sea anterior al inicio.
       */
      if (endDate.value < startValue) {
        endDate.value = startValue;
      }
    };


    /*
     * Eventos normales.
     */
    startDate.addEventListener(
      'input',
      syncEndDate
    );

    startDate.addEventListener(
      'change',
      syncEndDate
    );

    startDate.addEventListener(
      'blur',
      syncEndDate
    );

    startDate.addEventListener(
      'focusout',
      syncEndDate
    );


    /* =========================
       SOLUCIÓN PARA IPHONE
    ========================= */

    const prepareEndDateForPicker = () => {

      const startValue = startDate.value;

      if (!startValue) {
        return;
      }

      endDate.min = startValue;

      /*
       * IMPORTANTE:
       * rellenamos el valor ANTES de que
       * Safari abra el selector nativo.
       */
      if (!endDate.value) {
        endDate.value = startValue;
      }
    };


    /*
     * pointerdown se ejecuta antes de que
     * Safari abra el selector de fecha.
     */
    endDate.addEventListener(
      'pointerdown',
      prepareEndDateForPicker
    );


    /*
     * touchstart añade compatibilidad con
     * versiones de Safari/iOS que gestionan
     * date inputs de forma diferente.
     */
    endDate.addEventListener(
      'touchstart',
      prepareEndDateForPicker,
      { passive: true }
    );


    /*
     * También cubrimos teclado/escritorio.
     */
    endDate.addEventListener(
      'focus',
      prepareEndDateForPicker
    );


    /* =========================
       VALIDAR FECHA FINAL
    ========================= */

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
     FORMULARIO
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
         * Si por cualquier motivo Hasta
         * estuviera vacío, lo completamos.
         */
        if (!endDate.value) {
          endDate.value = startValue;
        }

        /*
         * Nunca permitir un rango inválido.
         */
        if (endDate.value < startValue) {
          endDate.value = startValue;
        }


        /* =========================
           RESULTADOS TEMPORALES
        ========================= */

        const results =
          document.querySelector('#available-spaces');

        if (!results) {
          return;
        }

        results.replaceChildren();

        const message =
          document.createElement('div');

        message.className = 'empty';

        const startText =
          document.createTextNode(
            'Búsqueda preparada para: '
          );

        message.appendChild(startText);

        const startElement =
          document.createElement('strong');

        startElement.textContent = startValue;

        message.appendChild(startElement);


        if (endDate.value !== startValue) {

          message.appendChild(
            document.createTextNode(' hasta ')
          );

          const endElement =
            document.createElement('strong');

          endElement.textContent =
            endDate.value;

          message.appendChild(endElement);
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
