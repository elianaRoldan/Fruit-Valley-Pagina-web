/**
 * Fruit Valley Patagonia — API REST en Google Apps Script
 * Pegar en Extensiones > Apps Script y publicar como Aplicación web (Ejecutar como: Yo / Acceso: Cualquier usuario).
 */
// Carpeta de Google Drive compartida con las imágenes de productos.
var DRIVE_IMAGES_FOLDER_ID = '15dR48KxTFmWznPYo24EsAnh4JNHH9bxK';

var SHEETS = {
  Productos: ['Producto', 'Precio', 'Descripción', 'Imagen', 'Stock', 'Oferta'],
  Usuarios: ['ID', 'Nombre', 'Email', 'Telefono', 'TipoNegocio', 'FechaRegistro', 'Estado'],
  Consultas: ['ID', 'Fecha', 'Nombre', 'Email', 'Telefono', 'Tipo', 'Asunto', 'Mensaje', 'Estado'],
  Categorias: ['ID', 'Nombre', 'Slug', 'Descripcion', 'Orden', 'Activo'],
  Configuracion: ['Clave', 'Valor', 'Descripcion', 'UltimaActualizacion'],
  Administradores: ['ID', 'Nombre', 'Email', 'Rol', 'NivelAcceso', 'UltimoIngreso']
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🌱 Fruit Valley').addItem('🚀 Inicializar Base de Datos', 'setupSheets').addToUi();
}

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]])
        .setFontWeight('bold').setBackground('#2f6b4a').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  });
  return 'Las 6 hojas fueron creadas / verificadas.';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function clean_(v) { // evita inyección de fórmulas
  v = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim();
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
function rows_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var data = sh.getDataRange().getValues(), head = data.shift();
  return data.map(function (r) { var o = {}; head.forEach(function (h, i) { o[h] = r[i]; }); return o; });
}

/** Busca cada imagen por nombre dentro de la carpeta de Drive y agrega una URL pública.
 * La columna Imagen conserva solamente el filename para no alterar la planilla.
 */
function addDriveImageUrls_(products) {
  var folder = DriveApp.getFolderById(DRIVE_IMAGES_FOLDER_ID);
  var files = folder.getFiles();
  var index = {};
  while (files.hasNext()) {
    var file = files.next();
    index[file.getName().toLowerCase()] = file.getId();
  }
  return products.map(function (product) {
    var filename = String(product.Imagen || product.image || '').trim();
    if (/^https?:\/\//i.test(filename)) {
      product.ImagenURL = filename;
      return product;
    }
    var fileId = index[filename.toLowerCase()];
    product.ImagenURL = fileId
      ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w1200'
      : '';
    return product;
  });
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  try {
    switch (action) {
      case 'ping': return json_({ success: true, message: 'Fruit Valley API activa y conectada a Google Sheets.' });
      case 'getProducts': return json_({ success: true, data: addDriveImageUrls_(rows_('Productos')) });
      case 'getCategories': return json_({ success: true, data: rows_('Categorias') });
      case 'getInquiries': return json_({ success: true, data: rows_('Consultas') });
      default: return json_({ success: false, message: 'Acción no válida.' });
    }
  } catch (err) { return json_({ success: false, message: String(err) }); }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents), ss = SpreadsheetApp.getActiveSpreadsheet();
    switch (body.action) {
      case 'setup': return json_({ success: true, message: setupSheets() });
      case 'saveInquiry':
        var d = body.data || {};
        ss.getSheetByName('Consultas').appendRow([clean_(d.id || 'INQ-' + Date.now()), new Date().toISOString(), clean_(d.name), clean_(d.email),
          clean_(d.phone), clean_(d.type), clean_(d.subject), clean_(d.message), 'Pendiente']);
        return json_({ success: true });
      case 'saveProduct':
        var p = body.data || {}, sh = ss.getSheetByName('Productos'), vals = sh.getDataRange().getValues(), row = -1;
        for (var i = 1; i < vals.length; i++) if (String(vals[i][0]) === String(p.name)) { row = i + 1; break; }
        var line = [clean_(p.name), Number(p.price) || 0, clean_(p.description), clean_(p.image), Number(p.stock) || 0, clean_(p.badge)];
        if (row > 0) sh.getRange(row, 1, 1, 6).setValues([line]); else sh.appendRow(line);
        return json_({ success: true });
      default: return json_({ success: false, message: 'Acción no válida.' });
    }
  } catch (err) { return json_({ success: false, message: String(err) }); }
}
