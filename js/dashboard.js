/**
 * @license
 * Fruit Valley Patagonia - Dashboard & Admin Controller
 * Operaciones CRUD completas para productos, consultas de clientes y configuración de backend.
 */

import { API } from './api.js';
import { Auth } from './auth.js';

export const Dashboard = {
  currentEditId: null,

  async init() {
    // 1. Verificar permisos de Administrador
    if (!Auth.requireAdmin('login.html?redirect=dashboard.html')) {
      return;
    }

    // 2. Cargar vistas
    await this.loadStats();
    await this.loadProductsTable();
    await this.loadInquiriesTable();
    this.loadBackendSettings();
    this.bindEvents();
  },

  // ========================================================================
  // Estadísticas y Métricas
  // ========================================================================
  async loadStats() {
    const products = await API.getProducts('all', '');
    const inquiries = await API.getInquiries();

    const totalStock = products.reduce((acc, p) => acc + (parseInt(p.stock, 10) || 0), 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * (parseInt(p.stock, 10) || 0)), 0);
    const pendingInquiries = inquiries.filter(i => i.status === 'pending').length;

    const elTotalProducts = document.getElementById('stat-total-products');
    const elTotalStock = document.getElementById('stat-total-stock');
    const elInventoryValue = document.getElementById('stat-inventory-val');
    const elPendingInquiries = document.getElementById('stat-pending-inquiries');

    if (elTotalProducts) elTotalProducts.textContent = products.length;
    if (elTotalStock) elTotalStock.textContent = totalStock.toLocaleString('es-AR');
    if (elInventoryValue) elInventoryValue.textContent = '$' + totalInventoryValue.toLocaleString('es-AR');
    if (elPendingInquiries) elPendingInquiries.textContent = pendingInquiries;
  },

  // ========================================================================
  // Tabla de Productos (CRUD)
  // ========================================================================
  async loadProductsTable(searchTerm = '') {
    const tbody = document.getElementById('dashboard-products-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-success me-2"></div>Cargando catálogo...</td></tr>`;

    const products = await API.getProducts('all', searchTerm);

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron productos en el inventario.</td></tr>`;
      return;
    }

    let html = '';
    products.forEach((p, index) => {
      const isLowStock = (p.stock || 0) <= 15;
      html += `
        <tr>
          <td class="text-muted small align-middle">${index + 1}</td>
          <td class="align-middle">
            <div class="d-flex align-items-center gap-2">
              <img src="${p.image}" alt="${p.name}" class="rounded border" style="width: 44px; height: 44px; object-fit: contain; background: #F8F5EE;" onerror="this.src='/assets/icons/favicon.svg'">
              <div>
                <strong class="d-block text-dark">${p.name}</strong>
                <small class="text-muted">${p.unit || p.netWeight}</small>
              </div>
            </div>
          </td>
          <td class="align-middle">
            <span class="badge bg-light text-dark border">${p.categoryName || p.category}</span>
          </td>
          <td class="align-middle font-mono fw-bold text-success text-nowrap">
            $${p.price.toLocaleString('es-AR')}
          </td>
          <td class="align-middle">
            <span class="badge ${isLowStock ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'}">
              ${p.stock} un.
            </span>
          </td>
          <td class="align-middle">
            <span class="small ${p.featured ? 'text-warning fw-bold' : 'text-muted'}">
              ${p.featured ? '<i class="bi bi-star-fill me-1"></i>Destacado' : 'Estándar'}
            </span>
          </td>
          <td class="align-middle text-end text-nowrap">
            <button class="btn btn-sm btn-outline-secondary me-1 btn-edit-product" data-id="${p.id}" title="Editar">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-delete-product" data-id="${p.id}" data-name="${p.name}" title="Eliminar">
              <i class="bi bi-trash3"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    // Escuchar botones de edición y eliminación
    tbody.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => this.openEditModal(btn.dataset.id));
    });
    tbody.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', () => this.confirmDeleteProduct(btn.dataset.id, btn.dataset.name));
    });
  },

  // ========================================================================
  // Modales de Producto (Crear / Editar / Eliminar)
  // ========================================================================
  openCreateModal() {
    this.currentEditId = null;
    const form = document.getElementById('product-form');
    if (form) {
      form.reset();
      form.classList.remove('was-validated');
    }
    document.getElementById('productModalLabel').textContent = "Nuevo Producto Natural";
    document.getElementById('modal-prod-id').value = "";

    const modalEl = document.getElementById('productModal');
    if (modalEl && window.bootstrap) {
      new window.bootstrap.Modal(modalEl).show();
    }
  },

  async openEditModal(productId) {
    this.currentEditId = productId;
    const product = await API.getProductById(productId);
    if (!product) return;

    document.getElementById('productModalLabel').textContent = "Editar Producto: " + product.name;
    document.getElementById('modal-prod-id').value = product.id;
    document.getElementById('modal-prod-name').value = product.name;
    document.getElementById('modal-prod-category').value = product.category;
    document.getElementById('modal-prod-price').value = product.price;
    document.getElementById('modal-prod-stock').value = product.stock || 0;
    document.getElementById('modal-prod-unit').value = product.unit || product.netWeight || "";
    document.getElementById('modal-prod-image').value = product.image || "";
    document.getElementById('modal-prod-badge').value = product.badge || "";
    document.getElementById('modal-prod-desc').value = product.description || "";
    document.getElementById('modal-prod-ingredients').value = product.ingredients || "";
    document.getElementById('modal-prod-featured').checked = !!product.featured;

    const modalEl = document.getElementById('productModal');
    if (modalEl && window.bootstrap) {
      new window.bootstrap.Modal(modalEl).show();
    }
  },

  async saveProductForm(e) {
    e.preventDefault();
    const form = document.getElementById('product-form');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const categorySelect = document.getElementById('modal-prod-category');
    const categoryName = categorySelect.options[categorySelect.selectedIndex].text;

    const productData = {
      id: document.getElementById('modal-prod-id').value || ('prod-' + Date.now()),
      name: document.getElementById('modal-prod-name').value.trim(),
      category: categorySelect.value,
      categoryName: categoryName,
      price: parseInt(document.getElementById('modal-prod-price').value, 10),
      stock: parseInt(document.getElementById('modal-prod-stock').value, 10) || 0,
      unit: document.getElementById('modal-prod-unit').value.trim(),
      netWeight: document.getElementById('modal-prod-unit').value.trim(),
      image: document.getElementById('modal-prod-image').value.trim() || '/assets/aistudio/Todoslosproductos_21bbed5e.jpg',
      badge: document.getElementById('modal-prod-badge').value.trim(),
      description: document.getElementById('modal-prod-desc').value.trim(),
      ingredients: document.getElementById('modal-prod-ingredients').value.trim(),
      featured: document.getElementById('modal-prod-featured').checked,
      nutrition: {
        serving: "Porción de referencia",
        calories: "Consulte envase",
        proteins: "Consulte envase",
        carbs: "Consulte envase",
        fiber: "Consulte envase",
        fat: "Consulte envase"
      }
    };

    await API.saveProduct(productData);

    // Cerrar modal
    const modalEl = document.getElementById('productModal');
    if (modalEl && window.bootstrap) {
      const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }

    await this.loadProductsTable();
    await this.loadStats();
  },

  confirmDeleteProduct(id, name) {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${name}" del catálogo?`)) {
      API.deleteProduct(id).then(() => {
        this.loadProductsTable();
        this.loadStats();
      });
    }
  },

  // ========================================================================
  // Tabla de Consultas de Clientes
  // ========================================================================
  async loadInquiriesTable() {
    const tbody = document.getElementById('dashboard-inquiries-tbody');
    if (!tbody) return;

    const inquiries = await API.getInquiries();

    if (inquiries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Aún no se han recibido consultas desde la web.</td></tr>`;
      return;
    }

    let html = '';
    inquiries.forEach(inq => {
      const formattedDate = new Date(inq.date).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const isPending = inq.status === 'pending';

      html += `
        <tr>
          <td class="small text-muted align-middle">${formattedDate}</td>
          <td class="align-middle">
            <strong class="text-dark d-block">${inq.name}</strong>
            <small class="text-muted">${inq.email}</small>
          </td>
          <td class="align-middle">
            <span class="badge ${inq.type === 'mayorista' ? 'bg-primary' : 'bg-secondary'}">${inq.type ? inq.type.toUpperCase() : 'GENERAL'}</span>
          </td>
          <td class="align-middle">
            <strong class="d-block small text-dark">${inq.subject || 'Sin asunto'}</strong>
            <small class="text-muted text-truncate d-inline-block" style="max-width: 250px;">${inq.message || ''}</small>
          </td>
          <td class="align-middle">
            <span class="badge ${isPending ? 'bg-warning text-dark' : 'bg-success'}">
              ${isPending ? 'Pendiente' : 'Respondida'}
            </span>
          </td>
          <td class="align-middle text-end">
            <a href="mailto:${inq.email}?subject=Respuesta Fruit Valley Patagonia: ${encodeURIComponent(inq.subject || '')}" class="btn btn-sm btn-outline-primary" title="Responder por Email">
              <i class="bi bi-reply-fill"></i>
            </a>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  },

  // ========================================================================
  // Configuración de Backend & Google Sheets
  // ========================================================================
  loadBackendSettings() {
    const settings = API.getSettings();
    const modeLocal = document.getElementById('backend-mode-local');
    const modeAppsScript = document.getElementById('backend-mode-gas');
    const modeFirebase = document.getElementById('backend-mode-firebase');
    const inputUrl = document.getElementById('input-apps-script-url');
    const inputWhatsapp = document.getElementById('input-whatsapp-num');

    if (settings.backendMode === 'google_apps_script' && modeAppsScript) modeAppsScript.checked = true;
    else if (settings.backendMode === 'firebase' && modeFirebase) modeFirebase.checked = true;
    else if (modeLocal) modeLocal.checked = true;

    if (inputUrl) inputUrl.value = settings.appsScriptUrl || '';
    if (inputWhatsapp) inputWhatsapp.value = settings.whatsappNumber || '+5492984926445';
  },

  bindEvents() {
    // Botón crear producto
    document.getElementById('btn-new-product')?.addEventListener('click', () => {
      this.openCreateModal();
    });

    // Guardar formulario de producto
    document.getElementById('product-form')?.addEventListener('submit', (e) => {
      this.saveProductForm(e);
    });

    // Buscador en la tabla de productos
    document.getElementById('table-search-input')?.addEventListener('input', (e) => {
      this.loadProductsTable(e.target.value.trim());
    });

    // Probar conexión Google Apps Script
    document.getElementById('btn-test-connection')?.addEventListener('click', async () => {
      const url = document.getElementById('input-apps-script-url').value.trim();
      const statusBox = document.getElementById('connection-status-box');
      if (!url) {
        statusBox.innerHTML = `<div class="alert alert-warning py-2 mb-0 small">Por favor ingresa primero la URL de tu Web App publicada en Google Apps Script.</div>`;
        return;
      }

      statusBox.innerHTML = `<div class="text-muted small py-1"><span class="spinner-border spinner-border-sm me-2"></span>Conectando con Google Sheets API...</div>`;
      const result = await API.testBackendConnection(url);

      if (result.success) {
        statusBox.innerHTML = `<div class="alert alert-success py-2 mb-0 small"><i class="bi bi-check-circle-fill me-1"></i>${result.message}</div>`;
      } else {
        statusBox.innerHTML = `<div class="alert alert-danger py-2 mb-0 small"><i class="bi bi-exclamation-triangle-fill me-1"></i>${result.message}</div>`;
      }
    });

    // Crear / Sincronizar las 6 Hojas en el mismo documento de Google Sheets
    document.getElementById('btn-setup-sheets')?.addEventListener('click', async () => {
      const url = document.getElementById('input-apps-script-url').value.trim();
      const statusBox = document.getElementById('connection-status-box');
      if (!url) {
        statusBox.innerHTML = `<div class="alert alert-warning py-2 mb-0 small">Por favor ingresa primero la URL de tu Web App publicada en Google Apps Script.</div>`;
        return;
      }

      statusBox.innerHTML = `<div class="text-muted small py-1"><span class="spinner-border spinner-border-sm me-2"></span>Creando y formateando las 6 hojas en Google Sheets (Productos, Usuarios, Consultas, Categorias, Configuracion, Administradores)...</div>`;
      const result = await API.setupGoogleSheets(url);

      if (result.success) {
        statusBox.innerHTML = `<div class="alert alert-success py-2 mb-0 small"><i class="bi bi-check-circle-fill me-1"></i><strong>¡Hojas creadas con éxito!</strong> ${result.message}</div>`;
      } else {
        statusBox.innerHTML = `<div class="alert alert-danger py-2 mb-0 small"><i class="bi bi-exclamation-triangle-fill me-1"></i>${result.message}</div>`;
      }
    });

    // Guardar configuraciones de backend
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      let selectedMode = 'local';
      if (document.getElementById('backend-mode-gas')?.checked) selectedMode = 'google_apps_script';
      if (document.getElementById('backend-mode-firebase')?.checked) selectedMode = 'firebase';

      const url = document.getElementById('input-apps-script-url')?.value.trim() || '';
      const whatsapp = document.getElementById('input-whatsapp-num')?.value.trim() || '+5492984926445';

      API.saveSettings({
        backendMode: selectedMode,
        appsScriptUrl: url,
        whatsappNumber: whatsapp
      });

      alert("Configuración de backend y sincronización guardada con éxito.");
    });

    // Restablecer catálogo original
    document.getElementById('btn-reset-catalog')?.addEventListener('click', () => {
      if (confirm("¿Deseas restablecer el catálogo a los 13 productos patagónicos de fábrica? Los productos personalizados se borrarán.")) {
        API.resetCatalogToDefault();
        this.loadProductsTable();
        this.loadStats();
        alert("Catálogo restablecido correctamente.");
      }
    });

    // Exportar JSON
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      const data = API.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fruit_valley_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
};

// Iniciar al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});
