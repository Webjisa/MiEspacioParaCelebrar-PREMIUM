(() => {
  'use strict';

  /* =========================
     UTILIDADES
  ========================== */

  const getTodayString = () => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');
  };


  const getUrlParameters = () => {
    return new URLSearchParams(window.location.search);
  };


  const buildReservationUrl = ({
    space,
    start,
    end
  }) => {

    const params = new URLSearchParams();

    if (space) {
      params.set('space', space);
    }

    if (start) {
      params.set('start', start);
    }

    if (end) {
      params.set('end', end);
    }

    const query = params.toString();

    return query
      ? `reservar.html?${query}`
      : 'reservar.html';
  };


  /* =========================
     NAVEGACIÓN
  ========================== */

  const toggle =
    document.querySelector('[data-nav-toggle]');

  const nav =
    document.querySelector('[data-nav]');


  if (toggle && nav) {

    toggle.addEventListener('click', () => {

      const isOpen =
        nav.classList.toggle('is-open');

      toggle.setAttribute(
        'aria-expanded',
        String(isOpen)
      );
    });


    nav.addEventListener('click', (event) => {

      if (
        event.target instanceof HTMLAnchorElement
      ) {

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
  ========================== */

  document
    .querySelectorAll('[data-year]')
    .forEach((element) => {

      element.textContent =
        String(new Date().getFullYear());

    });


  /* =========================
     FECHA ACTUAL
  ========================== */

  const todayString =
    getTodayString();


  /* =========================================================
     FUNCIÓN COMÚN PARA CAMPOS DE FECHA
  ========================================================== */

  const setupDateRange = ({
    startInput,
    endInput
  }) => {

    if (!startInput || !endInput) {
      return;
    }


    startInput.min =
      todayString;

    endInput.min =
      todayString;


    /* =========================
       SINCRONIZAR FECHA FINAL
    ========================== */

    const syncEndDate = () => {

      const startValue =
        startInput.value;


      if (!startValue) {

        endInput.value = '';

        endInput.min =
          todayString;

        return;
      }


      endInput.min =
        startValue;


      /*
       * Si Hasta está vacío,
       * debe ser exactamente igual
       * a Fecha de inicio.
       */

      if (!endInput.value) {

        endInput.value =
          startValue;

        return;
      }


      /*
       * Nunca permitimos que Hasta
       * sea anterior al inicio.
       */

      if (
        endInput.value <
        startValue
      ) {

        endInput.value =
          startValue;
      }

    };


    /* =========================
       EVENTOS NORMALES
    ========================== */

    startInput.addEventListener(
      'input',
      syncEndDate
    );

    startInput.addEventListener(
      'change',
      syncEndDate
    );

    startInput.addEventListener(
      'blur',
      syncEndDate
    );

    startInput.addEventListener(
      'focusout',
      syncEndDate
    );


    /* =========================
       SOLUCIÓN PARA IPHONE
    ========================== */

    const prepareEndDateForPicker = () => {

      const startValue =
        startInput.value;


      if (!startValue) {
        return;
      }


      endInput.min =
        startValue;


      /*
       * IMPORTANTE:
       * rellenamos el valor ANTES de que
       * Safari abra el selector nativo.
       */

      if (!endInput.value) {

        endInput.value =
          startValue;
      }

    };


    endInput.addEventListener(
      'pointerdown',
      prepareEndDateForPicker
    );


    endInput.addEventListener(
      'touchstart',
      prepareEndDateForPicker,
      {
        passive: true
      }
    );


    endInput.addEventListener(
      'focus',
      prepareEndDateForPicker
    );


    /* =========================
       VALIDAR FECHA FINAL
    ========================== */

    const validateEndDate = () => {

      const startValue =
        startInput.value;

      const endValue =
        endInput.value;


      if (!startValue) {
        return;
      }


      endInput.min =
        startValue;


      if (
        !endValue ||
        endValue < startValue
      ) {

        endInput.value =
          startValue;
      }

    };


    endInput.addEventListener(
      'input',
      validateEndDate
    );

    endInput.addEventListener(
      'change',
      validateEndDate
    );

    endInput.addEventListener(
      'blur',
      validateEndDate
    );


    return {
      syncEndDate,
      validateEndDate
    };

  };


  /* =========================================================
     DISPONIBILIDAD GENERAL
  ========================================================== */

  const availabilityForm =
    document.querySelector(
      '#availability-form'
    );

  const startDate =
    document.querySelector(
      '#start-date'
    );

  const endDate =
    document.querySelector(
      '#end-date'
    );


  if (
    availabilityForm &&
    startDate &&
    endDate
  ) {

    setupDateRange({
      startInput: startDate,
      endInput: endDate
    });


    availabilityForm.addEventListener(
      'submit',
      (event) => {

        event.preventDefault();


        const startValue =
          startDate.value;


        if (!startValue) {

          startDate.focus();

          return;
        }


        /*
         * Si por cualquier motivo Hasta
         * estuviera vacío, lo completamos.
         */

        if (!endDate.value) {

          endDate.value =
            startValue;
        }


        /*
         * Nunca permitir un rango inválido.
         */

        if (
          endDate.value <
          startValue
        ) {

          endDate.value =
            startValue;
        }


        /* =========================
           RESULTADOS TEMPORALES
        ========================== */

        const results =
          document.querySelector(
            '#available-spaces'
          );


        if (!results) {
          return;
        }


        results.replaceChildren();


        const message =
          document.createElement('div');

        message.className =
          'empty';


        const startText =
          document.createTextNode(
            'Búsqueda preparada para: '
          );

        message.appendChild(
          startText
        );


        const startElement =
          document.createElement('strong');

        startElement.textContent =
          startValue;

        message.appendChild(
          startElement
        );


        if (
          endDate.value !==
          startValue
        ) {

          message.appendChild(
            document.createTextNode(
              ' hasta '
            )
          );


          const endElement =
            document.createElement('strong');

          endElement.textContent =
            endDate.value;

          message.appendChild(
            endElement
          );

        }


        results.appendChild(
          message
        );

      }
    );


    /* =========================
       LIMPIAR
    ========================== */

    availabilityForm.addEventListener(
      'reset',
      () => {

        window.setTimeout(() => {

          startDate.min =
            todayString;

          endDate.min =
            todayString;

          endDate.value =
            '';


          const results =
            document.querySelector(
              '#available-spaces'
            );


          if (results) {

            results.replaceChildren();


            const message =
              document.createElement(
                'div'
              );

            message.className =
              'empty';

            message.textContent =
              'Selecciona una fecha para buscar espacios disponibles.';

            results.appendChild(
              message
            );

          }

        }, 0);

      }
    );

  }


  /* =========================================================
     FICHA DE ESPACIO
  ========================================================== */

  const spaceAvailabilityForm =
    document.querySelector(
      '#space-availability-form'
    );


  const spaceStartDate =
    document.querySelector(
      '#space-start-date'
    );


  const spaceEndDate =
    document.querySelector(
      '#space-end-date'
    );


  const spaceAvailabilityResult =
    document.querySelector(
      '#space-availability-result'
    );


  const spaceBookButton =
    document.querySelector(
      '#space-book-button'
    );


  if (
    spaceAvailabilityForm &&
    spaceStartDate &&
    spaceEndDate
  ) {

    /*
     * IMPORTANTE:
     * El formulario de la ficha del espacio
     * utiliza exactamente la misma lógica
     * que el formulario general.
     */

    setupDateRange({
      startInput: spaceStartDate,
      endInput: spaceEndDate
    });


    spaceAvailabilityForm.addEventListener(
      'submit',
      (event) => {

        event.preventDefault();


        const startValue =
          spaceStartDate.value;


        if (!startValue) {

          spaceStartDate.focus();

          return;
        }


        /*
         * Si Hasta está vacío,
         * será igual a Inicio.
         */

        if (!spaceEndDate.value) {

          spaceEndDate.value =
            startValue;
        }


        /*
         * Nunca permitir un rango
         * anterior a la fecha de inicio.
         */

        if (
          spaceEndDate.value <
          startValue
        ) {

          spaceEndDate.value =
            startValue;
        }


        /*
         * Obtener el nombre del espacio
         * que aparece en la ficha.
         */

        const spaceTitle =
          document.querySelector(
            'main h1'
          );


        const spaceName =
          spaceTitle
            ? spaceTitle.textContent.trim()
            : '';


        /*
         * Por ahora solamente mostramos
         * las fechas seleccionadas.
         *
         * La comprobación real contra
         * Supabase se añadirá después.
         */

        if (spaceAvailabilityResult) {

          spaceAvailabilityResult
            .replaceChildren();


          const message =
            document.createElement(
              'div'
            );


          message.className =
            'empty';


          const title =
            document.createElement(
              'strong'
            );


          title.textContent =
            'Fechas seleccionadas';

          message.appendChild(
            title
          );


          message.appendChild(
            document.createElement('br')
          );


          const dateText =
            document.createTextNode(
              spaceEndDate.value === startValue
                ? startValue
                : `${startValue} hasta ${spaceEndDate.value}`
            );


          message.appendChild(
            dateText
          );


          spaceAvailabilityResult
            .appendChild(message);

        }


        /*
         * Preparamos provisionalmente
         * el enlace de solicitud.
         *
         * La disponibilidad real se
         * conectará posteriormente con
         * Supabase.
         */

        if (spaceBookButton) {

          spaceBookButton.href =
            buildReservationUrl({
              space: spaceName,
              start: startValue,
              end: spaceEndDate.value
            });

        }

      }
    );

  }


  /* =========================================================
     RESERVA
  ========================================================== */

  const bookingForm =
    document.querySelector(
      '#booking-request-form'
    );


  if (bookingForm) {

    const params =
      getUrlParameters();


    const space =
      params.get('space') || '';


    const start =
      params.get('start') || '';


    const end =
      params.get('end') || '';


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


    const bookingResult =
      document.querySelector(
        '#booking-request-result'
      );


    /*
     * Rellenar el contexto recibido.
     */

    if (selectedSpace) {

      selectedSpace.value =
        space;

    }


    if (selectedStart) {

      selectedStart.value =
        start;

    }


    if (selectedEnd) {

      selectedEnd.value =
        end || start;

    }


    /*
     * Si falta información esencial,
     * no permitimos enviar una solicitud
     * incompleta.
     */

    const hasReservationContext =
      Boolean(
        space &&
        start &&
        (end || start)
      );


    if (!hasReservationContext) {

      if (bookingResult) {

        bookingResult.className =
          'notice notice-spaced';

        bookingResult.textContent =
          'Para solicitar una reserva debes seleccionar primero un espacio y unas fechas.';

      }


      const submitButton =
        document.querySelector(
          '#booking-submit'
        );


      if (submitButton) {

        submitButton.disabled =
          true;

      }

    }


    /* =========================
       ENVÍO TEMPORAL
    ========================== */

    bookingForm.addEventListener(
      'submit',
      (event) => {

        event.preventDefault();


        if (!hasReservationContext) {
          return;
        }


        /*
         * Todavía no enviamos nada a Supabase.
         *
         * La RPC segura de creación de
         * solicitudes se conectará en la
         * siguiente fase.
         */

        if (bookingResult) {

          bookingResult.className =
            'notice notice-spaced';

          bookingResult.textContent =
            'La solicitud está preparada. La conexión con Supabase se realizará en el siguiente paso.';

        }

      }
    );

  }

})();
