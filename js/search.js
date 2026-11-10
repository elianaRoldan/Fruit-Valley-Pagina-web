/**
 * @license
 * Fruit Valley Patagonia - Live Search Module
 * Buscador instantáneo con modal emergente y resaltado dinámico.
 */

import { API } from './api.js';

export const Search = {
  modalInstance: null,

  init() {
    this.createSearchModalDOM();
    this.bindEvents();
  },

  createSearchModalDOM() {
    if (document.getElementById('searchModal')) return;

    const modalHTML = `
      <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content shadow-lg border-0 rounded-4">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title font-serif" id="searchModalLabel">
                <i class="bi bi-search me-2 text-success"></i>Buscar en Fruit Valley
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body p-4">
              <div class="input-group mb-3">
                <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                <input type="text" id="global-search-input" class="form-control form-control-lg border-start-0 ps-0" placeholder="Escribe harina, manzana, chips, sin gluten, recetas..." autocomplete="off">
              </div>

              <!-- Categorías rápidas -->
              <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="text-muted small align-self-center me-1">Sugerencias:</span>
                <button type="button" class="btn btn-sm btn-outline-secondary quick-tag-btn" data-tag="harina">Harinas</button>
                <button type="button" class="btn btn-sm btn-outline-secondary quick-tag-btn" data-tag="chips">Chips</button>
                <button type="button" class="btn btn-sm btn-outline-secondary quick-tag-btn" data-tag="granola">Granola</button>
                <button type="button" class="btn btn-sm btn-outline-secondary quick-tag-btn" data-tag="mermelada">Mermelada</button>
                <button type="button" class="btn btn-sm btn-outline-secondary quick-tag-btn" data-tag="barrita">Barritas</button>
              </div>

              <!-- Contenedor de Resultados -->
              <div id="search-results-container" class="mt-3 overflow-auto" style="max-height: 380px;">
                <div class="text-center text-muted py-4">
                  <i class="bi bi-arrow-up-circle fs-3 d-block mb-2 text-secondary"></i>
                  Ingresa una palabra para buscar en nuestro catálogo patagónico.
                </div>
              </div>
            </div>
            <div class="modal-footer border-top bg-light py-2 px-4 rounded-bottom-4 justify-content-between">
              <small class="text-muted"><kbd class="bg-secondary text-white px-1">ESC</kbd> para cerrar</small>
              <a href="servicios.html" class="small text-success text-decoration-none fw-semibold">Ver catálogo completo <i class="bi bi-arrow-right"></i></a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  bindEvents() {
    const triggerButtons = document.querySelectorAll('[data-bs-target="#searchModal"], .btn-search-trigger');
    const input = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('search-results-container');
    const modalEl = document.getElementById('searchModal');

    if (modalEl && window.bootstrap) {
      this.modalInstance = new window.bootstrap.Modal(modalEl);
      modalEl.addEventListener('shown.bs.modal', () => {
        input?.focus();
      });
    }

    // Buscador con debounce
    let timeout = null;
    input?.addEventListener('input', (e) => {
      clearTimeout(timeout);
      const query = e.target.value.trim();
      if (!query) {
        resultsContainer.innerHTML = `
          <div class="text-center text-muted py-4">
            <i class="bi bi-arrow-up-circle fs-3 d-block mb-2 text-secondary"></i>
            Ingresa una palabra para buscar en nuestro catálogo patagónico.
          </div>
        `;
        return;
      }

      timeout = setTimeout(() => {
        this.performSearch(query, resultsContainer);
      }, 180);
    });

    // Botones de sugerencias rápidas
    document.querySelectorAll('.quick-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        if (input) {
          input.value = tag;
          input.dispatchEvent(new Event('input'));
        }
      });
    });
  },

  async performSearch(query, container) {
    container.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-success" role="status"></div>
        <div class="small text-muted mt-2">Buscando productos naturales...</div>
      </div>
    `;

    const products = await API.getProducts('all', query);

    if (products.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-emoji-neutral fs-2 text-muted d-block mb-2"></i>
          <p class="mb-1 fw-semibold text-dark">No encontramos resultados para "${query}"</p>
          <p class="text-muted small">Intenta con términos como "manzana", "harina", "chips", o revisa nuestro <a href="servicios.html" class="text-success">catálogo completo</a>.</p>
        </div>
      `;
      return;
    }

    let html = `<div class="list-group list-group-flush">`;
    products.forEach(p => {
      html += `
        <a href="detalle.html?id=${p.id}" class="list-group-item list-group-item-action d-flex align-items-center gap-3 p-3 border-0 border-bottom rounded-3 mb-1">
          <img src="${p.image}" alt="${p.name}" class="fvp-search-result-img shadow-sm" onerror="this.src='/assets/icons/favicon.svg'">
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between align-items-baseline">
              <h6 class="mb-1 text-dark fw-bold text-truncate">${p.name}</h6>
              <span class="text-success fw-bold font-mono ms-2 text-nowrap">$${p.price.toLocaleString('es-AR')}</span>
            </div>
            <div class="small text-muted text-truncate mb-1">${p.description}</div>
            <span class="badge bg-light text-dark border">${p.categoryName}</span>
            <span class="text-muted small ms-2">${p.netWeight}</span>
          </div>
        </a>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
  }
};
