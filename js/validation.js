/**
 * @license
 * Fruit Valley Patagonia - Form Validation Module
 * Validaciones accesibles y amigables para formularios con Bootstrap 5.
 */

export const Validation = {
  /**
   * Inicializa la validación para todos los formularios con la clase .needs-validation
   */
  init() {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
          // Enfocar primer campo inválido
          const firstInvalid = form.querySelector(':invalid');
          if (firstInvalid) firstInvalid.focus();
        }
        form.classList.add('was-validated');
      }, false);
    });
  },

  /**
   * Configura un formulario específico con validación y callback de envío
   */
  bindForm(formId, submitCallback) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Validación de coincidencia de contraseñas si existen los campos
      const pass = form.querySelector('#reg-password');
      const passConfirm = form.querySelector('#reg-password-confirm');
      if (pass && passConfirm) {
        if (pass.value !== passConfirm.value) {
          passConfirm.setCustomValidity("Las contraseñas no coinciden");
        } else {
          passConfirm.setCustomValidity("");
        }
      }

      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      form.classList.add('was-validated');

      // Botón submit con spinner
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Procesando...
        `;
      }

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        await submitCallback(data, form);
      } catch (err) {
        console.error("Error al procesar formulario:", err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }
      }
    });
  },

  /**
   * Muestra un mensaje de alerta en un contenedor
   */
  showAlert(containerId, message, type = 'success') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
    container.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2" role="alert">
        <i class="bi ${icon} fs-5"></i>
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>
    `;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};
