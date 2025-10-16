// scriptform.js - Manejo del formulario de trámite
document.getElementById('miFormulario').addEventListener('submit', async function(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const datosObjeto = {};

  for (let [key, value] of formData.entries()) {
    datosObjeto[key] = value;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Procesando...';

  try {
    const response = await fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosObjeto)
    });

    if (response.ok) {
      console.log('✅ Datos enviados correctamente');
      
      // Guardar datos del formulario en localStorage para usar después del pago
      localStorage.setItem('formData', JSON.stringify({
        ...datosObjeto,
        timestamp: new Date().toISOString(),
        tramite: 'acta_nacimiento'
      }));
      
      // Redirigir al sistema de pagos
      console.log('🔄 Redirigiendo a sistema de pagos...');
      window.location.href = '/pagos';
      
    } else {
      const errorText = await response.text();
      throw new Error(`Error del servidor: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error al enviar:', error);
    const resultDiv = document.getElementById('result');
    resultDiv.innerText = 'Error al enviar los datos: ' + error.message;
    resultDiv.style.display = 'block';
    resultDiv.style.background = '#f8d7da';
    resultDiv.style.color = '#721c24';
    resultDiv.style.padding = '10px';
    resultDiv.style.borderRadius = '5px';
    resultDiv.style.marginTop = '10px';

    submitBtn.disabled = false;
    submitBtn.innerText = 'Enviar solicitud y proceder al pago';

    setTimeout(() => {
      resultDiv.innerText = '';
      resultDiv.style.display = 'none';
    }, 5000);
  }
});

// Validación adicional del formulario
document.addEventListener('DOMContentLoaded', function() {
  const formulario = document.getElementById('miFormulario');
  const inputs = formulario.querySelectorAll('input[required]');
  
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      if (!this.value.trim()) {
        this.style.borderColor = '#dc3545';
      } else {
        this.style.borderColor = '#28a745';
      }
    });
  });
  
  // Validar CURP
  const curpInput = document.getElementById('curp');
  if (curpInput) {
    curpInput.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });
  }
});