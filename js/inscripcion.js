document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================================================
    // DETECTOR ULTRA REFORZADO DE INSTANCIA DE SUPABASE
    // ==========================================================================
    let supabaseInstancia = null;
    if (typeof supabase !== 'undefined') {
    supabaseInstancia = supabase;
    } else if (typeof supabaseClient !== 'undefined') {
        supabaseInstancia = supabaseClient;
    }
    } else if (typeof window.supabaseClient !== 'undefined') {
        supabaseInstancia = window.supabaseClient;
    } else if (typeof window.supabase !== 'undefined') {
        supabaseInstancia = window.supabase;
    }

    if (!supabaseInstancia) {
        console.error("⚠️ CRÍTICO: No se detectó ninguna variable global de Supabase.");
        alert("⚠️ ERROR CRÍTICO DEL SISTEMA: La conexión con Supabase no fue inicializada.");
        return; 
    }

    // VARIABLES DEL MODAL Y CAPAS INTERFACES
    const modal = document.getElementById("modal-reglas");
    const btnAceptarReglas = document.getElementById("btn-aceptar-reglas");
    const formulario = document.getElementById("form-torneo");
    
    // INPUTS DE ARCHIVOS
    const inputLogo = document.getElementById("logo-equipo-file");
    const inputDocumento = document.getElementById("documentacion-file");
    const inputArchivo = document.getElementById("comprobante-file");

    // CONTENEDORES DE TEXTO DE ARCHIVOS
    const contenedorNombreLogo = document.getElementById("nombre-logo");
    const contenedorNombreDoc = document.getElementById("nombre-documento");
    const contenedorNombreArchivo = document.getElementById("nombre-archivo");

    // CONTENEDORES DE VISTA PREVIA
    const contenedorPreviewLogo = document.getElementById("logo-preview-contenedor");
    const imgLogoPrevia = document.getElementById("img-logo-previa");
    const contenedorPreviewDoc = document.getElementById("doc-preview-contenedor");
    const renderPreviewDoc = document.getElementById("doc-preview-render");
    const contenedorPreview = document.getElementById("vista-previa-contenedor");
    const imgVistaPrevia = document.getElementById("img-vista-previa");

    // ==========================================================================
    // 0. CONTROL DE ACCESO (MODAL DIRECTO)
    // ==========================================================================
    if (btnAceptarReglas && modal && formulario) {
        btnAceptarReglas.addEventListener("click", () => {
            modal.style.display = "none";       
            formulario.style.display = "block"; 
        });
    }

    // ==========================================================================
    // 1. MANEJADORES DE VISTAS PREVIAS (LOGO, DOCS, COMPROBANTE)
    // ==========================================================================
    if (inputLogo) {
        inputLogo.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (contenedorNombreLogo) contenedorNombreLogo.textContent = `🛡️ Logo: ${file.name}`;
                const lector = new FileReader();
                lector.onload = (ev) => {
                    if (imgLogoPrevia && contenedorPreviewLogo) {
                        imgLogoPrevia.src = ev.target.result;
                        contenedorPreviewLogo.style.display = "block";
                    }
                };
                lector.readAsDataURL(file);
            }
        });
    }

    if (inputArchivo) {
        inputArchivo.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (contenedorNombreArchivo) contenedorNombreArchivo.textContent = `📸 Comprobante: ${file.name}`;
                const lector = new FileReader();
                lector.onload = (ev) => {
                    if (imgVistaPrevia && contenedorPreview) {
                        imgVistaPrevia.src = ev.target.result;
                        contenedorPreview.style.display = "block";
                    }
                };
                lector.readAsDataURL(file);
            }
        });
    }

    if (inputDocumento) {
        inputDocumento.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (contenedorNombreDoc) contenedorNombreDoc.textContent = `📂 Documento: ${file.name}`;
                const extension = file.name.split('.').pop().toLowerCase();

                if (!renderPreviewDoc || !contenedorPreviewDoc) return;

                if (file.type.startsWith("image/")) {
                    const lector = new FileReader();
                    lector.onload = (ev) => {
                        renderPreviewDoc.innerHTML = `<img src="${ev.target.result}" style="width:100%; max-height:250px; object-fit:contain; border-radius:4px;">`;
                        contenedorPreviewDoc.style.display = "block";
                    };
                    lector.readAsDataURL(file);
                } else {
                    let icono = (extension === "pdf") ? "📕" : "📦";
                    renderPreviewDoc.innerHTML = `
                        <div style="padding:1rem; background:rgba(255,255,255,0.05); text-align:center; border-radius:4px; border: 1px dashed rgba(59, 130, 246, 0.3);">
                            <span style="font-size:2rem;">${icono}</span>
                            <p style="margin:0.5rem 0 0; font-size:0.9rem; color:#fff; word-break: break-all;">${file.name}</p>
                        </div>`;
                    contenedorPreviewDoc.style.display = "block";
                }
            }
        });
    }

    // ==========================================================================
    // 2. FUNCIÓN AUXILIAR PARA LA SUBIDA DE ARCHIVOS A COMPONENTES STORAGE
    // ==========================================================================
    async function subirArchivoAlBucket(bucketName, file, prefixName) {
        const ext = file.name.split('.').pop().toLowerCase();
        const hashUnico = Math.random().toString(36).substring(2, 7);
        // Limpiamos el prefijo para evitar espacios o caracteres que rompan la URL del Storage
        const prefixLimpio = prefixName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const nombreArchivoFinal = `${prefixLimpio}_${Date.now()}_${hashUnico}.${ext}`;

        const { data, error } = await supabaseInstancia.storage
            .from(bucketName)
            .upload(nombreArchivoFinal, file, { cacheControl: '3600', upsert: false });

        if (error) throw new Error(`Error subiendo al almacén de [${bucketName}]: ${error.message}`);

        const { data: publicUrlData } = supabaseInstancia.storage
            .from(bucketName)
            .getPublicUrl(nombreArchivoFinal);

        return publicUrlData.publicUrl;
    }

    // ==========================================================================
    // 3. CAPTURA, PROCESAMIENTO Y ENVÍO ESTRUCTURADO HACIA LA NUEVA TABLA
    // ==========================================================================
    if (formulario) {
        formulario.addEventListener("submit", async (e) => {
            e.preventDefault();

            const btnSubmit = formulario.querySelector(".btn-enviar-formulario");
            const textoOriginal = btnSubmit.textContent;
            
            btnSubmit.disabled = true;
            btnSubmit.textContent = "💥 TRANSMITIENDO DATOS AL BÚNKER...";

            try {
                const fileLogo = inputLogo ? inputLogo.files[0] : null;
                const fileDoc = inputDocumento ? inputDocumento.files[0] : null;
                const filePago = inputArchivo ? inputArchivo.files[0] : null;

                if (!fileLogo || !fileDoc || !filePago) {
                    throw new Error("Es obligatorio adjuntar el Logo del equipo, la Documentación legal y el Comprobante de pago.");
                }

                // 1. OBTENCIÓN DE IDENTIFICACIÓN DEL EQUIPO
                const rawNombreEq = document.getElementById("nombre-equipo").value.trim();
                const tagEquipo = document.getElementById("tag-equipo").value.trim();
                const cleanName = rawNombreEq.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

                // 2. OBTENCIÓN DEL CAPITÁN / JUGADOR #1
                const capitan = {
                    nombre: document.getElementById("nombre-capitan").value.trim(),
                    edad: parseInt(document.getElementById("edad-capitan").value) || 0,
                    ci: document.getElementById("ci-capitan").value.trim(),
                    tel: document.getElementById("tel-capitan").value.trim(),
                    tag: document.getElementById("nametag-capitan").value.trim(),
                    steam: document.getElementById("steam-capitan").value.trim()
                };

                // 3. OBTENCIÓN DE JUGADORES (Por orden indexado del querySelectorAll)
                const listaBloquesJugadores = formulario.querySelectorAll(".bloque-lista-j");
                
                const extraerJugadorSeguro = (bloque) => {
                    if (!bloque) return null;
                    const inputNombre = bloque.querySelector(".j-nombre");
                    const inputEdad = bloque.querySelector(".j-edad");
                    const inputCi = bloque.querySelector(".j-ci");
                    const inputTel = bloque.querySelector(".j-telefono");
                    const inputTag = bloque.querySelector(".j-nametag");
                    const inputSteam = bloque.querySelector(".j-steam");

                    if (!inputNombre || !inputEdad || !inputCi || !inputTel || !inputTag || !inputSteam) return null;

                    return {
                        nombre: inputNombre.value.trim(),
                        edad: parseInt(inputEdad.value) || 0,
                        ci: inputCi.value.trim(),
                        tel: inputTel.value.trim(),
                        tag: inputTag.value.trim(),
                        steam: inputSteam.value.trim()
                    };
                };

                // Asignación correcta de índices del DOM
                const j2 = extraerJugadorSeguro(listaBloquesJugadores[0]); // Jugador #2
                const j3 = extraerJugadorSeguro(listaBloquesJugadores[1]); // Jugador #3
                const j4 = extraerJugadorSeguro(listaBloquesJugadores[2]); // Jugador #4

                if (!j2 || !j3 || !j4) {
                    throw new Error("Por favor rellena todos los campos obligatorios de los Jugadores #2, #3 y #4.");
                }

                // 4. JUGADORES SUPLENTES OPCIONALES
                const extraerSuplenteSeguro = (bloque) => {
                    if (!bloque) return { nombre: null, edad: null, ci: null, tel: null, tag: null, steam: null };
                    
                    const inputNombre = bloque.querySelector(".j-nombre");
                    const nombreVal = inputNombre ? inputNombre.value.trim() : "";
                    
                    if (!nombreVal) return { nombre: null, edad: null, ci: null, tel: null, tag: null, steam: null };

                    const inputEdad = bloque.querySelector(".j-edad");
                    const inputCi = bloque.querySelector(".j-ci");
                    const inputTel = bloque.querySelector(".j-telefono");
                    const inputTag = bloque.querySelector(".j-nametag");
                    const inputSteam = bloque.querySelector(".j-steam");

                    return {
                        nombre: nombreVal,
                        edad: inputEdad ? (parseInt(inputEdad.value) || null) : null,
                        ci: inputCi ? (inputCi.value.trim() || null) : null,
                        tel: inputTel ? (inputTel.value.trim() || null) : null,
                        tag: inputTag ? (inputTag.value.trim() || null) : null,
                        steam: inputSteam ? (inputSteam.value.trim() || null) : null
                    };
                };

                const j5 = extraerSuplenteSeguro(listaBloquesJugadores[3]); // Jugador #5
                const j6 = extraerSuplenteSeguro(listaBloquesJugadores[4]); // Jugador #6

                // Subida de archivos multimedia a Supabase Storage (Asegúrate de tener creados estos 3 buckets públicos)
                const uploadLogoUrl = await subirArchivoAlBucket('logos', fileLogo, `${cleanName}_logo`);
                const uploadDocUrl = await subirArchivoAlBucket('documentos', fileDoc, `${cleanName}_ci`);
                const uploadPagoUrl = await subirArchivoAlBucket('comprobantes', filePago, `${cleanName}_pago`);

                // Registro final e inserción estructurada en la base de datos (Tabla: inscripciones)
                const { error: dbError } = await supabaseInstancia
                    .from('inscripciones')
                    .insert([{
                        nombre_equipo: rawNombreEq,
                        tag_equipo: tagEquipo,
                        logo_url: uploadLogoUrl,
                        
                        capitan_nombre: capitan.nombre,
                        capitan_edad: capitan.edad,
                        capitan_ci: capitan.ci,
                        capitan_telefono: capitan.tel,
                        capitan_nametag: capitan.tag,
                        capitan_steam: capitan.steam,

                        j2_nombre: j2.nombre, j2_edad: j2.edad, j2_ci: j2.ci, j2_telefono: j2.tel, j2_nametag: j2.tag, j2_steam: j2.steam,
                        j3_nombre: j3.nombre, j3_edad: j3.edad, j3_ci: j3.ci, j3_telefono: j3.tel, j3_nametag: j3.tag, j3_steam: j3.steam,
                        j4_nombre: j4.nombre, j4_edad: j4.edad, j4_ci: j4.ci, j4_telefono: j4.tel, j4_nametag: j4.tag, j4_steam: j4.steam,
                        
                        j5_nombre: j5.nombre, j5_edad: j5.edad, j5_ci: j5.ci, j5_telefono: j5.tel, j5_nametag: j5.tag, j5_steam: j5.steam,
                        j6_nombre: j6.nombre, j6_edad: j6.edad, j6_ci: j6.ci, j6_telefono: j6.tel, j6_nametag: j6.tag, j6_steam: j6.steam,

                        documentacion_url: uploadDocUrl,
                        comprobante_url: uploadPagoUrl
                    }]);

                if (dbError) throw dbError;

                alert(`🎮 ¡Inscripción Completada! El equipo "${rawNombreEq}" ha sido registrado exitosamente en el torneo.`);
                
                // Reseteo total de interfaces y elementos de control
                formulario.reset();
                if (contenedorNombreArchivo) contenedorNombreArchivo.textContent = "";
                if (contenedorNombreLogo) contenedorNombreLogo.textContent = "";
                if (contenedorNombreDoc) contenedorNombreDoc.textContent = "";
                
                if (contenedorPreview) contenedorPreview.style.display = "none";
                if (contenedorPreviewLogo) contenedorPreviewLogo.style.display = "none";
                if (contenedorPreviewDoc) contenedorPreviewDoc.style.display = "none";
                
                formulario.style.display = "none";
                if (modal) modal.style.display = "flex";

            } catch (error) {
                console.error("Fallo detectado en el proceso:", error);
                alert(`⚠️ ERROR DE TRÁMITE: ${error.message}`);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoOriginal;
            }
        });
    }
});
