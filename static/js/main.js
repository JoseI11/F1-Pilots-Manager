document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const pilotForm = document.getElementById('pilot-form');
    const pilotsTable = document.getElementById('pilots-table-body');
    const pagination = document.getElementById('pagination');
    const searchName = document.getElementById('search-name');
    const searchTeam = document.getElementById('search-team');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const formTitle = document.getElementById('form-title');
    const formButton = document.getElementById('form-button');
    const loadingIndicator = document.getElementById('loading');
    
    // Verificar que los elementos del DOM existen
    if (!pilotsTable || !pagination || !pilotForm || !searchName || !searchTeam || !cancelEditBtn || !formTitle || !formButton || !loadingIndicator) {
        console.error('Error: No se pudieron encontrar todos los elementos del DOM necesarios');
        return;
    }
    
    const confirmModalElement = document.getElementById('confirmModal');
    if (!confirmModalElement) {
        console.error('Error: No se pudo encontrar el modal de confirmación');
        return;
    }
    
    const confirmModal = new bootstrap.Modal(confirmModalElement);
    
    let currentPage = 1;
    let totalPages = 1;
    let editingPilotId = null;
    let deletePilotId = null;
    const ITEMS_PER_PAGE = 10;

    // Cargar pilotos al iniciar
    loadPilots();

    // Event Listeners
    pilotForm.addEventListener('submit', handleFormSubmit);
    searchName.addEventListener('input', debounce(loadPilots, 300));
    searchTeam.addEventListener('change', loadPilots);
    cancelEditBtn.addEventListener('click', cancelEdit);
    document.getElementById('confirm-delete').addEventListener('click', confirmDelete);

    // Función para cargar pilotos con paginación
    async function loadPilots(page = 1) {
        try {
            showLoading(true);
            currentPage = page;
            
            const name = searchName.value.trim();
            const team = searchTeam.value;
            
            let url = `/pilotos?page=${page}&per_page=${ITEMS_PER_PAGE}`;
            if (name) url += `&name=${encodeURIComponent(name)}`;
            if (team) url += `&team=${encodeURIComponent(team)}`;
            
            console.log('Cargando pilotos desde:', url);
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al cargar los pilotos');
            }
            
            const data = await response.json();
            console.log('Datos recibidos:', data);
            
            if (!data.items || !data.pagination) {
                throw new Error('Formato de respuesta inválido del servidor');
            }
            
            renderPilots(data.items);
            renderPagination(data.pagination);
        } catch (error) {
            console.error('Error en loadPilots:', error);
            showAlert('Error', error.message, 'danger');
        } finally {
            showLoading(false);
        }
    }

    // Función para renderizar la tabla de pilotos
    function renderPilots(pilots) {
        pilotsTable.innerHTML = '';
        
        if (pilots.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" class="text-center py-4 text-muted">
                    No se encontraron pilotos
                </td>
            `;
            pilotsTable.appendChild(row);
            return;
        }
        
        pilots.forEach(pilot => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
                <td><span class="badge bg-dark">${pilot.number}</span></td>
                <td>${pilot.name}</td>
                <td><span class="badge team-${pilot.team.replace(/\s+/g, '-')}">${pilot.team}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${pilot.id}">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${pilot.id}" data-name="${pilot.name}">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </td>
            `;
            pilotsTable.appendChild(row);
        });

        // Agregar event listeners a los botones de editar/eliminar
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editPilot(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => showDeleteModal(btn.dataset.id, btn.dataset.name));
        });
    }

    // Función para renderizar la paginación
    function renderPagination(paginationData) {
        if (!paginationData || !pagination) {
            console.error('Datos de paginación no válidos o elemento de paginación no encontrado');
            return;
        }
        
        const { page, total_pages, has_prev, has_next } = paginationData;
        totalPages = total_pages;
        
        // Si solo hay una página, no mostramos la paginación
        if (total_pages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Botón Anterior
        paginationHTML += `
            <li class="page-item ${!has_prev ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${page - 1}" ${!has_prev ? 'tabindex="-1" aria-disabled="true"' : ''}>
                    &laquo; Anterior
                </a>
            </li>
        `;
        
        // Números de página
        const maxVisiblePages = 5;
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);
        
        // Ajustar el rango si es necesario
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Página 1 y elipsis si es necesario
        if (startPage > 1) {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>`;
            if (startPage > 2) {
                paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>`;
            }
        }
        
        // Páginas visibles
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
        }
        
        // Elipsis y última página si es necesario
        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>`;
            }
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${total_pages}">${total_pages}</a>
                </li>`;
        }
        
        // Botón Siguiente
        paginationHTML += `
            <li class="page-item ${!has_next ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${page + 1}" ${!has_next ? 'tabindex="-1" aria-disabled="true"' : ''}>
                    Siguiente &raquo;
                </a>
            </li>
        `;
        
        // Actualizar el HTML de la paginación
        pagination.innerHTML = paginationHTML;
        
        // Agregar event listeners a los enlaces de paginación
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(link.dataset.page);
                if (!isNaN(page) && page >= 1 && page <= total_pages) {
                    loadPilots(page);
                }
            });
        });
    }

    // Función para manejar el envío del formulario
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!pilotForm.checkValidity()) {
            e.stopPropagation();
            pilotForm.classList.add('was-validated');
            return;
        }
        
        try {
            const formData = {
                name: document.getElementById('name').value.trim(),
                team: document.getElementById('team').value,
                number: parseInt(document.getElementById('number').value)
            };
            
            let url = '/pilotos';
            let method = 'POST';
            
            if (editingPilotId) {
                url = `/pilotos/${editingPilotId}`;
                method = 'PUT';
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error al guardar el piloto');
            }
            
            showAlert(
                '¡Éxito!', 
                editingPilotId ? 'Piloto actualizado correctamente' : 'Piloto agregado correctamente',
                'success'
            );
            
            resetForm();
            loadPilots(currentPage);
            
        } catch (error) {
            showAlert('Error', error.message, 'danger');
        }
    }

    // Función para editar un piloto
    async function editPilot(id) {
        try {
            showLoading(true);
            const response = await fetch(`/pilotos/${id}`);
            
            if (!response.ok) {
                throw new Error('Error al cargar los datos del piloto');
            }
            
            const pilot = await response.json();
            
            // Llenar el formulario con los datos del piloto
            document.getElementById('name').value = pilot.name;
            document.getElementById('team').value = pilot.team;
            document.getElementById('number').value = pilot.number;
            
            // Cambiar el texto del botón y título
            formButton.innerHTML = '<i class="bi bi-save"></i> Guardar Cambios';
            formTitle.textContent = 'Editar Piloto';
            
            // Mostrar botón de cancelar
            cancelEditBtn.style.display = 'block';
            
            // Guardar el ID del piloto que se está editando
            editingPilotId = pilot.id;
            
            // Desplazarse al formulario
            document.getElementById('pilot-form').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            showAlert('Error', error.message, 'danger');
        } finally {
            showLoading(false);
        }
    }

    // Función para cancelar la edición
    function cancelEdit() {
        resetForm();
    }

    // Función para mostrar el modal de confirmación de eliminación
    function showDeleteModal(id, name) {
        deletePilotId = id;
        document.getElementById('pilot-name').textContent = name;
        confirmModal.show();
    }

    // Función para confirmar la eliminación
    async function confirmDelete() {
        if (!deletePilotId) return;
        
        try {
            showLoading(true);
            const response = await fetch(`/pilotos/${deletePilotId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Error al eliminar el piloto');
            }
            
            showAlert('¡Éxito!', 'Piloto eliminado correctamente', 'success');
            confirmModal.hide();
            loadPilots(currentPage);
            
        } catch (error) {
            showAlert('Error', error.message, 'danger');
        } finally {
            showLoading(false);
            deletePilotId = null;
        }
    }

    // Función para resetear el formulario
    function resetForm() {
        pilotForm.reset();
        pilotForm.classList.remove('was-validated');
        document.getElementById('pilot-id').value = '';
        formButton.innerHTML = '<i class="bi bi-plus-circle"></i> Agregar Piloto';
        formTitle.textContent = 'Agregar Nuevo Piloto';
        cancelEditBtn.style.display = 'none';
        editingPilotId = null;
    }

    // Función para mostrar alertas
    function showAlert(title, message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        alertDiv.style.zIndex = '1100';
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            <strong>${title}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Eliminar la alerta después de 5 segundos
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 5000);
    }

    // Función para mostrar/ocultar el indicador de carga
    function showLoading(show) {
        if (show) {
            loadingIndicator.style.display = 'inline-block';
        } else {
            loadingIndicator.style.display = 'none';
        }
    }

    // Función para debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});