document.addEventListener('DOMContentLoaded', () => {
    const pilotsTableBody = document.getElementById('pilots-table-body');
    const pilotForm = document.getElementById('pilot-form');
    const formButton = document.getElementById('form-button');
    const pilotIdInput = document.getElementById('pilot-id');
    const nameInput = document.getElementById('name');
    const teamInput = document.getElementById('team');
    const numberInput = document.getElementById('number');
    const BASE_URL = 'http://127.0.0.1:5000/pilotos';

    const fetchPilots = async () => {
        try {
            const response = await fetch(BASE_URL);
            const pilots = await response.json();
            pilotsTableBody.innerHTML = ''; // Limpiar la tabla
            pilots.forEach(pilot => {
                const row = document.createElement('tr');
                row.innerHTML = `
                            <td>${pilot.id}</td>
                            <td>${pilot.name}</td>
                            <td>${pilot.team}</td>
                            <td>${pilot.number}</td>
                            <td class="actions-cell">
                                <button class="edit" onclick="editPilot(${pilot.id})">Editar</button>
                                <button class="delete" onclick="deletePilot(${pilot.id})">Eliminar</button>
                            </td>
                        `;
                pilotsTableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error al obtener los pilotos:', error);
        }
    };

    const addPilot = async (pilotData) => {
        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pilotData)
            });
            if (response.ok) {
                pilotForm.reset();
                fetchPilots();
            }
        } catch (error) {
            console.error('Error al agregar el piloto:', error);
        }
    };

    const updatePilot = async (id, pilotData) => {
        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pilotData)
            });
            if (response.ok) {
                pilotIdInput.value = ''; // Limpiar el id de edición
                formButton.textContent = 'Agregar Piloto'; // Restaurar texto del botón
                pilotForm.reset();
                fetchPilots(); // Recargar la tabla
            }
        } catch (error) {
            console.error('Error al actualizar el piloto:', error);
        }
    };

    pilotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = nameInput.value;
        const team = teamInput.value;
        const number = numberInput.value;

        const pilotData = {
            name,
            team,
            number: parseInt(number)
        };

        const pilotId = pilotIdInput.value;

        if (pilotId) {
            // Si hay un ID, es una actualización (PUT)
            updatePilot(pilotId, pilotData);
        } else {
            // Si no hay ID, es un nuevo piloto (POST)
            addPilot(pilotData);
        }
    });

    window.deletePilot = async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchPilots();
            }
        } catch (error) {
            console.error('Error al eliminar el piloto:', error);
        }
    };

    window.editPilot = async (id) => {
        try {
            const response = await fetch(`${BASE_URL}/${id}`);
            const pilot = await response.json();

            // Llenar el formulario con los datos del piloto
            nameInput.value = pilot.name;
            teamInput.value = pilot.team;
            numberInput.value = pilot.number;
            pilotIdInput.value = pilot.id; // Guardar el ID en un campo oculto

            // Cambiar el texto del botón para indicar que es una actualización
            formButton.textContent = 'Actualizar Piloto';
        } catch (error) {
            console.error('Error al obtener los datos para editar:', error);
        }
    };

    fetchPilots();
});