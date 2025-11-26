// estadisticas.js
document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const btnPilotos = document.getElementById('btn-pilotos');
    const btnEstadisticas = document.getElementById('btn-estadisticas');
    const seccionPilotos = document.querySelector('.container.mt-5');
    const seccionEstadisticas = document.getElementById('seccion-estadisticas');

    // Verificar si los elementos existen
    if (!btnPilotos || !btnEstadisticas || !seccionPilotos || !seccionEstadisticas) {
        console.error('No se encontraron todos los elementos necesarios');
        return;
    }

    // Event listeners para la navegación
    btnPilotos.addEventListener('click', function (e) {
        e.preventDefault();
        mostrarSeccion('pilotos');
    });

    btnEstadisticas.addEventListener('click', function (e) {
        e.preventDefault();
        mostrarSeccion('estadisticas');
        cargarEstadisticas();
    });

    // Función para cambiar entre secciones
    function mostrarSeccion(seccion) {
        if (seccion === 'pilotos') {
            seccionPilotos.style.display = 'block';
            seccionEstadisticas.style.display = 'none';
            btnPilotos.classList.add('active');
            btnEstadisticas.classList.remove('active');
        } else {
            seccionPilotos.style.display = 'none';
            seccionEstadisticas.style.display = 'block';
            btnPilotos.classList.remove('active');
            btnEstadisticas.classList.add('active');
        }
    }

    // Función para cargar las estadísticas
    async function cargarEstadisticas() {
        try {
            mostrarLoading(true);
            const response = await fetch('/estadisticas');

            if (!response.ok) {
                throw new Error('Error al cargar las estadísticas');
            }

            const data = await response.json();
            mostrarEstadisticasGenerales(data);
            mostrarEstadisticasEquipos(data.equipos);

        } catch (error) {
            console.error('Error:', error);
            mostrarError('Ocurrió un error al cargar las estadísticas');
        } finally {
            mostrarLoading(false);
        }
    }

    // Función para mostrar las estadísticas generales
    function mostrarEstadisticasGenerales(data) {
        const contenedor = document.getElementById('estadisticas-generales');
        if (!contenedor) return;

        const stats = data.estadisticas || {};

        contenedor.innerHTML = `
            <div class="col-md-3 mb-3">
                <div class="card bg-primary text-white h-100">
                    <div class="card-body text-center">
                        <h5 class="card-title">Total de Pilotos</h5>
                        <h2 class="display-4">${data.total_pilotos || 0}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card bg-success text-white h-100">
                    <div class="card-body text-center">
                        <h5 class="card-title">Número más alto</h5>
                        <h2 class="display-4">${stats.numero_maximo || 0}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card bg-info text-white h-100">
                    <div class="card-body text-center">
                        <h5 class="card-title">Número más bajo</h5>
                        <h2 class="display-4">${stats.numero_minimo || 0}</h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card bg-warning text-dark h-100">
                    <div class="card-body text-center">
                        <h5 class="card-title">Promedio</h5>
                        <h2 class="display-4">${stats.promedio_numeros ? stats.promedio_numeros.toFixed(1) : '0.0'}</h2>
                    </div>
                </div>
            </div>
        `;
    }

    // Función para mostrar las estadísticas por equipo
    function mostrarEstadisticasEquipos(equipos) {
        const contenedor = document.getElementById('estadisticas-equipos');
        if (!contenedor) return;

        if (!equipos || Object.keys(equipos).length === 0) {
            contenedor.innerHTML = '<div class="col-12"><div class="alert alert-info">No hay datos de equipos disponibles</div></div>';
            return;
        }

        let html = '';
        for (const [equipo, datos] of Object.entries(equipos)) {
            html += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        <div class="card-header bg-light">
                            <h5 class="mb-0 text-center">${equipo}</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Pilotos:</strong> ${datos.cantidad || 0}</p>
                            <p><strong>Promedio de números:</strong> ${datos.promedio ? datos.promedio.toFixed(1) : '0.0'}</p>
                            <p class="mb-0"><strong>Números:</strong> ${datos.numeros ? datos.numeros.join(', ') : 'N/A'}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        contenedor.innerHTML = html;
    }

    // Función para mostrar/ocultar el indicador de carga
    function mostrarLoading(mostrar) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = mostrar ? 'inline-block' : 'none';
        }
    }

    // Función para mostrar mensajes de error
    function mostrarError(mensaje) {
        const contenedor = document.getElementById('estadisticas-generales');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">${mensaje}</div>
                </div>
            `;
        }
    }
    const btnVolverPilotos = document.getElementById('btn-volver-pilotos');

    // Luego, en la misma función, añade el event listener
    if (btnVolverPilotos) {
        btnVolverPilotos.addEventListener('click', function (e) {
            e.preventDefault();
            mostrarSeccion('pilotos');
        });
    }
    // Inicializar con la sección de pilotos visible
    mostrarSeccion('pilotos');
});