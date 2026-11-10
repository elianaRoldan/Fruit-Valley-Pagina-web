/**
 * @license
 * Fruit Valley Patagonia - API Service Facade
 * Centraliza la persistencia e integraciones con LocalStorage, Google Apps Script / Sheets y Firebase.
 */

/**
 * Mapea nombres de archivos de imagen de la hoja de cálculo a los assets del proyecto
 */
export function resolveProductImage(imgName) {
  const fallback = '/assets/aistudio/Todoslosproductos.jpg';
  if (!imgName) return fallback;
  const raw = String(imgName).trim();
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  // Acepta rutas antiguas, rutas de public/ y nombres de archivo provenientes de Sheets.
  const clean = decodeURIComponent(raw.replace(/\\/g, '/').split('/').pop()).trim();
  const files = {
    'Empaque_r_stico_de_harina_de_manzana_Patagonia_cc768b53.png': 'Empaque_r_stico_de_harina_de_manzana_Patagonia_cc768b53.png',
    'Empaque_rustico_de_harina_de_manzana_Patagonia.png': 'Empaque_r_stico_de_harina_de_manzana_Patagonia_cc768b53.png',
    'Empaque rústico de harina de manzana Patagonia.png': 'Empaque_r_stico_de_harina_de_manzana_Patagonia_cc768b53.png',
    'Mockup_de_Harina_de_Pera_Patag_nica_34e1eaa3.png': 'Mockup_de_Harina_de_Pera_Patag_nica_34e1eaa3.png',
    'Mockup de Harina de Pera Patagónica.png': 'Mockup_de_Harina_de_Pera_Patag_nica_34e1eaa3.png',
    'Empaque_de_Harina_de_Durazno_Patag_nica_18aca7c3.png': 'Empaque_de_Harina_de_Durazno_Patag_nica_18aca7c3.png',
    'Empaque de Harina de Durazno Patagónica.png': 'Empaque_de_Harina_de_Durazno_Patag_nica_18aca7c3.png',
    'MixdeHarina_95112a5b.jpg': 'MixdeHarina_95112a5b.jpg', 'MixdeHarina.jpg': 'MixdeHarina_95112a5b.jpg',
    'Chipsdemanzana_0640116c.jpg': 'Chipsdemanzana_0640116c.jpg', 'Chipsdemanzana.jpg': 'Chipsdemanzana_0640116c.jpg',
    'Chipsdepera_0abe10cb.jpg': 'Chipsdepera_0abe10cb.jpg', 'Chipsdepera.jpg': 'Chipsdepera_0abe10cb.jpg',
    'Granolas_4453523a.jpg': 'Granolas_4453523a.jpg', 'Granolas.jpg': 'Granolas_4453523a.jpg',
    'Chipsmixtos_8f6c471d.jpg': 'Chipsmixtos_8f6c471d.jpg', 'Chipsmixtos.jpg': 'Chipsmixtos_8f6c471d.jpg',
    'Barritas_e2419f8e.jpg': 'Barritas_e2419f8e.jpg', 'Barritas.jpg': 'Barritas_e2419f8e.jpg',
    'PolvodeFrutaparabatidos_251e8f5e.jpg': 'PolvodeFrutaparabatidos_251e8f5e.jpg', 'PolvodeFrutaparabatidos.jpg': 'PolvodeFrutaparabatidos_251e8f5e.jpg',
    'Mermelada_9c46b3d7.jpg': 'Mermelada_9c46b3d7.jpg', 'Mermelada.jpg': 'Mermelada_9c46b3d7.jpg',
    'Todoslosproductos_21bbed5e.jpg': 'Todoslosproductos_21bbed5e.jpg'
  };
  const exact = files[clean];
  if (exact) return `/assets/aistudio/${exact}`;
  const lower = clean.toLowerCase();
  if (lower.includes('manzana') && lower.includes('harina')) return '/assets/aistudio/Empaque_r_stico_de_harina_de_manzana_Patagonia_cc768b53.png';
  if (lower.includes('pera') && lower.includes('harina')) return '/assets/aistudio/Mockup_de_Harina_de_Pera_Patag_nica_34e1eaa3.png';
  if (lower.includes('durazno') && lower.includes('harina')) return '/assets/aistudio/Empaque_de_Harina_de_Durazno_Patag_nica_18aca7c3.png';
  if (lower.includes('mix') && lower.includes('harina')) return '/assets/aistudio/MixdeHarina_95112a5b.jpg';
  if (lower.includes('manzana') && (lower.includes('chip') || lower.includes('deshidrat'))) return '/assets/aistudio/Chipsdemanzana_0640116c.jpg';
  if (lower.includes('pera') && (lower.includes('chip') || lower.includes('rodaja') || lower.includes('deshidrat'))) return '/assets/aistudio/Chipsdepera_0abe10cb.jpg';
  if (lower.includes('granola')) return '/assets/aistudio/Granolas_4453523a.jpg';
  if (lower.includes('mix') && lower.includes('fruta')) return '/assets/aistudio/Chipsmixtos_8f6c471d.jpg';
  if (lower.includes('barrita')) return '/assets/aistudio/Barritas_e2419f8e.jpg';
  if (lower.includes('polvo')) return '/assets/aistudio/PolvodeFrutaparabatidos_251e8f5e.jpg';
  if (lower.includes('mermelada')) return '/assets/aistudio/Mermelada_9c46b3d7.jpg';
  return fallback;
}

// Catálogo oficial sincronizado con la hoja de cálculo de Google Sheets
const INITIAL_PRODUCTS = [
  {
    id: "harina-manzana",
    name: "Harina de manzana",
    category: "harinas",
    categoryName: "Harinas de Fruta",
    price: 11500,
    unit: "500g",
    netWeight: "500g",
    image: resolveProductImage("Empaque rústico de harina de manzana Patagonia.png"),
    description: "500g. Harina fina de sabor suave y dulzor natural. Sirve para panificados, galletitas y mezclas sin gluten.",
    ingredients: "100% manzana deshidratada y molida finamente.",
    nutrition: {
      serving: "30 g",
      calories: "92 kcal",
      proteins: "1.0 g",
      carbs: "21 g",
      fiber: "4.8 g",
      fat: "0.2 g"
    },
    badge: "100% Pura",
    stock: 1,
    featured: true
  },
  {
    id: "harina-pera",
    name: "Harina de pera",
    category: "harinas",
    categoryName: "Harinas de Fruta",
    price: 12000,
    unit: "500g",
    netWeight: "500g",
    image: resolveProductImage("Mockup de Harina de Pera Patagónica.png"),
    description: "500g. De sabor delicado y color claro. Va bien en pastelería, papillas y preparaciones infantiles.",
    ingredients: "100% pera Williams deshidratada y micronizada.",
    nutrition: {
      serving: "30 g",
      calories: "95 kcal",
      proteins: "1.2 g",
      carbs: "23 g",
      fiber: "5.1 g",
      fat: "0.1 g"
    },
    badge: "Delicado",
    stock: 1,
    featured: true
  },
  {
    id: "harina-durazno",
    name: "Harina de durazno",
    category: "harinas",
    categoryName: "Harinas de Fruta",
    price: 12000,
    unit: "500g",
    netWeight: "500g",
    image: resolveProductImage("Empaque de Harina de Durazno Patagónica.png"),
    description: "500g. Aromática y de sabor intenso. Se usa en repostería, batidos y granolas.",
    ingredients: "100% duraznos patagónicos seleccionados sin conservantes.",
    nutrition: {
      serving: "30 g",
      calories: "98 kcal",
      proteins: "1.8 g",
      carbs: "22 g",
      fiber: "4.2 g",
      fat: "0.2 g"
    },
    badge: "Sin Gluten",
    stock: 1,
    featured: true
  },
  {
    id: "mix-harinas-frutas",
    name: "Mix de harinas de frutas",
    category: "harinas",
    categoryName: "Harinas de Fruta",
    price: 12500,
    unit: "500g",
    netWeight: "500g",
    image: resolveProductImage("MixdeHarina.jpg"),
    description: "500g. Combinación de las tres frutas, lista para preparar panqueques, muffins y budines.",
    ingredients: "Harina de manzana, harina de pera y harina de durazno en partes iguales.",
    nutrition: {
      serving: "30 g",
      calories: "96 kcal",
      proteins: "1.4 g",
      carbs: "22 g",
      fiber: "4.7 g",
      fat: "0.2 g"
    },
    badge: "Trilogía",
    stock: 1,
    featured: true
  },
  {
    id: "chips-manzana",
    name: "Chips de manzana",
    category: "chips-deshidratadas",
    categoryName: "Chips & Deshidratados",
    price: 8500,
    unit: "150g",
    netWeight: "150g",
    image: resolveProductImage("Chipsdemanzana.jpg"),
    description: "150g. Rodajas finas y crocantes, sin azúcar añadida. Son el snack más fácil de consumir en el día a día.",
    ingredients: "100% manzana natural en rodajas crocantes.",
    nutrition: {
      serving: "25 g",
      calories: "85 kcal",
      proteins: "0.8 g",
      carbs: "20 g",
      fiber: "3.2 g",
      fat: "0.1 g"
    },
    badge: "Crocante",
    stock: 1,
    featured: true
  },
  {
    id: "rodajas-pera-deshidratada",
    name: "Rodajas de pera deshidratada",
    category: "chips-deshidratadas",
    categoryName: "Chips & Deshidratados",
    price: 8800,
    unit: "150g",
    netWeight: "150g",
    image: resolveProductImage("Chipsdepera.jpg"),
    description: "150g. Textura tierna y sabor dulce natural, en porciones individuales.",
    ingredients: "100% pera patagónica deshidratada en rodajas tiernas.",
    nutrition: {
      serving: "25 g",
      calories: "82 kcal",
      proteins: "0.9 g",
      carbs: "19 g",
      fiber: "3.5 g",
      fat: "0.1 g"
    },
    badge: "Tiernas",
    stock: 1,
    featured: false
  },
  {
    id: "granolas-fruta-deshidratada",
    name: "Granolas de Fruta deshidratada",
    category: "granolas-barritas",
    categoryName: "Granolas & Barritas",
    price: 9500,
    unit: "150g",
    netWeight: "150g",
    image: resolveProductImage("Granolas.jpg"),
    description: "150g. Blandos y de sabor intenso, ideales para llevar.",
    ingredients: "Cereales integrales, semillas tostadas, frutos secos y trozos de fruta deshidratada.",
    nutrition: {
      serving: "40 g",
      calories: "162 kcal",
      proteins: "4.5 g",
      carbs: "24 g",
      fiber: "4.1 g",
      fat: "5.5 g"
    },
    badge: "Energía",
    stock: 1,
    featured: true
  },
  {
    id: "mix-frutas-deshidratadas",
    name: "Mix de frutas deshidratadas",
    category: "chips-deshidratadas",
    categoryName: "Chips & Deshidratados",
    price: 9200,
    unit: "400g",
    netWeight: "400g",
    image: resolveProductImage("Chipsmixtos.jpg"),
    description: "400g. Mezcla natural de cereales, semillas, frutos secos y frutas deshidratadas.",
    ingredients: "Manzana, pera y durazno deshidratados con frutos secos y semillas.",
    nutrition: {
      serving: "35 g",
      calories: "120 kcal",
      proteins: "2.5 g",
      carbs: "22 g",
      fiber: "3.8 g",
      fat: "2.8 g"
    },
    badge: "Familiar",
    stock: 1,
    featured: true
  },
  {
    id: "barritas-frutas",
    name: "Barritas de frutas",
    category: "granolas-barritas",
    categoryName: "Granolas & Barritas",
    price: 9200,
    unit: "30g pack x 6",
    netWeight: "30g pack x 6",
    image: resolveProductImage("Barritas.jpg"),
    description: "30g pack x 6. Barras prensadas con fruta deshidratada y semillas o frutos secos.",
    ingredients: "Fruta deshidratada, semillas de girasol y calabaza, almendras y toque de miel.",
    nutrition: {
      serving: "30 g (1 barra)",
      calories: "115 kcal",
      proteins: "2.8 g",
      carbs: "18 g",
      fiber: "3.2 g",
      fat: "3.8 g"
    },
    badge: "Pack x 6",
    stock: 1,
    featured: true
  },
  {
    id: "polvo-fruta-batidos",
    name: "Polvo de fruta para batidos",
    category: "polvos-mermeladas",
    categoryName: "Polvos & Mermeladas",
    price: 6500,
    unit: "150g",
    netWeight: "150g",
    image: resolveProductImage("PolvodeFrutaparabatidos.jpg"),
    description: "150g. Fruta molida para sumar a yogures, licuados y bebidas.",
    ingredients: "Manzana, pera y durazno deshidratados micronizados para disolución rápida.",
    nutrition: {
      serving: "15 g (1 cucharada)",
      calories: "52 kcal",
      proteins: "0.8 g",
      carbs: "12 g",
      fiber: "2.4 g",
      fat: "0.1 g"
    },
    badge: "Instantáneo",
    stock: 1,
    featured: true
  },
  {
    id: "mermelada-pasta-fruta",
    name: "Mermelada o pasta de fruta (fase futura)",
    category: "polvos-mermeladas",
    categoryName: "Polvos & Mermeladas",
    price: 6500,
    unit: "500g",
    netWeight: "500g",
    image: resolveProductImage("Mermelada.jpg"),
    description: "500g. Variedad de sabores, ideales para acompañar los desayunos o meriendas.",
    ingredients: "Frutas patagónicas en trozos visibles y azúcar de caña orgánica.",
    nutrition: {
      serving: "20 g",
      calories: "45 kcal",
      proteins: "0.2 g",
      carbs: "11 g",
      fiber: "0.8 g",
      fat: "0.0 g"
    },
    badge: "Gourmet",
    stock: 1,
    featured: false
  }
];

// Claves de almacenamiento
const STORAGE_KEYS = {
  PRODUCTS: "fvp_products",
  INQUIRIES: "fvp_inquiries",
  SETTINGS: "fvp_settings",
  ORDERS: "fvp_orders"
};

// Configuración por defecto
const DEFAULT_SETTINGS = {
  backendMode: "google_apps_script", // 'local' | 'google_apps_script' | 'firebase'
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbyB326ldIfOuZAvn-7WUgBWHzET2ThPpTi5FxPvT9vP2Dkd1bT-Dyn8ehNaLcUKjBM/exec", // URL provista al publicar el Web App en Google Apps Script
  whatsappNumber: "+5492984926445", // Número oficial para checkout y atención
  contactEmail: "elianaenoriega@gmail.com", // Email oficial para consultas
  storeName: "Fruit Valley Patagonia",
  currency: "ARS",
  freeShippingMin: 18000
};

// ==========================================================================
// API Layer
// ==========================================================================
export const API = {
  /**
   * Obtiene la configuración actual del sitio y backend
   */
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
      if (!parsed.whatsappNumber || parsed.whatsappNumber.includes("4123456") || parsed.whatsappNumber.includes("4926645")) {
        parsed.whatsappNumber = "+5492984926445";
      }
      if (!parsed.contactEmail || parsed.contactEmail.includes("fruitvalleypatagonia.com")) {
        parsed.contactEmail = "elianaenoriega@gmail.com";
      }
      return parsed;
    } catch (e) {
      console.warn("Error leyendo settings:", e);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Guarda las configuraciones (URL de Google Apps Script, modo, etc.)
   */
  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  /**
   * Obtiene el listado completo de productos (con filtro de categoría o búsqueda)
   */
  async getProducts(category = 'all', search = '') {
    const settings = this.getSettings();

    // Si está en modo Google Apps Script y hay URL configurada
    if (settings.backendMode === 'google_apps_script' && settings.appsScriptUrl) {
      try {
        const url = new URL(settings.appsScriptUrl);
        url.searchParams.append('action', 'getProducts');
        if (category && category !== 'all') url.searchParams.append('category', category);
        if (search) url.searchParams.append('search', search);

        const res = await fetch(url.toString(), { method: 'GET', mode: 'cors' });
        if (res.ok) {
          const json = await res.json();
          if ((json.status === 'success' || json.success === true) && Array.isArray(json.data)) {
            // Normalizar los nombres de imagen recibidos desde Google Sheets.
const normalized = json.data.map((p, i) => ({...p,id: p.id ?? p.ID ?? (i + 1),
  name: p.name || p.Producto || '',
  price: Number(p.price ?? p.Precio ?? 0),
  description: p.description || p['Descripción'] || '',
  image: resolveProductImage(p.ImagenURL || p.Imagen || p.image),
  stock: Number(p.stock ?? p.Stock ?? 0),
  badge: p.badge || p.Oferta || '',
  categoryName: p.categoryName || p.Categoria || 'Productos Patagonia',
  unit: p.unit || p.netWeight || '500g'
}));            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(normalized));
            return normalized;
          }
        }
      } catch (err) {
        console.warn("Fallo fetch a Google Apps Script, recurriendo a LocalStorage:", err);
      }
    }

    // Modo LocalStorage por defecto
    let products = [];
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (cached) {
        products = JSON.parse(cached);
      } else {
        products = [...INITIAL_PRODUCTS];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      }
    } catch (e) {
      products = [...INITIAL_PRODUCTS];
    }

    // Reparar también imágenes guardadas en caché de versiones anteriores.
    products = products.map(p => ({ ...p, image: resolveProductImage(p.ImagenURL || p.imageUrl || p.image || p.Imagen || p.imagen) }));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // Filtrar si es necesario
    return products.filter(p => {
      const matchCategory = (category === 'all' || !category) ? true : (p.category === category);
      const matchSearch = !search ? true : (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(search.toLowerCase())
      );
      return matchCategory && matchSearch;
    });
  },

  /**
   * Obtiene un producto por su identificador único
   */
  async getProductById(id) {
    const products = await this.getProducts('all', '');
    return products.find(p => p.id === id) || null;
  },

  /**
   * Guarda (crea o actualiza) un producto
   */
  async saveProduct(product) {
    const settings = this.getSettings();
    if (!product.id) {
      product.id = 'prod-' + Date.now();
    }

    // Conexión Google Apps Script si está activo
    if (settings.backendMode === 'google_apps_script' && settings.appsScriptUrl) {
      try {
        const res = await fetch(settings.appsScriptUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveProduct', data: product })
        });
        const resJson = await res.json();
        if (resJson.status === 'success') {
          // Continuar y guardar también localmente para sincronización
        }
      } catch (err) {
        console.warn("Error enviando producto a Apps Script, actualizando local:", err);
      }
    }

    // Persistencia LocalStorage
    const products = await this.getProducts('all', '');
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = { ...products[index], ...product };
    } else {
      products.unshift(product);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return product;
  },

  /**
   * Elimina un producto por ID
   */
  async deleteProduct(id) {
    const settings = this.getSettings();

    if (settings.backendMode === 'google_apps_script' && settings.appsScriptUrl) {
      try {
        await fetch(settings.appsScriptUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteProduct', id: id })
        });
      } catch (err) {
        console.warn("Error al borrar en Apps Script:", err);
      }
    }

    let products = await this.getProducts('all', '');
    products = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return true;
  },

  /**
   * Registra una consulta desde el formulario de contacto
   */
  async saveInquiry(inquiryData) {
    const settings = this.getSettings();
    const newInquiry = {
      id: 'inq-' + Date.now(),
      date: new Date().toISOString(),
      status: 'pending',
      ...inquiryData
    };

    // Intentar enviar a Google Apps Script
    if (settings.backendMode === 'google_apps_script' && settings.appsScriptUrl) {
      try {
        await fetch(settings.appsScriptUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveInquiry', data: newInquiry })
        });
      } catch (err) {
        console.warn("No se pudo enviar consulta a Google Sheets, guardando en local:", err);
      }
    }

    // Guardar en LocalStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newInquiry);
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(list));
    } catch (e) {
      console.error("Error guardando consulta local:", e);
    }

    return newInquiry;
  },

  /**
   * Obtiene todas las consultas recibidas
   */
  async getInquiries() {
    const settings = this.getSettings();

    if (settings.backendMode === 'google_apps_script' && settings.appsScriptUrl) {
      try {
        const url = new URL(settings.appsScriptUrl);
        url.searchParams.append('action', 'getInquiries');
        const res = await fetch(url.toString(), { method: 'GET', mode: 'cors' });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && Array.isArray(json.data)) {
            localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(json.data));
            return json.data;
          }
        }
      } catch (e) {
        console.warn("Fallo obteniendo consultas de Apps Script:", e);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      return stored ? JSON.parse(stored) : [
        {
          id: "inq-demo-1",
          date: new Date(Date.now() - 3600000 * 24).toISOString(),
          name: "Martín Rivas",
          email: "mrivas@dieteticaspatagonia.com",
          phone: "+54 9 299 443211",
          type: "mayorista",
          subject: "Cotización de Harina de Durazno y Manzana x 25kg",
          message: "Hola equipo de Fruit Valley. Tenemos 4 locales de alimentos naturales en Neuquén y Bariloche. Deseamos lista de precios por bulto cerrado y plazos de entrega.",
          status: "pending"
        },
        {
          id: "inq-demo-2",
          date: new Date(Date.now() - 3600000 * 72).toISOString(),
          name: "Lucía Fernández",
          email: "lucia.f@gmail.com",
          phone: "+54 9 11 55667788",
          type: "minorista",
          subject: "Consulta sobre certificación sin TACC",
          message: "Quería consultar si la granola tiene trazas de trigo o si es apta para celíacos severos. ¡Muchas gracias!",
          status: "responded"
        }
      ];
    } catch (e) {
      return [];
    }
  },

  /**
   * Prueba de conectividad con la URL de Google Apps Script
   */
  async testBackendConnection(url) {
    if (!url) return { success: false, message: "URL vacía" };
    try {
      const testUrl = new URL(url);
      testUrl.searchParams.append('action', 'ping');
      const res = await fetch(testUrl.toString(), { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const json = await res.json();
        return { success: true, message: json.message || "Conexión exitosa con Google Apps Script y Google Sheets" };
      }
      return { success: false, message: `El servidor respondió con código HTTP ${res.status}` };
    } catch (err) {
      return { success: false, message: `Error de conexión: ${err.message}. Asegúrate de haber publicado como 'Cualquier usuario' (Anyone).` };
    }
  },

  /**
   * Inicializa o crea todas las 6 hojas en el mismo documento de Google Sheets
   */
  async setupGoogleSheets(url) {
    const targetUrl = url || this.getSettings().appsScriptUrl;
    if (!targetUrl) return { success: false, message: "URL de Google Apps Script no configurada." };
    try {
      const setupUrl = new URL(targetUrl);
      setupUrl.searchParams.append('action', 'setupSheets');
      const res = await fetch(setupUrl.toString(), { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const json = await res.json();
        return { success: true, message: json.message || "Las 6 hojas fueron creadas con éxito en el documento de Google Sheets.", sheets: json.sheets };
      }
      return { success: false, message: `Respuesta del servidor: HTTP ${res.status}` };
    } catch (err) {
      return { success: false, message: `Error al crear hojas en Google Sheets: ${err.message}` };
    }
  },

  /**
   * Restablece el catálogo a los datos originales
   */
  resetCatalogToDefault() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return [...INITIAL_PRODUCTS];
  },

  /**
   * Exporta toda la base de datos local en formato JSON
   */
  exportData() {
    return {
      products: JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]'),
      inquiries: JSON.parse(localStorage.getItem(STORAGE_KEYS.INQUIRIES) || '[]'),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
  }
};
