'use strict';

(() => {

  /*
   * ============================================================
   * MiEspacioParaCelebrar
   * js/espacios.js
   * ============================================================
   *
   * Catálogo público de espacios.
   *
   * Responsabilidades:
   *
   * - Obtener espacios públicos desde Supabase.
   * - Respetar active / admin_enabled / owner_active.
   * - Obtener la imagen principal.
   * - Mostrar las tarjetas.
   * - Pasar el UUID REAL del espacio a espacio.html.
   *
   * No contiene claves privadas.
   * Utiliza únicamente la ANON KEY pública.
   */


  const SUPABASE_URL =
    'https://hvuseljtqdgekotrsiwd.supabase.co';


  const SUPABASE_ANON_KEY =
    window.MIESPACIO_SUPABASE_ANON_KEY || '';


  const grid =
    document.querySelector(
      '#spaces-grid'
    );


  const loading =
    document.querySelector(
      '#spaces-loading'
    );


  const errorPanel =
    document.querySelector(
      '#spaces-error'
    );


  const emptyPanel =
    document.querySelector(
      '#spaces-empty'
    );


  const retryButton =
    document.querySelector(
      '#spaces-retry'
    );


  /*
   * ------------------------------------------------------------
   * Utilidades
   * ------------------------------------------------------------
   */


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


  function getSupabaseClient() {

    if (
      !window.supabase ||
      !SUPABASE_ANON_KEY
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
        'No se pudo crear el cliente de Supabase:',
        error
      );

      return null;

    }

  }


  function isSpaceActive(space) {

    if (
      space.active === false ||
      space.admin_enabled === false ||
      space.owner_active === false
    ) {

      return false;

    }


    const now =
      new Date();


    if (
      space.active_from
    ) {

      const activeFrom =
        new Date(
          `${space.active_from}T00:00:00`
        );


      if (
        activeFrom > now
      ) {

        return false;

      }

    }


    if (
      space.active_until
    ) {

      const activeUntil =
        new Date(
          `${space.active_until}T23:59:59`
        );


      if (
        activeUntil < now
      ) {

        return false;

      }

    }


    return true;

  }


  function formatPrice(value) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return '';

    }


    const number =
      Number(value);


    if (
      !Number.isFinite(number)
    ) {

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


  /*
   * ------------------------------------------------------------
   * Obtener espacios
   * ------------------------------------------------------------
   */

  async function getSpaces() {

    const client =
      getSupabaseClient();


    if (!client) {

      throw new Error(
        'No se ha podido inicializar la conexión con Supabase.'
      );

    }


    /*
     * Consulta principal.
     *
     * No utilizamos select('*').
     * Solo solicitamos los campos que necesita
     * el catálogo público.
     */
    const {
      data,
      error
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
        active,
        admin_enabled,
        owner_active,
        active_from,
        active_until
      `)
      .eq(
        'active',
        true
      )
      .eq(
        'admin_enabled',
        true
      )
      .eq(
        'owner_active',
        true
      )
      .order(
        'name',
        {
          ascending: true
        }
      );


    if (error) {

      throw error;

    }


    const activeSpaces =
      (data || [])
        .filter(isSpaceActive);


    /*
     * ----------------------------------------------------------
     * Obtener imágenes.
     *
     * Se hace una consulta por espacio.
     * Es perfectamente válido para el catálogo actual.
     *
     * Más adelante, cuando tengamos el catálogo definitivo,
     * podemos optimizarlo si el número de espacios crece mucho.
     * ----------------------------------------------------------
     */

    const spaces =
      [];


    for (
      const space of activeSpaces
    ) {

      let images = [];


      try {

        const {
          data: imageData,
          error: imageError
        } = await client
          .from('space_images')
          .select(
            'image_url,sort_order'
          )
          .eq(
            'space_id',
            space.id
          )
          .order(
            'sort_order',
            {
              ascending: true
            }
          );


        if (
          !imageError
        ) {

          images =
            (imageData || [])
              .map(
                image =>
                  image.image_url
              )
              .filter(Boolean);

        }

      } catch (imageError) {

        console.warn(
          `No se pudieron cargar las imágenes de ${space.name}:`,
          imageError
        );

      }


      spaces.push({

        ...space,

        images

      });

    }


    return spaces;

  }


  /*
   * ------------------------------------------------------------
   * Crear tarjeta
   * ------------------------------------------------------------
   */

  function createSpaceCard(
    space
  ) {

    const article =
      document.createElement(
        'article'
      );


    article.className =
      'card';


    /*
     * Imagen principal.
     *
     * Si no existe imagen:
     * no inventamos una.
     */
    const media =
      document.createElement(
        'div'
      );


    media.className =
      'card-media';


    if (
      space.images &&
      space.images.length
    ) {

      const image =
        document.createElement(
          'img'
        );


      image.src =
        space.images[0];


      image.alt =
        space.name || 'Espacio para celebrar';


      image.loading =
        'lazy';


      image.decoding =
        'async';


      media.replaceChildren(
        image
      );

    } else {

      media.textContent =
        'Imagen del espacio';

      media.setAttribute(
        'aria-label',
        'Imagen del espacio pendiente de incorporar'
      );

    }


    article.appendChild(
      media
    );


    /*
     * Contenido.
     */
    const body =
      document.createElement(
        'div'
      );


    body.className =
      'card-body';


    const meta =
      document.createElement(
        'div'
      );


    meta.className =
      'card-meta';


    meta.textContent =
      [
        space.city,
        space.province
      ]
        .filter(Boolean)
        .join(' · ');


    body.appendChild(
      meta
    );


    const title =
      document.createElement(
        'div'
      );


    title.className =
      'card-title';


    title.textContent =
      space.name ||
      'Espacio para celebrar';


    body.appendChild(
      title
    );


    const description =
      document.createElement(
        'p'
      );


    description.className =
      'card-copy';


    description.textContent =
      space.description ||
      'Espacio disponible para celebraciones y eventos.';


    body.appendChild(
      description
    );


    article.appendChild(
      body
    );


    /*
     * Precio.
     *
     * Tomamos el precio más bajo disponible entre
     * los precios públicos del espacio.
     */
    const prices = [
      space.weekday_price,
      space.friday_price,
      space.saturday_price,
      space.sunday_price,
      space.holiday_price
    ]
      .map(Number)
      .filter(
        value =>
          Number.isFinite(value) &&
          value > 0
      );


    const lowestPrice =
      prices.length
        ? Math.min(...prices)
        : null;


    const footer =
      document.createElement(
        'div'
      );


    footer.className =
      'card-footer';


    const price =
      document.createElement(
        'span'
      );


    price.className =
      'price';


    if (
      lowestPrice !== null
    ) {

      price.textContent =
        `Desde ${formatPrice(lowestPrice)}`;

    } else {

      price.textContent =
        'Consultar precio';

    }


    footer.appendChild(
      price
    );


    /*
     * MUY IMPORTANTE:
     *
     * Pasamos el UUID REAL.
     *
     * No usamos:
     *   ?space=la-nube
     *   ?space=espacio-1
     *   ?space=otro
     *
     * El calendario y las consultas de Supabase necesitan
     * el UUID real.
     */
    const link =
      document.createElement(
        'a'
      );


    link.className =
      'button button-secondary';


    link.href =
      `espacio.html?id=${encodeURIComponent(space.id)}`;


    link.textContent =
      'Ver espacio →';


    footer.appendChild(
      link
    );


    article.appendChild(
      footer
    );


    return article;

  }


  /*
   * ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------
   */

  function renderSpaces(
    spaces
  ) {

    if (!grid) {
      return;
    }


    grid.replaceChildren();


    if (
      !spaces.length
    ) {

      if (emptyPanel) {
        emptyPanel.hidden =
          false;
      }

      return;

    }


    if (emptyPanel) {
      emptyPanel.hidden =
        true;
    }


    const fragment =
      document.createDocumentFragment();


    spaces.forEach(
      space => {

        fragment.appendChild(
          createSpaceCard(
            space
          )
        );

      }
    );


    grid.appendChild(
      fragment
    );

  }


  /*
   * ------------------------------------------------------------
   * Carga
   * ------------------------------------------------------------
   */

  async function loadSpaces() {

    if (loading) {
      loading.hidden =
        false;
    }


    if (errorPanel) {
      errorPanel.hidden =
        true;
    }


    if (emptyPanel) {
      emptyPanel.hidden =
        true;
    }


    if (grid) {
      grid.replaceChildren();
    }


    try {

      const spaces =
        await getSpaces();


      renderSpaces(
        spaces
      );


      if (loading) {
        loading.hidden =
          true;
      }


    } catch (error) {

      console.error(
        'Error cargando los espacios:',
        error
      );


      if (loading) {
        loading.hidden =
          true;
      }


      if (errorPanel) {

        errorPanel.hidden =
          false;

      }

    }

  }


  /*
   * ------------------------------------------------------------
   * Reintentar
   * ------------------------------------------------------------
   */

  retryButton?.addEventListener(
    'click',
    () => {

      loadSpaces();

    }
  );


  /*
   * ------------------------------------------------------------
   * Inicio
   * ------------------------------------------------------------
   */

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      loadSpaces,
      {
        once: true
      }
    );

  } else {

    loadSpaces();

  }

})();
