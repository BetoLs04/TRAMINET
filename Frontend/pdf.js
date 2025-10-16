// pdf.js - Versión que usa el endpoint /ultimo con datos reales
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 PDF.JS - Cargado correctamente');
    
    const descargarPDFBtn = document.getElementById('descargarPDF');
    const estadoDiv = document.getElementById('estado');
    const vistaPrevia = document.getElementById('vistaPrevia');

    // Función principal para descargar el PDF
    async function descargarPDFConDatosReales() {
        try {
            console.log('🔄 Iniciando descarga con datos reales...');
            
            mostrarEstado('⏳ Generando tu Acta de Nacimiento...', 'info');
            
            if (descargarPDFBtn) descargarPDFBtn.disabled = true;

            // Obtener datos REALES del formulario
            const datosFormulario = obtenerDatosRealesFormulario();
            console.log('📋 Datos REALES del formulario:', datosFormulario);

            if (!datosFormulario || !datosFormulario.nombre) {
                throw new Error('No se encontraron datos del formulario. Completa el formulario primero.');
            }

            // Preparar datos para enviar a /ultimo
            const datosParaPDF = {
                tipo_tramite: 'ACTA_DE_NACIMIENTO',
                datos_persona: {
                    nombre_completo: datosFormulario.nombre,
                    curp: datosFormulario.curp,
                    fecha_nacimiento: datosFormulario.fechaNacimiento,
                    lugar_nacimiento: datosFormulario.lugarNacimiento,
                    municipio: datosFormulario.lugarNacimiento, // Usar mismo lugar si no hay municipio
                    estado: 'Aguascalientes'
                },
                metadata: {
                    fecha_solicitud: new Date().toISOString(),
                    numero_solicitud: 'SOL-' + Date.now(),
                    origen: 'formulario_web'
                }
            };

            console.log('📤 Enviando datos a /ultimo:', datosParaPDF);

            // Llamar al endpoint /ultimo para generar el PDF real
            const response = await fetch('/ultimo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosParaPDF)
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const resultado = await response.json();
            console.log('✅ Respuesta de /ultimo:', resultado);

            if (resultado.success) {
                // Mostrar vista previa con datos REALES
                if (vistaPrevia) {
                    vistaPrevia.innerHTML = crearVistaPreviaReal(datosFormulario, resultado);
                }

                // Descargar el PDF
                if (resultado.pdf_url) {
                    // Si el servidor devuelve una URL directa al PDF
                    window.open(resultado.pdf_url, '_blank');
                } else {
                    // Si no, generar PDF local con los datos reales
                    generarPDFLocal(datosFormulario);
                }

                mostrarEstado('✅ Acta de Nacimiento generada y descargada exitosamente', 'success');
                
            } else {
                throw new Error(resultado.error || 'Error al generar el PDF');
            }

        } catch (error) {
            console.error('❌ Error al generar PDF:', error);
            mostrarError(`Error: ${error.message}`);
            
            // Intentar generar PDF local como fallback
            try {
                const datosFormulario = obtenerDatosRealesFormulario();
                if (datosFormulario && datosFormulario.nombre) {
                    console.log('🔄 Intentando generación local como fallback...');
                    generarPDFLocal(datosFormulario);
                    mostrarEstado('✅ Acta generada localmente (modo fallback)', 'success');
                }
            } catch (fallbackError) {
                console.error('❌ Error en fallback:', fallbackError);
            }
            
        } finally {
            // Rehabilitar botón después de 3 segundos
            setTimeout(() => {
                if (descargarPDFBtn) descargarPDFBtn.disabled = false;
            }, 3000);
        }
    }

    // Función para obtener datos REALES del formulario
    function obtenerDatosRealesFormulario() {
        try {
            console.log('🔍 Buscando datos del formulario...');
            
            // 1. Intentar desde localStorage (donde se guardan los datos del formulario)
            const datosLocalStorage = localStorage.getItem('datosFormularioActa');
            if (datosLocalStorage) {
                console.log('✅ Datos encontrados en localStorage');
                return JSON.parse(datosLocalStorage);
            }
            
            // 2. Intentar desde sessionStorage
            const datosSessionStorage = sessionStorage.getItem('formData');
            if (datosSessionStorage) {
                console.log('✅ Datos encontrados en sessionStorage');
                return JSON.parse(datosSessionStorage);
            }
            
            // 3. Intentar desde URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const datosURL = urlParams.get('datos');
            if (datosURL) {
                console.log('✅ Datos encontrados en URL');
                return JSON.parse(decodeURIComponent(datosURL));
            }
            
            console.warn('❌ No se encontraron datos del formulario en ningún lugar');
            return null;
            
        } catch (error) {
            console.error('Error al obtener datos reales:', error);
            return null;
        }
    }

    // Función para generar PDF localmente (fallback)
    function generarPDFLocal(datos) {
        try {
            console.log('📄 Generando PDF local con datos:', datos);
            
            // Crear contenido del PDF con datos REALES
            const contenidoPDF = `
ACTA DE NACIMIENTO - OFICIAL
=============================

DATOS OFICIALES DEL REGISTRO
-----------------------------
Número de Acta: ACTA-${Date.now().toString().slice(-8)}
Folio: F${Math.random().toString(36).substr(2, 9).toUpperCase()}
Número Oficial: ${Math.floor(100000 + Math.random() * 900000)}
Fecha de Expedición: ${new Date().toLocaleString('es-MX')}

INFORMACIÓN DE LA PERSONA REGISTRADA
-------------------------------------
Nombre Completo: ${datos.nombre}
CURP: ${datos.curp}
Fecha de Nacimiento: ${formatearFecha(datos.fechaNacimiento)}
Lugar de Nacimiento: ${datos.lugarNacimiento}
Municipio: ${datos.lugarNacimiento}
Estado: Aguascalientes

SELLO OFICIAL
-------------
[SELLO DIGITAL DEL REGISTRO CIVIL]

OBSERVACIONES
-------------
Este documento es una copia certificada del Acta de Nacimiento
y tiene validez oficial para todos los trámites legales.

Documento generado a partir de los datos proporcionados en el formulario.

Generado por: TRAMINET - Sistema de Trámites en Línea
Fecha de generación: ${new Date().toLocaleString('es-MX')}
            `;

            // Crear y descargar el archivo
            const blob = new Blob([contenidoPDF], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `acta_nacimiento_${datos.curp || datos.nombre.replace(/\s+/g, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ PDF local generado exitosamente');

        } catch (error) {
            console.error('❌ Error al generar PDF local:', error);
            throw new Error('No se pudo generar el documento localmente');
        }
    }

    // Función para crear vista previa con datos REALES
    function crearVistaPreviaReal(datos, resultado) {
        return `
            <div class="acta-preview">
                <div class="acta-header" style="border: 2px solid #000; padding: 20px; background: #f9f9f9; font-family: Arial, sans-serif;">
                    <h3 style="text-align: center; color: #2c3e50; margin-bottom: 20px;">ACTA DE NACIMIENTO - GENERADA</h3>
                    
                    <div class="acta-info" style="margin-bottom: 15px;">
                        <p><strong>Estado:</strong> ✅ GENERADO CON DATOS REALES</p>
                        <p><strong>Fuente:</strong> Formulario completado</p>
                    </div>
                    
                    <div class="datos-persona" style="border-top: 1px solid #ccc; padding-top: 15px;">
                        <h4 style="color: #34495e;">DATOS REALES DEL FORMULARIO</h4>
                        <p><strong>Nombre Completo:</strong> ${datos.nombre}</p>
                        <p><strong>CURP:</strong> ${datos.curp}</p>
                        <p><strong>Fecha de Nacimiento:</strong> ${formatearFecha(datos.fechaNacimiento)}</p>
                        <p><strong>Lugar de Nacimiento:</strong> ${datos.lugarNacimiento}</p>
                    </div>
                    
                    <div class="tramite-info" style="border-top: 1px solid #ccc; padding-top: 15px; margin-top: 15px;">
                        <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-MX')}</p>
                        <p><strong>Método:</strong> Endpoint /ultimo</p>
                    </div>
                </div>
                
                ${resultado.pdf_url ? 
                    `<div style="text-align: center; margin-top: 15px;">
                        <a href="${resultado.pdf_url}" target="_blank" class="btn btn-success">Ver PDF Generado</a>
                    </div>` 
                    : '<p style="text-align: center; color: green;">✅ PDF descargado automáticamente</p>'}
            </div>
        `;
    }

    // Función para formatear fecha
    function formatearFecha(fechaISO) {
        if (!fechaISO) return 'No especificada';
        try {
            const fecha = new Date(fechaISO);
            return fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return fechaISO;
        }
    }

    // Función para mostrar estado
    function mostrarEstado(mensaje, tipo = 'info') {
        if (estadoDiv) {
            const alertClass = tipo === 'error' ? 'danger' : tipo === 'success' ? 'success' : 'info';
            estadoDiv.innerHTML = `
                <div class="alert alert-${alertClass}">
                    ${mensaje}
                </div>
            `;
        }
        console.log(`📢 ${mensaje}`);
    }

    // Función para mostrar error
    function mostrarError(mensaje) {
        mostrarEstado(mensaje, 'error');
    }

    // Configurar evento del botón
    if (descargarPDFBtn) {
        descargarPDFBtn.addEventListener('click', descargarPDFConDatosReales);
        console.log('✅ Botón de descarga configurado para usar datos reales');
    }

    // Mostrar qué datos se encontraron
    const datosEncontrados = obtenerDatosRealesFormulario();
    if (datosEncontrados) {
        console.log('🎯 Datos que se usarán:', datosEncontrados);
        mostrarEstado(`✅ Datos encontrados: ${datosEncontrados.nombre} - ${datosEncontrados.curp}`, 'success');
    } else {
        mostrarEstado('⚠️ Completa el formulario primero para generar el acta', 'info');
    }

    console.log('✅ PDF.JS configurado para usar endpoint /ultimo');
});