// Variables globales
let selectedServices = [];
let selectedTime = null;
let totalAmount = 0;
let reservations = [];

// Configurar fecha mínima (hoy)
const today = new Date().toISOString().split('T')[0];
document.getElementById('fecha').min = today;

// Cargar reservas desde LocalStorage al iniciar
loadReservations();

// Función para cargar reservas desde LocalStorage
function loadReservations() {
    try {
        const storedReservations = localStorage.getItem('barberia_reservations');
        if (storedReservations) {
            reservations = JSON.parse(storedReservations);
            displayReservations();
        }
    } catch (error) {
        console.log('No hay reservas previas o error al cargar:', error);
        reservations = [];
    }
}

// Función para guardar reservas en LocalStorage
function saveReservations() {
    try {
        localStorage.setItem('barberia_reservations', JSON.stringify(reservations));
        return true;
    } catch (error) {
        console.error('Error al guardar en LocalStorage:', error);
        return false;
    }
}

// Función para mostrar las reservas en la página
function displayReservations() {
    const listDiv = document.getElementById('reservationsList');
    
    if (!reservations || reservations.length === 0) {
        listDiv.innerHTML = `
            <p style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 40px;">
                No hay reservas registradas aún. ¡Sé el primero en reservar!
            </p>
        `;
        return;
    }

    // Ordenar por fecha más reciente
    reservations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    listDiv.innerHTML = reservations.map((reserva, index) => `
        <div class="reservation-card">
            <div class="reservation-header">
                <div class="reservation-name">${reserva.nombre}</div>
                <div class="reservation-badge">${reserva.ciudad}</div>
            </div>
            <div class="reservation-info">
                <div class="info-item">
                    <span>📅</span>
                    <span>${formatDate(reserva.fecha)}</span>
                </div>
                <div class="info-item">
                    <span>⏰</span>
                    <span>${reserva.hora}</span>
                </div>
                <div class="info-item">
                    <span>📱</span>
                    <span>${reserva.telefono}</span>
                </div>
                <div class="info-item">
                    <span>💰</span>
                    <span>${reserva.total.toLocaleString()}</span>
                </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                <strong style="color: #FCD116;">Servicios:</strong> ${reserva.servicios.join(', ')}
            </div>
            ${reserva.comentarios ? `
                <div style="margin-top: 10px; font-size: 0.9em; color: rgba(255,255,255,0.7);">
                    <strong>Comentarios:</strong> ${reserva.comentarios}
                </div>
            ` : ''}
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <button onclick="contactarCliente(${index})" class="btn-contact">
                    📱 Contactar Cliente
                </button>
                <button onclick="reenviarConfirmacion(${index})" class="btn-contact btn-resend">
                    🔄 Reenviar Confirmación
                </button>
            </div>
        </div>
    `).join('');
}

// Función para contactar al cliente
function contactarCliente(index) {
    const reserva = reservations[index];
    let telefono = reserva.telefono.replace(/\D/g, '');
    
    if (!telefono.startsWith('57') && telefono.length === 10) {
        telefono = '57' + telefono;
    }
    
    const mensaje = `Hola ${reserva.nombre}, te contactamos desde BarberShop Colombia respecto a tu reserva del ${formatDate(reserva.fecha)} a las ${reserva.hora}.`;
    
    const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
}

// Función para reenviar confirmación
function reenviarConfirmacion(index) {
    const reserva = reservations[index];
    enviarConfirmacionWhatsApp(reserva);
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-CO', options);
}

// Event listeners para selección de servicios
document.querySelectorAll('.service-item').forEach(item => {
    item.addEventListener('click', function() {
        this.classList.toggle('selected');
        updateSummary();
    });
});

// Función para actualizar el resumen de servicios
function updateSummary() {
    selectedServices = [];
    totalAmount = 0;

    document.querySelectorAll('.service-item.selected').forEach(item => {
        const serviceName = item.querySelector('.service-name').textContent;
        const price = parseInt(item.dataset.price);
        selectedServices.push({ name: serviceName, price: price });
        totalAmount += price;
    });

    const servicesDiv = document.getElementById('selectedServices');
    
    if (selectedServices.length === 0) {
        servicesDiv.innerHTML = '<p style="color: #999;">No has seleccionado servicios</p>';
    } else {
        servicesDiv.innerHTML = selectedServices.map(s => 
            `<div class="summary-item">
                <span>${s.name}</span>
                <span>$${s.price.toLocaleString()}</span>
            </div>`
        ).join('');
    }

    document.getElementById('totalPrice').textContent = `$${totalAmount.toLocaleString()}`;
}

// Event listeners para selección de horarios
document.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', function() {
        if (this.classList.contains('disabled')) return;
        
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
        selectedTime = this.dataset.time;
    });
});

// Actualizar disponibilidad de horarios cuando se selecciona una fecha
document.getElementById('fecha').addEventListener('change', function() {
    const allSlots = document.querySelectorAll('.time-slot');
    allSlots.forEach(slot => {
        slot.classList.remove('disabled', 'selected');
    });
    selectedTime = null;

    // Simular algunos horarios ocupados aleatoriamente
    const random = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < random; i++) {
        const randomIndex = Math.floor(Math.random() * allSlots.length);
        allSlots[randomIndex].classList.add('disabled');
    }
});

// Función para enviar confirmación por WhatsApp
function enviarConfirmacionWhatsApp(reservaData) {
    // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
    let telefono = reservaData.telefono.replace(/\D/g, '');
    
    // Si el número no tiene código de país, agregar +57 (Colombia)
    if (!telefono.startsWith('57') && telefono.length === 10) {
        telefono = '57' + telefono;
    }
    
    // Formatear la fecha
    const fechaFormateada = formatDate(reservaData.fecha);
    
    // Crear el mensaje de WhatsApp
    const mensaje = `
🎉 *¡RESERVA CONFIRMADA!* 🎉

✂️ *BARBERSHOP COLOMBIA* 💈

Hola *${reservaData.nombre}*! Tu reserva ha sido confirmada exitosamente.

📋 *DETALLES DE TU RESERVA:*

📅 *Fecha:* ${fechaFormateada}
⏰ *Hora:* ${reservaData.hora}
🏙️ *Ciudad:* ${reservaData.ciudad}

💇‍♂️ *Servicios:*
${reservaData.servicios.map(s => '  • ' + s).join('\n')}

💰 *Total a pagar:* ${reservaData.total.toLocaleString()} COP

${reservaData.comentarios ? `💬 *Comentarios:* ${reservaData.comentarios}\n\n` : ''}
📱 Te esperamos en tu cita. Si necesitas reprogramar, contáctanos con anticipación.

¡Gracias por confiar en nosotros! 💈✨
    `.trim();
    
    // Crear URL de WhatsApp
    const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp en una nueva ventana
    window.open(urlWhatsApp, '_blank');
}

// Manejo del formulario de reserva
document.getElementById('reservaForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Validaciones
    if (selectedServices.length === 0) {
        alert('❌ Por favor selecciona al menos un servicio');
        return;
    }

    if (!selectedTime) {
        alert('❌ Por favor selecciona una hora');
        return;
    }

    // Validar que el teléfono tenga al menos 10 dígitos
    const telefono = document.getElementById('telefono').value.replace(/\D/g, '');
    if (telefono.length < 10) {
        alert('❌ Por favor ingresa un número de teléfono válido (mínimo 10 dígitos)');
        return;
    }

    // Recopilar datos de la reserva
    const reservaData = {
        id: 'reserva_' + Date.now(),
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        fecha: document.getElementById('fecha').value,
        hora: selectedTime,
        ciudad: document.getElementById('ciudad').value,
        comentarios: document.getElementById('comentarios').value,
        servicios: selectedServices.map(s => s.name),
        total: totalAmount,
        timestamp: new Date().toISOString()
    };

    // Guardar en LocalStorage
    try {
        reservations.push(reservaData);
        
        if (saveReservations()) {
            console.log('✅ Reserva guardada exitosamente');
            
            // Actualizar la visualización
            displayReservations();
            
            // Mostrar modal de éxito
            document.getElementById('successModal').classList.add('show');
            
            // 1. Enviar confirmación por WhatsApp al cliente
            setTimeout(() => {
                enviarConfirmacionWhatsApp(reservaData);
            }, 1000);
            
            // 2. Notificar a la barbería por WhatsApp
            setTimeout(() => {
                notificarBarberia(reservaData);
            }, 2500);
            
            // 3. Enviar correo si el cliente proporcionó email
            if (reservaData.email) {
                setTimeout(() => {
                    enviarCorreoConfirmacion(reservaData);
                }, 4000);
            }
            
            // Limpiar formulario después de un breve delay
            setTimeout(() => {
                resetForm();
            }, 1500);
        } else {
            throw new Error('No se pudo guardar la reserva');
        }
        
    } catch (error) {
        console.error('❌ Error al guardar la reserva:', error);
        alert('Hubo un error al guardar tu reserva. Por favor intenta nuevamente.');
    }
});

// Función para resetear el formulario
function resetForm() {
    document.getElementById('reservaForm').reset();
    
    // Limpiar servicios seleccionados
    document.querySelectorAll('.service-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Limpiar horarios
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected', 'disabled');
    });
    
    selectedServices = [];
    selectedTime = null;
    updateSummary();
}

// Función para cerrar el modal
function closeModal() {
    document.getElementById('successModal').classList.remove('show');
}

// Cerrar modal al hacer clic fuera de él
document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Animación suave al hacer scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Función para exportar reservas (bonus)
function exportarReservas() {
    const dataStr = JSON.stringify(reservations, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reservas_barberia.json';
    link.click();
}

// Función para limpiar todas las reservas (usar con cuidado)
function limpiarReservas() {
    if (confirm('¿Estás seguro de que quieres eliminar TODAS las reservas? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('barberia_reservations');
        reservations = [];
        displayReservations();
        alert('✅ Todas las reservas han sido eliminadas');
    }
}