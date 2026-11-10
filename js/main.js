
/**
 * @license
 * Fruit Valley Patagonia - Main Application Script
 * Control de navegación, carrito de compras interactivo,
 * notificaciones y utilidades globales.
 */

import { API } from './api.js';
import { Auth } from './auth.js';
import { Search } from './search.js';
import { Validation } from './validation.js';

const CART_STORAGE_KEY = "fvp_cart";

export const App = {
  cart: [],
  appliedCoupon: null,

  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================
  init() {
    this.loadCart();
    this.setupNavbar();
    this.createOffcanvasCartDOM();
    this.createToastContainerDOM();
    this.bindGlobalEvents();
    this.renderCartUI();

    Auth.renderNavUser();
    Search.init();
    Validation.init();

    // Actualizar imágenes de productos destacados
    this.syncHomeFeaturedImages();
  },

  // ========================================================================
  // SINCRONIZAR IMÁGENES DE PRODUCTOS DESTACADOS
  // ========================================================================
  async syncHomeFeaturedImages() {
    const container = document.getElementById('home-featured-products');
    if (!container) return;

    try {
      const products = await API.getProducts('all', '');

      const matchers = {
        'harina-durazno': p =>
          /durazno/i.test(p.name) && /harina/i.test(p.name),

        'barritas-frutas': p =>
          /barrita/i.test(p.name),

        'chips-manzana': p =>
          /manzana/i.test(p.name) && /chip/i.test(p.name),

        'granolas-fruta-deshidratada': p =>
          /granola/i.test(p.name),

        'harina-pera': p =>
          /pera/i.test(p.name) && /harina/i.test(p.name),

        'mermelada-pasta-fruta': p =>
          /mermelada/i.test(p.name)
      };

      container.querySelectorAll('.btn-add-to-cart').forEach(button => {
        const id = button.dataset.productId;
        const matcher = matchers[id];

        if (!matcher) return;

        const product = products.find(matcher);

        const card = button.closest('.fvp-card');
        const image = card?.querySelector(
          '.fvp-card-img, .fvp-card-img-wrapper img, img'
        );

        if (product?.image && image) {
          image.src = product.image;
          image.onerror = () => {
            console.warn(
              'No se pudo cargar la imagen de:',
              product.name
            );
          };
        }
      });

    } catch (error) {
      console.error(
        'Error actualizando imágenes destacadas:',
        error
      );
    }
  },

  // ========================================================================
  // CARRITO DE COMPRAS
  // ========================================================================
  loadCart() {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      this.cart = data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Error cargando el carrito:', error);
      this.cart = [];
    }
  },

  saveCart() {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(this.cart)
    );
    this.renderCartUI();
  },

  addToCart(product, quantity = 1) {
    if (!product || !product.id) return;

    const existingIndex = this.cart.findIndex(
      item => item.id === product.id
    );

    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit || product.netWeight || 'Unidad',
        quantity: quantity
      });
    }

    this.saveCart();

    this.showToast(
      '¡Producto Agregado!',
      `Se agregó <strong>${product.name}</strong> (${quantity} un.) al carrito.`,
      'success'
    );

    this.openCart();
  },

  updateQuantity(productId, delta) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.saveCart();
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(
      i => i.id !== productId
    );

    this.saveCart();

    this.showToast(
      'Carrito Actualizado',
      'Producto removido del pedido.',
      'info'
    );
  },

  clearCart() {
    this.cart = [];
    this.appliedCoupon = null;
    this.saveCart();
  },

  getCartSubtotal() {
    return this.cart.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
  },

  getCartTotal() {
    const subtotal = this.getCartSubtotal();

    if (this.appliedCoupon && this.appliedCoupon.discount) {
      return Math.round(
        subtotal * (1 - this.appliedCoupon.discount)
      );
    }

    return subtotal;
  },

  getCartCount() {
    return this.cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  },

  applyCoupon(code) {
    const cleanCode = (code || '').trim().toUpperCase();

    if (cleanCode === 'PATAGONIA10') {
      this.appliedCoupon = {
        code: 'PATAGONIA10',
        discount: 0.10,
        label: '10% OFF Patagonia'
      };

      this.saveCart();

      this.showToast(
        'Cupón Aplicado',
        '¡Se ha aplicado un 10% de descuento a tu compra!',
        'success'
      );

      return true;
    }

    this.showToast(
      'Cupón Inválido',
      'El código ingresado no existe o ha expirado.',
      'warning'
    );

    return false;
  },

  openCart() {
    const offcanvasEl = document.getElementById('offcanvasCart');

    if (offcanvasEl && window.bootstrap) {
      const bsOffcanvas =
        window.bootstrap.Offcanvas.getInstance(offcanvasEl) ||
        new window.bootstrap.Offcanvas(offcanvasEl);

      bsOffcanvas.show();
    }
  },

  // ========================================================================
  // CREAR ESTRUCTURA DEL CARRITO
  // ========================================================================
  createOffcanvasCartDOM() {
    if (document.getElementById('offcanvasCart')) return;

    const html = `
      <div class="offcanvas offcanvas-end fvp-offcanvas-cart shadow-lg"
        tabindex="-1"
        id="offcanvasCart"
        aria-labelledby="offcanvasCartLabel">

        <div class="offcanvas-header border-bottom py-3">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-bag-heart-fill fs-4 text-success"></i>
            <h5 class="offcanvas-title font-serif fw-bold mb-0 text-dark"
              id="offcanvasCartLabel">
              Mi Canasta Patagónica
            </h5>
          </div>

          <button type="button"
            class="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Cerrar">
          </button>
        </div>

        <div class="offcanvas-body d-flex flex-column p-4 overflow-y-auto"
          id="cart-drawer-content">
        </div>

        <div class="p-4 border-top bg-light"
          id="cart-drawer-footer">
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  },

  // ========================================================================
  // ACTUALIZAR INTERFAZ DEL CARRITO
  // ========================================================================
  renderCartUI() {
    const count = this.getCartCount();

    document.querySelectorAll('.cart-count-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });

    const bodyContainer =
      document.getElementById('cart-drawer-content');

    const footerContainer =
      document.getElementById('cart-drawer-footer');

    if (!bodyContainer || !footerContainer) return;

    if (this.cart.length === 0) {
      bodyContainer.innerHTML = `
        <div class="text-center my-auto py-5">
          <div class="mb-3 text-muted">
            <i class="bi bi-basket3 fs-1 text-secondary opacity-75"></i>
          </div>

          <h5 class="fw-bold font-serif text-dark">
            Tu canasta está vacía
          </h5>

          <p class="text-muted small mb-4">
            Descubre nuestras harinas puras de fruta,
            chips crocantes y delicias de la Patagonia.
          </p>

          <a href="servicios.html"
            class="btn btn-patagonia w-100"
            data-bs-dismiss="offcanvas">
            <i class="bi bi-grid me-2"></i>
            Explorar Catálogo
          </a>
        </div>
      `;

      footerContainer.innerHTML = `
        <div class="text-center text-muted small py-2">
          <i class="bi bi-shield-check me-1 text-success"></i>
          Envío seguro a todo el país
        </div>
      `;

      return;
    }

    let itemsHTML = `<div class="cart-items-list mb-3">`;

    this.cart.forEach(item => {
      const itemSubtotal = item.price * item.quantity;

      itemsHTML += `
        <div class="fvp-cart-item">
          <img
            src="${item.image || './assets/icons/favicon.svg'}"
            alt="${item.name}"
            class="fvp-cart-item-img"
            onerror="this.onerror=null;this.src='./assets/icons/favicon.svg'">

          <div class="flex-grow-1 min-w-0">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <h6 class="mb-0 fw-bold text-dark text-truncate pe-2"
                style="font-size: 0.95rem;">
                ${item.name}
              </h6>

              <button
                class="btn btn-sm text-danger p-0 border-0 btn-remove-item"
                data-id="${item.id}"
                title="Quitar">
                <i class="bi bi-trash3"></i>
              </button>
            </div>

            <div class="text-muted small mb-2">
              ${item.unit} · $${item.price.toLocaleString('es-AR')} c/u
            </div>

            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2">
                <button
                  class="fvp-cart-qty-btn btn-qty-minus"
                  data-id="${item.id}">-</button>

                <span class="fw-bold px-1 font-mono text-dark"
                  style="min-width: 20px; text-align: center;">
                  ${item.quantity}
                </span>

                <button
                  class="fvp-cart-qty-btn btn-qty-plus"
                  data-id="${item.id}">+</button>
              </div>

              <span class="fw-bold font-mono text-success">
                $${itemSubtotal.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      `;
    });

    itemsHTML += `</div>`;

    const couponHTML = `
      <div class="mb-3">
        <label class="form-label small fw-semibold text-muted mb-1">
          ¿Tienes un cupón de descuento?
        </label>

        <div class="input-group input-group-sm">
          <input
            type="text"
            id="cart-coupon-input"
            class="form-control"
            placeholder="Ej: PATAGONIA10"
            value="${this.appliedCoupon ? this.appliedCoupon.code : ''}"
            ${this.appliedCoupon ? 'disabled' : ''}>

          <button
            class="btn ${this.appliedCoupon ? 'btn-outline-danger' : 'btn-outline-success'}"
            type="button"
            id="btn-apply-coupon">
            ${this.appliedCoupon ? 'Quitar' : 'Aplicar'}
          </button>
        </div>

        ${this.appliedCoupon ? `
          <div class="small text-success mt-1 fw-semibold">
            <i class="bi bi-tag-fill me-1"></i>
            ${this.appliedCoupon.label}
          </div>
        ` : ''}
      </div>
    `;

    bodyContainer.innerHTML = itemsHTML + couponHTML;

    const subtotal = this.getCartSubtotal();
    const total = this.getCartTotal();
    const discount = subtotal - total;

    footerContainer.innerHTML = `
      <div class="d-flex justify-content-between mb-1 text-muted small">
        <span>Subtotal</span>
        <span class="font-mono">
          $${subtotal.toLocaleString('es-AR')}
        </span>
      </div>

      ${discount > 0 ? `
        <div class="d-flex justify-content-between mb-1 text-success small fw-semibold">
          <span>Descuento aplicado</span>
          <span class="font-mono">
            -$${discount.toLocaleString('es-AR')}
          </span>
        </div>
      ` : ''}

      <div class="d-flex justify-content-between mb-3 text-dark fw-bold fs-5 border-top pt-2">
        <span>Total Estimado</span>
        <span class="font-mono text-success">
          $${total.toLocaleString('es-AR')}
        </span>
      </div>

      <div class="d-grid gap-2">
        <button
          class="btn btn-patagonia-accent btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
          id="btn-checkout-whatsapp">

          <i class="bi bi-whatsapp fs-5"></i>
          <span>Pedir por WhatsApp</span>
        </button>

        <a href="contacto.html?source=cart"
          class="btn btn-outline-secondary btn-sm w-100 text-center">
          <i class="bi bi-envelope me-1"></i>
          Solicitar Cotización Mayorista
        </a>
      </div>

      <div class="text-center mt-2">
        <small class="text-muted" style="font-size: 0.75rem;">
          <i class="bi bi-truck me-1"></i>
          Envíos directos desde el Alto Valle de Río Negro
        </small>
      </div>
    `;

    bodyContainer.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateQuantity(btn.dataset.id, -1);
      });
    });

    bodyContainer.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateQuantity(btn.dataset.id, 1);
      });
    });

    bodyContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeFromCart(btn.dataset.id);
      });
    });

    const couponBtn = document.getElementById('btn-apply-coupon');
    const couponInput = document.getElementById('cart-coupon-input');

    couponBtn?.addEventListener('click', () => {
      if (this.appliedCoupon) {
        this.appliedCoupon = null;
        this.saveCart();

        this.showToast(
          'Cupón Removido',
          'Se ha quitado el cupón de descuento.',
          'info'
        );
      } else if (couponInput && couponInput.value.trim()) {
        this.applyCoupon(couponInput.value);
      }
    });

    document.getElementById('btn-checkout-whatsapp')
      ?.addEventListener('click', () => {
        this.checkoutWhatsApp();
      });
  },

  // ========================================================================
  // FINALIZAR COMPRA POR WHATSAPP
  // ========================================================================
  checkoutWhatsApp() {
    const settings = API.getSettings();

    const phone = (
      settings.whatsappNumber || '+5492984926445'
    ).replace(/[^0-9]/g, '');

    if (this.cart.length === 0) {
      this.showToast(
        'Canasta vacía',
        'Agrega al menos un producto para pedir por WhatsApp.',
        'warning'
      );
      return;
    }

    let message =
      `¡Hola Fruit Valley Patagonia! Deseo realizar el siguiente pedido:\n\n`;

    this.cart.forEach((item, index) => {
      message +=
        `${index + 1}. *${item.name}* (${item.unit})\n` +
        `   Cantidad: ${item.quantity} | ` +
        `Subtotal: $${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
    });

    const total = this.getCartTotal();

    message +=
      `\n*Total Estimado:* $${total.toLocaleString('es-AR')} ARS`;

    if (this.appliedCoupon) {
      message +=
        ` (incluye descuento código ${this.appliedCoupon.code})`;
    }

    const user = Auth.getCurrentUser();

    if (user) {
      message +=
        `\n\n*Datos del Comprador:* ${user.name} ` +
        `(${user.email} - Tel: ${user.phone || 'No especificado'})`;
    }

    message +=
      `\n\n¿Me confirman disponibilidad y datos para el envío? ¡Muchas gracias!`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${phone}?text=${encoded}`;

    window.open(waUrl, '_blank');
  },

  // ========================================================================
  // NOTIFICACIONES TOAST
  // ========================================================================
  createToastContainerDOM() {
    if (document.getElementById('toast-container')) return;

    const container = `
      <div class="toast-container position-fixed bottom-0 end-0 p-3"
        id="toast-container">
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', container);
  },

  showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const id = 'toast-' + Date.now();

    const icon =
      type === 'success'
        ? 'bi-check-circle-fill text-success'
        : type === 'warning'
          ? 'bi-exclamation-triangle-fill text-warning'
          : 'bi-info-circle-fill text-primary';

    const toastHTML = `
      <div
        id="${id}"
        class="toast align-items-center shadow-lg border-0 mb-2 rounded-3"
        role="alert"
        aria-live="assertive"
        aria-atomic="true">

        <div class="toast-header bg-white border-bottom-0 pb-1">
          <i class="bi ${icon} me-2 fs-6"></i>
          <strong class="me-auto font-serif text-dark">${title}</strong>
          <small class="text-muted">ahora</small>

          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="toast"
            aria-label="Cerrar">
          </button>
        </div>

        <div class="toast-body pt-0 small text-muted">
          ${message}
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);

    const toastEl = document.getElementById(id);

    if (toastEl && window.bootstrap) {
      const bsToast = new window.bootstrap.Toast(
        toastEl,
        { delay: 3500 }
      );

      bsToast.show();

      toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
      });
    }
  },

  // ========================================================================
  // BARRA DE NAVEGACIÓN
  // ========================================================================
  setupNavbar() {
    const navbar = document.querySelector('.fvp-navbar');

    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      });
    }

    const currentPath =
      window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.fvp-nav-link').forEach(link => {
      const href = link.getAttribute('href');

      if (
        href === currentPath ||
        (currentPath === '' && href === 'index.html')
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  // ========================================================================
  // EVENTOS GLOBALES
  // ========================================================================
  bindGlobalEvents() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-add-to-cart');

      if (btn) {
        e.preventDefault();

        const prodId = btn.getAttribute('data-product-id');

        const qty = parseInt(
          btn.getAttribute('data-qty') || '1',
          10
        );

        if (prodId) {
          const product = await API.getProductById(prodId);

          if (product) {
            this.addToCart(product, qty);
          }
        }
      }

      const cartToggle = e.target.closest('.cart-toggle-btn');

      if (cartToggle) {
        e.preventDefault();
        this.openCart();
      }
    });
  }
};

// ========================================================================
// INICIAR APLICACIÓN CUANDO CARGA EL DOCUMENTO
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
