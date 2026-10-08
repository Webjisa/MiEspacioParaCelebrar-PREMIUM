'use strict';

(() => {
  const SUPABASE_URL = 'https://hvuseljtqdgekotrsiwd.supabase.co';
  const SUPABASE_ANON_KEY = window.MIESPACIO_SUPABASE_ANON_KEY || '';

  function client() {
    if (!SUPABASE_ANON_KEY || !window.supabase) return null;
    try {
      return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
      console.error('Error creando el cliente de Supabase:', error);
      return null;
    }
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/[&<>'"]/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      })[char]);
  }

  function euro(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0,00 €';
    return `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }

  function dateES(value) {
    if (!value) return '—';
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('es-ES');
  }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function setMessage(element, message, type = '') {
    if (!element) return;
    element.textContent = message || '';
    element.classList.remove('notice-success', 'notice-error', 'notice-warning');
    if (type === 'success') element.classList.add('notice-success');
    if (type === 'error') element.classList.add('notice-error');
    if (type === 'warning') element.classList.add('notice-warning');
    element.hidden = !message;
  }

  async function getSessionUser(sb) {
    /*
     * Primero consultamos la sesión local. Esto evita que una entrada
     * directa en area-privada.html quede esperando innecesariamente una
     * petición de red cuando no existe ninguna sesión.
     */
    const sessionResult = await sb.auth.getSession();
    if (sessionResult.error) throw sessionResult.error;

    const sessionUser = sessionResult.data?.session?.user || null;
    if (!sessionUser) return null;

    const userResult = await sb.auth.getUser();
    if (userResult.error) throw userResult.error;
    return userResult.data?.user || null;
  }

  async function getProfile(sb, userId) {
    const result = await sb
      .from('profiles')
      .select('role,active,email')
      .eq('id', userId)
      .maybeSingle();
    if (result.error) throw result.error;
    return result.data;
  }

  async function resolvePrivateDestination(sb) {
    const user = await getSessionUser(sb);
    if (!user) return { user: null, profile: null, destination: 'acceso.html' };

    const profile = await getProfile(sb, user.id);
    if (!profile) throw new Error('No existe un perfil de acceso asociado a este usuario.');
    if (profile.active !== true) throw new Error('Tu perfil de acceso está desactivado.');

    if (profile.role === 'admin') return { user, profile, destination: 'admin.html' };
    if (profile.role === 'owner') return { user, profile, destination: 'area-privada.html' };
    throw new Error(`Tu perfil tiene un rol no válido: ${profile.role || '(vacío)'}.`);
  }

  async function initLoginPage() {
    const form = document.querySelector('#private-login-form');
    if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';

    const sb = client();
    const message = document.querySelector('#private-login-message');
    const submit = form.querySelector('button[type="submit"]');

    if (!sb) {
      setMessage(message, 'No se ha podido inicializar la conexión con Supabase.', 'error');
      return;
    }

    try {
      const state = await resolvePrivateDestination(sb);
      if (state.destination !== 'acceso.html') {
        window.location.replace(state.destination);
        return;
      }
    } catch (error) {
      console.error('Error comprobando la sesión:', error);
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const email = document.querySelector('#private-email')?.value.trim() || '';
      const password = document.querySelector('#private-password')?.value || '';

      if (!email || !password) {
        setMessage(message, 'Introduce el correo y la contraseña.', 'error');
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Accediendo…';
      setMessage(message, 'Comprobando credenciales…');

      try {
        const login = await sb.auth.signInWithPassword({ email, password });
        if (login.error) throw login.error;
        if (!login.data?.user) throw new Error('No se ha recibido un usuario autenticado.');

        const state = await resolvePrivateDestination(sb);
        if (state.destination === 'acceso.html') {
          throw new Error('La autenticación se ha realizado, pero el perfil no permite el acceso privado.');
        }

        setMessage(message, 'Acceso correcto. Entrando…', 'success');
        window.location.replace(state.destination);
      } catch (error) {
        console.error('Error de acceso:', error);
        setMessage(message, error?.message || 'No se ha podido iniciar sesión.', 'error');
        submit.disabled = false;
        submit.textContent = 'Acceder';
      }
    });
  }

  function bookingView(booking, today) {
    const status = String(booking?.booking_status || '');
    const start = String(booking?.start_date || '');
    const end = String(booking?.end_date || '');

    if (status === 'pending') return 'pending';
    if (status === 'confirmed') {
      if (end < today) return 'finished';
      if (start <= today && end >= today) return 'current';
      return 'confirmed';
    }
    return 'history';
  }

  function statusLabel(status) {
    return ({
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      rejected: 'Rechazada',
      cancelled: 'Cancelada',
      expired: 'Expirada'
    })[status] || status || '—';
  }

  function renderStats(root, bookings) {
    const today = todayISO();
    const groups = { pending: 0, confirmed: 0, current: 0, finished: 0 };

    for (const booking of bookings) {
      const view = bookingView(booking, today);
      if (view === 'pending') groups.pending += 1;
      if (view === 'confirmed') groups.confirmed += 1;
      if (view === 'current') groups.current += 1;
      if (view === 'finished') groups.finished += 1;
    }

    root.querySelector('[data-stat="pending"]').textContent = groups.pending;
    root.querySelector('[data-stat="confirmed"]').textContent = groups.confirmed;
    root.querySelector('[data-stat="current"]').textContent = groups.current;
    root.querySelector('[data-stat="finished"]').textContent = groups.finished;
  }

  function renderSpaces(root, spaces) {
    const box = root.querySelector('#owner-spaces');
    if (!box) return;

    if (!spaces.length) {
      box.innerHTML = '<div class="notice">No tienes espacios asignados a este perfil.</div>';
      return;
    }

    box.innerHTML = spaces.map(space => {
      const operational = space.active === true && space.owner_active === true && space.admin_enabled === true;
      return `
        <article class="card private-space-card">
          <div class="card-body">
            <div class="space-status ${operational ? 'is-active' : 'is-inactive'}">${operational ? 'ACTIVO' : 'INACTIVO'}</div>
            <h3 class="card-title">${esc(space.name)}</h3>
            <p class="card-copy">${esc([space.city, space.province].filter(Boolean).join(' · ') || 'Ubicación no indicada')}</p>
            <p class="micro">Actividad: ${dateES(space.active_from)} — ${dateES(space.active_until)}</p>
          </div>
          <div class="card-footer private-space-actions">
            <button class="button button-secondary" type="button" data-edit-space="${esc(space.id)}">Gestionar</button>
            <button class="button ${operational ? 'button-secondary' : 'button-primary'}" type="button" data-toggle-space="${esc(space.id)}" data-next-active="${operational ? 'false' : 'true'}" ${space.admin_enabled ? '' : 'disabled'}>${operational ? 'Poner inactivo' : 'Activar espacio'}</button>
          </div>
        </article>`;
    }).join('');
  }

  function renderBookings(root, bookings) {
    const box = root.querySelector('#owner-bookings');
    if (!box) return;

    const rows = [...bookings].sort((a, b) => String(a.start_date || '').localeCompare(String(b.start_date || '')));
    if (!rows.length) {
      box.innerHTML = '<div class="notice">Todavía no hay solicitudes o reservas para tus espacios.</div>';
      return;
    }

    box.innerHTML = rows.map(booking => `
      <article class="private-booking-row">
        <div>
          <strong>${esc(booking.space_name)}</strong>
          <p>${dateES(booking.start_date)}${booking.start_date !== booking.end_date ? ` → ${dateES(booking.end_date)}` : ''}</p>
        </div>
        <div>
          <strong>${esc(booking.customer_name || 'Cliente')}</strong>
          <p>${esc(booking.customer_email || '')}</p>
        </div>
        <div class="private-booking-status status-${esc(booking.booking_status)}">${statusLabel(booking.booking_status)}</div>
      </article>`).join('');
  }

  function openSpaceEditor(root, sb, space, pricing = {}) {
    const existing = document.querySelector('#private-space-modal');
    existing?.remove();

    const price = key => Number(pricing?.[key] ?? 0);

    const modal = document.createElement('div');
    modal.id = 'private-space-modal';
    modal.className = 'private-modal-backdrop';
    modal.innerHTML = `
      <div class="private-modal" role="dialog" aria-modal="true" aria-labelledby="private-modal-title">
        <div class="private-modal-head">
          <div>
            <p class="eyebrow">GESTIONAR ESPACIO</p>
            <h2 id="private-modal-title">${esc(space.name)}</h2>
          </div>
          <button class="button button-secondary" type="button" data-close-modal>Cerrar</button>
        </div>

        <form id="private-space-form">
          <div class="form-grid">
            <div class="form-field">
              <label for="private-monday">Lunes (€)</label>
              <input id="private-monday" type="number" min="0" step="0.01" inputmode="decimal" value="${price('monday_price')}">
            </div>

            <div class="form-field">
              <label for="private-tuesday">Martes (€)</label>
              <input id="private-tuesday" type="number" min="0" step="0.01" inputmode="decimal" value="${price('tuesday_price')}">
            </div>

            <div class="form-field">
              <label for="private-wednesday">Miércoles (€)</label>
              <input id="private-wednesday" type="number" min="0" step="0.01" inputmode="decimal" value="${price('wednesday_price')}">
            </div>

            <div class="form-field">
              <label for="private-thursday">Jueves (€)</label>
              <input id="private-thursday" type="number" min="0" step="0.01" inputmode="decimal" value="${price('thursday_price')}">
            </div>

            <div class="form-field">
              <label for="private-friday">Viernes (€)</label>
              <input id="private-friday" type="number" min="0" step="0.01" inputmode="decimal" value="${price('friday_price')}">
            </div>

            <div class="form-field">
              <label for="private-saturday">Sábado (€)</label>
              <input id="private-saturday" type="number" min="0" step="0.01" inputmode="decimal" value="${price('saturday_price')}">
            </div>

            <div class="form-field">
              <label for="private-sunday">Domingo (€)</label>
              <input id="private-sunday" type="number" min="0" step="0.01" inputmode="decimal" value="${price('sunday_price')}">
            </div>

            <div class="form-field">
              <label for="private-holiday">Festivo (€)</label>
              <input id="private-holiday" type="number" min="0" step="0.01" inputmode="decimal" value="${price('holiday_price')}">
            </div>

            <div class="form-field">
              <label for="private-holiday-eve">Víspera de festivo (€)</label>
              <input id="private-holiday-eve" type="number" min="0" step="0.01" inputmode="decimal" value="${price('holiday_eve_price')}">
            </div>

            <div class="form-field">
              <label for="private-opening">Hora de apertura</label>
              <input id="private-opening" type="time" value="${esc(String(space.opening_time || '11:00').slice(0,5))}">
            </div>

            <div class="form-field">
              <label for="private-closing">Hora de cierre</label>
              <input id="private-closing" type="time" value="${esc(String(space.closing_time || '23:00').slice(0,5))}">
            </div>

            <div class="form-field">
              <label for="private-cleaning-price">Limpieza (€)</label>
              <input id="private-cleaning-price" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(space.cleaning_price ?? 0)}">
            </div>

            <div class="form-field">
              <label for="private-deposit">Fianza (€)</label>
              <input id="private-deposit" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(space.deposit ?? 0)}">
            </div>

            <div class="form-field form-field-full">
              <label class="checkbox-field">
                <input id="private-cleaning" type="checkbox" ${space.cleaning_available ? 'checked' : ''}>
                <span>Ofrecer servicio de limpieza</span>
              </label>
            </div>

            <div class="form-field form-field-full">
              <label for="private-conditions">Condiciones</label>
              <textarea id="private-conditions" rows="5" maxlength="5000">${esc(space.conditions_text || '')}</textarea>
            </div>
          </div>

          <div id="private-space-message" class="notice" hidden aria-live="polite"></div>

          <div class="private-modal-actions">
            <button class="button button-primary" type="submit">Guardar cambios</button>
            <button class="button button-secondary" type="button" data-close-modal>Cancelar</button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(modal);

    modal.querySelectorAll('[data-close-modal]').forEach(button => {
      button.addEventListener('click', () => modal.remove());
    });

    modal.querySelector('#private-space-form').addEventListener('submit', async event => {
      event.preventDefault();

      const submit = modal.querySelector('button[type="submit"]');
      const message = modal.querySelector('#private-space-message');

      submit.disabled = true;
      setMessage(message, 'Guardando cambios…');

      const num = id => {
        const value = Number(modal.querySelector(id)?.value ?? 0);
        return Number.isFinite(value) && value >= 0 ? value : 0;
      };

      try {
        const pricingResult = await sb.rpc('owner_update_space_pricing', {
          p_space_id: space.id,
          p_monday_price: num('#private-monday'),
          p_tuesday_price: num('#private-tuesday'),
          p_wednesday_price: num('#private-wednesday'),
          p_thursday_price: num('#private-thursday'),
          p_friday_price: num('#private-friday'),
          p_saturday_price: num('#private-saturday'),
          p_sunday_price: num('#private-sunday'),
          p_holiday_price: num('#private-holiday'),
          p_holiday_eve_price: num('#private-holiday-eve')
        });

        if (pricingResult.error) throw pricingResult.error;

        const operationalResult = await sb.rpc('owner_update_space', {
          p_space_id: space.id,
          p_weekday_price: num('#private-monday'),
          p_friday_price: num('#private-friday'),
          p_saturday_price: num('#private-saturday'),
          p_sunday_price: num('#private-sunday'),
          p_opening_time: modal.querySelector('#private-opening').value || '11:00',
          p_closing_time: modal.querySelector('#private-closing').value || '23:00',
          p_cleaning_available: modal.querySelector('#private-cleaning').checked,
          p_cleaning_price: num('#private-cleaning-price'),
          p_deposit: num('#private-deposit'),
          p_conditions: modal.querySelector('#private-conditions').value.trim() || null
        });

        if (operationalResult.error) throw operationalResult.error;

        setMessage(message, 'Cambios guardados correctamente.', 'success');
        setTimeout(() => modal.remove(), 500);
      } catch (error) {
        console.error('Error actualizando espacio:', error);
        setMessage(message, error?.message || 'No se han podido guardar los cambios.', 'error');
        submit.disabled = false;
      }
    });
  }

  async function initPrivateArea() {
    const root = document.querySelector('#private-area');
    if (!root) return;

    const sb = client();
    const message = root.querySelector('#private-area-message');
    if (!sb) {
      setMessage(message, 'No se ha podido inicializar la conexión con Supabase.', 'error');
      return;
    }

    try {
      const state = await resolvePrivateDestination(sb);
      if (state.destination === 'acceso.html') {
        window.location.replace('acceso.html');
        return;
      }
      if (state.destination === 'admin.html') {
        window.location.replace('admin.html');
        return;
      }

      const [spacesResult, bookingsResult] = await Promise.all([
        sb.rpc('get_owner_spaces'),
        sb.rpc('get_owner_bookings')
      ]);

      if (spacesResult.error) throw spacesResult.error;
      if (bookingsResult.error) throw bookingsResult.error;

      const spaces = spacesResult.data || [];
      const bookings = bookingsResult.data || [];
      root.querySelector('#private-name').textContent = state.profile.email || state.user.email || 'propietario';
      root.querySelector('#private-loading')?.remove();
      root.querySelector('#private-content').hidden = false;

      renderStats(root, bookings);
      renderSpaces(root, spaces);
      renderBookings(root, bookings);

      root.querySelectorAll('[data-edit-space]').forEach(button => {
        button.addEventListener('click', async () => {
          const space = spaces.find(item => String(item.id) === String(button.dataset.editSpace));
          if (!space) return;

          button.disabled = true;

          try {
            const [detail, pricing] = await Promise.all([
              sb.rpc('get_owner_space_detail', { p_space_id: space.id }),
              sb.rpc('owner_get_space_pricing', { p_space_id: space.id })
            ]);

            if (detail.error || !detail.data?.[0]) {
              throw detail.error || new Error('No se ha podido cargar el espacio.');
            }

            if (pricing.error) {
              throw pricing.error;
            }

            openSpaceEditor(
              root,
              sb,
              { ...space, ...detail.data[0] },
              pricing.data?.[0] || {}
            );
          } catch (error) {
            console.error('Error cargando configuración del espacio:', error);
            setMessage(message, error?.message || 'No se ha podido cargar la configuración del espacio.', 'error');
          } finally {
            button.disabled = false;
          }
        });
      });

      root.querySelectorAll('[data-toggle-space]').forEach(button => {
        button.addEventListener('click', async () => {
          const space = spaces.find(item => String(item.id) === String(button.dataset.toggleSpace));
          if (!space) return;
          button.disabled = true;
          try {
            const result = await sb.rpc('owner_set_space_active', {
              p_space_id: space.id,
              p_active: button.dataset.nextActive === 'true'
            });
            if (result.error) throw result.error;
            window.location.reload();
          } catch (error) {
            console.error('Error cambiando estado del espacio:', error);
            setMessage(message, error?.message || 'No se ha podido cambiar el estado del espacio.', 'error');
            button.disabled = false;
          }
        });
      });

      root.querySelector('#private-logout')?.addEventListener('click', async () => {
        const button = root.querySelector('#private-logout');
        button.disabled = true;
        await sb.auth.signOut();
        window.location.replace('acceso.html');
      });
    } catch (error) {
      console.error('Error cargando área privada:', error);
      await sb.auth.signOut().catch(() => {});
      window.location.replace(`acceso.html?error=${encodeURIComponent('No se ha podido validar el acceso privado.')}`);
    }
  }

  async function initPrivatePage() {
    const page = document.body?.dataset.page || '';
    if (page === 'private-login') await initLoginPage();
    if (page === 'private-area') await initPrivateArea();
  }

  /*
   * No dependemos exclusivamente de app.js para arrancar el área privada.
   * Si otra parte del frontend falla, el control de acceso debe seguir
   * funcionando y nunca dejar la pantalla indefinidamente en
   * “Comprobando acceso…”.
   */
  window.initPrivatePage = initPrivatePage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initPrivatePage().catch(error => {
        console.error('Error inicializando el área privada:', error);
      });
    }, { once: true });
  } else {
    initPrivatePage().catch(error => {
      console.error('Error inicializando el área privada:', error);
    });
  }
})();
