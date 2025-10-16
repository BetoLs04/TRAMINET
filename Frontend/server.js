const express = require('express');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware - IMPORTANTE: Deshabilitar el index automático
app.use(express.json());
app.use(express.static('.', { index: false })); // ← ESTA LÍNEA ES CLAVE
app.use(express.urlencoded({ extended: true }));

// Configurar Mercado Pago v2 con TU TOKEN
const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-4090621729318543-092613-f145cf2b953e8d9291cd0dfaaa8fb533-2716186430'
});

console.log('🔧 Mercado Pago Configurado');

const paymentSessions = new Map();

// ==================== RUTAS PRINCIPALES ====================

// Ruta PRINCIPAL - FORZAR front.html
app.get('/', (req, res) => {
  console.log('📄 Sirviendo front.html como página principal');
  res.sendFile(path.join(__dirname, 'front.html'));
});

// Ruta para formulario
app.get('/formulario', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// Ruta para pagos
app.get('/pagos', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para verificar pago
app.get('/verificar_pago', (req, res) => {
  res.sendFile(path.join(__dirname, 'verificar_pago.html'));
});

// Ruta para PDF
app.get('/pdf', (req, res) => {
  res.sendFile(path.join(__dirname, 'pdf.html'));
});

// Ruta para servicio premium
app.get('/servicio', (req, res) => {
  res.sendFile(path.join(__dirname, 'pdf.html'));
});

// ==================== RUTAS DE PAGOS ====================

app.post('/create_preference', async (req, res) => {
  try {
    console.log('🔄 Creando preferencia...');

    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const preference = new Preference(client);
    
    const result = await preference.create({
      body: {
        items: [
          {
            title: 'Trámite de Acta de Nacimiento - TRAMINET',
            quantity: 1,
            unit_price: 10
          }
        ],
        back_urls: {
          success: `http://localhost:${PORT}/verificar_pago`,
          failure: `http://localhost:${PORT}/verificar_pago`,
          pending: `http://localhost:${PORT}/verificar_pago`
        },
        external_reference: sessionId,
        notification_url: `http://localhost:${PORT}/webhook`
      }
    });
    
    paymentSessions.set(sessionId, {
      preference_id: result.id,
      status: 'pending',
      created_at: new Date(),
      init_point: result.init_point || result.sandbox_init_point,
      external_reference: sessionId
    });

    console.log('✅ Preferencia creada exitosamente');

    res.json({
      success: true,
      init_point: result.init_point || result.sandbox_init_point,
      session_id: sessionId
    });

  } catch (error) {
    console.error('❌ Error al crear preferencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el pago: ' + error.message
    });
  }
});

// ==================== RUTAS DE VERIFICACIÓN ====================

app.get('/check-payment/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    if (!paymentSessions.has(sessionId)) {
      return res.json({ 
        success: false, 
        error: 'Sesión no encontrada'
      });
    }

    const session = paymentSessions.get(sessionId);
    
    // Simular estados
    const randomStatus = Math.random();
    if (randomStatus > 0.7) {
      session.status = 'approved';
    } else if (randomStatus > 0.4) {
      session.status = 'pending';
    } else {
      session.status = 'rejected';
    }

    paymentSessions.set(sessionId, session);

    res.json({
      success: true,
      payment_status: session.status,
      session_id: sessionId
    });

  } catch (error) {
    console.error('Error en check-payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

app.get('/force-check/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    if (!paymentSessions.has(sessionId)) {
      return res.json({
        success: false,
        error: 'Sesión no encontrada'
      });
    }

    const session = paymentSessions.get(sessionId);
    session.status = 'approved';
    session.force_checked = true;
    
    paymentSessions.set(sessionId, session);

    res.json({
      success: true,
      payment_status: 'approved',
      session_id: sessionId,
      force_checked: true
    });

  } catch (error) {
    console.error('Error en verificación forzada:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      console.log(`🔄 Webhook recibido - Payment ID: ${paymentId}`);
    }
  } catch (error) {
    console.error('Error en webhook:', error);
  }
  
  res.status(200).send('OK');
});

app.post('/submit', (req, res) => {
  const datos = req.body;
  console.log('✅ Datos del formulario recibidos:', datos);
  res.send('✅ Solicitud enviada correctamente');
});

// ==================== RUTAS PARA PDF ====================

// Ruta para generar el PDF
app.post('/ultimo', (req, res) => {
  try {
    console.log('📄 Generando PDF...');
    
    // Aquí deberías integrar tu lógica para generar el PDF
    // Por ahora simulamos una respuesta exitosa
    const pdfData = {
      success: true,
      message: 'PDF generado exitosamente',
      pdf_url: `/pdf?timestamp=${Date.now()}`,
      data: req.body // Los datos que envías desde el frontend
    };
    
    console.log('✅ PDF generado simuladamente');
    res.json(pdfData);
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar el PDF: ' + error.message
    });
  }
});

// Ruta para servir el PDF (si tienes un archivo físico)
app.get('/descargar-pdf', (req, res) => {
  const pdfPath = path.join(__dirname, 'documento.pdf');
  res.download(pdfPath, 'acta_nacimiento.pdf', (err) => {
    if (err) {
      console.error('❌ Error al descargar PDF:', err);
      res.status(404).send('PDF no encontrado');
    }
  });
});
// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🏠 Página principal: http://localhost:${PORT}/ ← FRONT.HTML`);
  console.log(`📝 Formulario: http://localhost:${PORT}/formulario`);
  console.log(`💳 Pagos: http://localhost:${PORT}/pagos`);
  console.log(`🔍 Verificación: http://localhost:${PORT}/verificar_pago`);
  console.log(`📄 PDF: http://localhost:${PORT}/pdf`);
  console.log('=========================================');
  console.log('✅ FORZADO: Inicia en front.html');
});