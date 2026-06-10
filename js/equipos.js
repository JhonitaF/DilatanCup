document.addEventListener("DOMContentLoaded", async () => {
    // 1. Definir los mapeos de casillas según el tamaño del torneo
    const casillasOctavos = [
        "c0-e1", "c0-e2", "c0-e3", "c0-e4", "c0-e5", "c0-e6", "c0-e7", "c0-e8",
        "c0-e9", "c0-e10", "c0-e11", "c0-e12", "c0-e13", "c0-e14", "c0-e15", "c0-e16"
    ];
    
    const casillasCuartos = ["c1-e1", "c1-e2", "c1-e3", "c1-e4", "c1-e5", "c1-e6", "c1-e7", "c1-e8"];
    const casillasFasesSiguientes = ["c2-e1", "c2-e2", "c2-e3", "c2-e4", "c3-e1", "c3-e2", "ganador-torneo"];

    try {
        // 2. Traer todos los equipos inscritos de Supabase
        const { data: listaEquipos, error: errorEquipos } = await supabaseClient
            .from('equipos')
            .select('nombre_equipo')
            .order('fecha_registro', { ascending: true });

        if (errorEquipos) throw errorEquipos;

        const totalInscritos = listaEquipos.length;
        let listaCasillasIniciales = [];

        // 3. DETECTAR EL TAMAÑO AUTOMÁTICAMENTE
        // Si hay más de 8 equipos, activamos Octavos de Final y reacomodamos la vista
        if (totalInscritos > 8) {
            listaCasillasIniciales = casillasOctavos;
            mostrarColumnaOctavos(true); // Función para mostrar la fila de 16 en el HTML si existiera
        } else {
            listaCasillasIniciales = casillasCuartos;
            mostrarColumnaOctavos(false); // Mantener oculto u omitido Octavos
        }

        // 4. Inicializar todas las casillas del torneo en modo espera
        const todasLasCasillas = [...casillasOctavos, ...casillasCuartos, ...casillasFasesSiguientes];
        todasLasCasillas.forEach(id => {
            const casilla = document.getElementById(id);
            if (casilla) {
                if (id === "ganador-torneo") {
                    casilla.innerText = "¡Esperando Ganador!";
                } else if (id.startsWith("c3-")) {
                    casilla.innerText = id === "c3-e1" ? "Finalista 1" : "Finalista 2";
                    casilla.classList.add("vacio");
                } else if (id.startsWith("c2-")) {
                    casilla.innerText = "Por determinar";
                    casilla.classList.add("vacio");
                } else {
                    casilla.innerText = "Esperando rival...";
                    casilla.classList.add("vacio");
                }
            }
        });

        // 5. Inyectar los equipos inscritos en la ronda inicial correspondiente (Octavos o Cuartos)
        listaEquipos.forEach((equipo, index) => {
            if (index < listaCasillasIniciales.length) {
                const casilla = document.getElementById(listaCasillasIniciales[index]);
                if (casilla) {
                    casilla.innerText = equipo.nombre_equipo;
                    casilla.classList.remove("vacio");
                }
            }
        });

        // 6. Recuperar los avances de las partidas guardadas en días previos
        const { data: estadoBrackets, error: errorBrackets } = await supabaseClient
            .from('brackets')
            .select('*');

        if (errorBrackets) throw errorBrackets;

        if (estadoBrackets && estadoBrackets.length > 0) {
            estadoBrackets.forEach(registro => {
                const casilla = document.getElementById(registro.casilla_id);
                if (casilla && registro.nombre_equipo) {
                    casilla.innerText = registro.nombre_equipo;
                    casilla.classList.remove("vacio");
                    if (registro.casilla_id === "ganador-torneo") {
                        casilla.classList.add("animar-ganador");
                    }
                }
            });
        }

    } catch (error) {
        console.error("Error al sincronizar el bracket adaptativo:", error.message);
    }
});

// Controla visualmente si se expande la sección de Octavos en la interfaz
function mostrarColumnaOctavos(activar) {
    const columnaOctavos = document.querySelector('.ronda.octavos-final');
    if (columnaOctavos) {
        if (activar) {
            columnaOctavos.style.display = "flex";
        } else {
            columnaOctavos.style.display = "none";
        }
    }
}

// Función para avanzar equipos a la siguiente ronda
async function avanzarEquipo(idOrigen, idDestino) {
    const nombre = document.getElementById(idOrigen).innerText;
    const destino = document.getElementById(idDestino);
    
    if (!nombre || nombre === "Esperando rival..." || nombre === "Por determinar" || nombre === "Finalista 1" || nombre === "Finalista 2") {
        return; 
    }

    destino.innerText = nombre;
    destino.classList.remove('vacio');

    try {
        const { error } = await supabaseClient
            .from('brackets')
            .upsert({ casilla_id: idDestino, nombre_equipo: nombre });

        if (error) throw error;
    } catch (error) {
        alert("No se pudo guardar el avance: " + error.message);
    }
}

// Función para coronar al campeón
async function proclamarCampeon(idFinalista) {
    const nombre = document.getElementById(idFinalista).innerText;
    const podio = document.getElementById('ganador-torneo');
    
    if (!nombre || nombre === "Finalista 1" || nombre === "Finalista 2" || nombre === "Por determinar" || nombre === "Esperando rival...") {
        return;
    }

    podio.innerText = nombre;
    podio.classList.add('animar-ganador');

    try {
        const { error } = await supabaseClient
            .from('brackets')
            .upsert({ casilla_id: 'ganador-torneo', nombre_equipo: nombre });

        if (error) throw error;
        alert(`🏆 ¡El campeón "${nombre}" ha sido guardado permanentemente!`);
    } catch (error) {
        alert("Error al guardar el campeón: " + error.message);
    }
}