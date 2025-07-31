// ===== VARIABLES GLOBALES =====
let allCharacters = [];
let selectedPlayer = null;
let selectedOpponent = null;
let currentFight = null;
let isFightInProgress = false;
let currentFightId = null; // ID de la pelea actual en la base de datos

// Mapeo de imágenes de personajes
const CHARACTER_IMAGES = {
    'Genji': '../images/Personajes/Genji.webp',
    'Hanzo': '../images/Personajes/Hanzo.webp',
    'Cass': '../images/Personajes/Cass.webp',
    'Reaper': '../images/Personajes/Reaper.webp',
    'Moira': '../images/Personajes/Moira.webp',
    'Sombra': '../images/Personajes/Sombra.webp'
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Inicializando Pelea 1 vs 1...');
    fight1vs1App.init();
});

// ===== APLICACIÓN PRINCIPAL =====
const fight1vs1App = {
    // Inicializar la aplicación
    async init() {
        console.log('🎮 Inicializando Pelea 1 vs 1...');
        
        // Verificar y crear token si es necesario
        const tokenOk = await this.checkAndCreateTestToken();
        if (!tokenOk) {
            console.error('❌ No se pudo obtener token de autenticación');
            this.showError('Error de autenticación. Redirigiendo al login...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }
        
        // Verificar autenticación
        if (!this.checkAuthentication()) {
            console.error('Usuario no autenticado');
            return;
        }
        
        this.loadCharacters();
        this.setupEventListeners();
    },

    // Verificar autenticación
    checkAuthentication() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('Verificando autenticación...');
        console.log('Token:', !!token);
        console.log('User:', user);
        
        if (!token || !user) {
            console.error('No hay token o usuario');
            this.showError('Debes iniciar sesión para acceder a las peleas');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return false;
        }
        
        console.log('Autenticación válida');
        return true;
    },

    // Verificar y crear token de prueba si es necesario
    async checkAndCreateTestToken() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('=== VERIFICACIÓN DE TOKEN ===');
        console.log('Token existe:', !!token);
        console.log('User existe:', !!user);
        
        if (!token || !user) {
            console.log('🔧 Creando token de prueba...');
            
            try {
                // Intentar crear un usuario de prueba
                const testUser = {
                    name: 'TestUser',
                    password: 'test123'
                };
                
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testUser)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Usuario de prueba creado:', data);
                    
                    // Intentar hacer login con el usuario de prueba
                    const loginResponse = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(testUser)
                    });
                    
                    if (loginResponse.ok) {
                        const loginData = await loginResponse.json();
                        localStorage.setItem('token', loginData.token);
                        localStorage.setItem('user', JSON.stringify(loginData.user));
                        console.log('✅ Login exitoso con usuario de prueba');
                        return true;
                    }
                }
            } catch (error) {
                console.error('❌ Error creando token de prueba:', error);
            }
            
            console.error('❌ No se pudo crear token de prueba');
            return false;
        }
        
        return true;
    },

    // Función helper para hacer llamadas autenticadas
    async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('=== DEBUG FETCH ===');
        console.log('URL:', url);
        console.log('Token disponible:', !!token);
        console.log('User:', user);
        console.log('Token completo:', token);
        
        if (!token) {
            console.error('❌ No hay token de autenticación');
            console.error('Redirigiendo al login...');
            this.showError('No hay token de autenticación. Redirigiendo al login...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            throw new Error('No hay token de autenticación');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        console.log('Headers:', headers);
        console.log('Body:', options.body);
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            return response;
        } catch (error) {
            console.error('Error en fetchWithAuth:', error);
            throw error;
        }
    },

    // Función de debug para verificar el estado
    async debugState() {
        console.log('=== DEBUG ESTADO ===');
        
        // Verificar autenticación
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('Token:', !!token);
        console.log('User:', user);
        console.log('Token completo:', token);
        
        // Verificar API
        try {
            const response = await fetch('/api/test');
            const data = await response.json();
            console.log('API Status:', data);
        } catch (error) {
            console.error('Error API:', error);
        }
        
        // Probar autenticación
        const authOk = await this.testAuth();
        console.log('Auth test result:', authOk);
        
        // Verificar personajes seleccionados
        console.log('Selected Player:', selectedPlayer);
        console.log('Selected Opponent:', selectedOpponent);
        console.log('Current Fight ID:', currentFightId);
        
        // Verificar botones de combate
        const attackBtn = document.getElementById('attack-btn');
        const specialBtn = document.getElementById('special-btn');
        const ultimateBtn = document.getElementById('ultimate-btn');
        
        console.log('Botones de combate:');
        console.log('- attack-btn:', !!attackBtn, attackBtn?.disabled);
        console.log('- special-btn:', !!specialBtn, specialBtn?.disabled);
        console.log('- ultimate-btn:', !!ultimateBtn, ultimateBtn?.disabled);
        
        // Verificar fase de combate
        const combatPhase = document.getElementById('combat-phase');
        console.log('Fase de combate visible:', !combatPhase?.classList.contains('hidden'));
        
        console.log('=== FIN DEBUG ===');
    },

    // Probar autenticación
    async testAuth() {
        console.log('🧪 Probando autenticación...');
        
        try {
            const response = await this.fetchWithAuth('/api/auth-test');
            const data = await response.json();
            console.log('✅ Test de autenticación exitoso:', data);
            return true;
        } catch (error) {
            console.error('❌ Test de autenticación falló:', error);
            return false;
        }
    },

    // Cargar personajes desde la API
    async loadCharacters() {
        try {
            const response = await this.fetchWithAuth('/api/personajes?page=1&limit=50');

            if (!response.ok) {
                throw new Error('Error al cargar personajes');
            }

            const data = await response.json();
            allCharacters = data.data;
            
            console.log(`📖 Cargados ${allCharacters.length} personajes`);
            this.renderCharacters();
            
        } catch (error) {
            console.error('Error cargando personajes:', error);
            this.showError('Error al cargar los personajes. Intenta recargar la página.');
        }
    },

    // Renderizar personajes en las grillas
    renderCharacters() {
        const playerGrid = document.getElementById('player-characters');
        const opponentGrid = document.getElementById('opponent-characters');
        
        // Limpiar grillas
        playerGrid.innerHTML = '';
        opponentGrid.innerHTML = '';
        
        // Mostrar todos los personajes para selección del jugador
        allCharacters.forEach(character => {
            const card = this.createCharacterCard(character);
            card.addEventListener('click', () => this.selectPlayer(character));
            playerGrid.appendChild(card);
        });
        
        // Mostrar mensaje inicial para oponentes
        opponentGrid.innerHTML = '<div class="opponent-placeholder">Selecciona tu personaje para ver los oponentes disponibles</div>';
    },

    // Crear tarjeta de personaje
    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        
        // Mapear nombres a archivos de imagen
        const imageMap = {
            'Genji': 'Genji.webp',
            'Hanzo': 'Hanzo.webp',
            'Cassidy': 'Cass.webp',
            'Cass': 'Cass.webp',
            'Reaper': 'Reaper.webp',
            'Moira': 'Moira.webp',
            'Sombra': 'Sombra.webp'
        };
        
        const imageName = imageMap[character.nombre] || 'default.webp';
        
        card.innerHTML = `
            <div class="character-avatar">
                <img src="../images/Personajes/${imageName}" alt="${character.nombre}" class="character-image">
            </div>
            <div class="character-info">
                <h3>${character.nombre}</h3>
                <p>Nivel: ${character.nivel}</p>
                <p>Tipo: ${character.tipo}</p>
            </div>
        `;
        
        return card;
    },

    // Seleccionar personaje del jugador
    selectPlayer(character) {
        // Limpiar selecciones anteriores
        document.querySelectorAll('.character-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar nuevo personaje
        const card = document.querySelector(`[data-character-id="${character.id}"]`);
        card.classList.add('selected');
        
        selectedPlayer = character;
        this.updateOpponents();
        this.updateStartButton();
    },

    // Actualizar oponentes disponibles
    updateOpponents() {
        const opponentGrid = document.getElementById('opponent-characters');
        opponentGrid.innerHTML = '';
        
        if (!selectedPlayer) return;
        
        // Filtrar oponentes (solo personajes del tipo opuesto)
        const opponents = allCharacters.filter(char => 
            char.id !== selectedPlayer.id && 
            char.tipo !== selectedPlayer.tipo
        );
        
        opponents.forEach(character => {
            const card = this.createCharacterCard(character);
            card.addEventListener('click', () => this.selectOpponent(character));
            opponentGrid.appendChild(card);
        });
    },

    // Seleccionar oponente
    selectOpponent(character) {
        // Limpiar selecciones anteriores de oponentes
        document.querySelectorAll('#opponent-characters .character-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar nuevo oponente
        const card = document.querySelector(`#opponent-characters [data-character-id="${character.id}"]`);
        card.classList.add('selected');
        
        selectedOpponent = character;
        this.updateStartButton();
    },

    // Actualizar botón de inicio
    updateStartButton() {
        const startBtn = document.getElementById('start-fight-btn');
        startBtn.disabled = !selectedPlayer || !selectedOpponent;
        
        if (selectedPlayer && selectedOpponent) {
            startBtn.textContent = '⚔️ Iniciar Pelea';
        } else {
            startBtn.textContent = 'Selecciona ambos personajes';
        }
    },

    // Configurar event listeners
    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Botón de inicio de pelea
        const startBtn = document.getElementById('start-fight-btn');
        console.log('Botón start-fight-btn encontrado:', !!startBtn);
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                console.log('🖱️ Clic en botón iniciar pelea');
                this.showConfirmModal();
            });
        }
        
        // Botones de modal
        const confirmBtn = document.getElementById('confirm-fight-btn');
        console.log('Botón confirm-fight-btn encontrado:', !!confirmBtn);
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                console.log('🖱️ Clic en botón confirmar pelea');
                this.confirmFight();
            });
        }
        
        const cancelBtn = document.getElementById('cancel-fight-btn');
        console.log('Botón cancel-fight-btn encontrado:', !!cancelBtn);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                console.log('🖱️ Clic en botón cancelar pelea');
                this.cancelFight();
            });
        }
        
        // Botón nueva pelea
        const newFightBtn = document.getElementById('new-fight-btn');
        console.log('Botón new-fight-btn encontrado:', !!newFightBtn);
        if (newFightBtn) {
            newFightBtn.addEventListener('click', () => {
                console.log('🖱️ Clic en botón nueva pelea');
                this.newFight();
            });
        }
        
        console.log('✅ Event listeners básicos configurados');
    },

    // Configurar event listeners de combate (se llama después de mostrar la fase de combate)
    setupCombatEventListeners() {
        console.log('⚔️ Configurando event listeners de combate...');
        console.log('🔍 Buscando botones en el DOM...');
        
        // Verificar que estamos en la fase de combate
        const combatPhase = document.getElementById('combat-phase');
        console.log('Fase de combate visible:', !combatPhase.classList.contains('hidden'));
        
        // Esperar un poco para asegurar que el DOM esté listo
        setTimeout(() => {
            // Botones de acción
            const attackBtn = document.getElementById('attack-btn');
            console.log('Botón attack-btn encontrado:', !!attackBtn);
            console.log('Botón attack-btn:', attackBtn);
            if (attackBtn) {
                // Remover event listeners anteriores para evitar duplicados
                attackBtn.removeEventListener('click', this.handleAttackClick);
                attackBtn.addEventListener('click', this.handleAttackClick.bind(this));
                console.log('✅ Event listener agregado a attack-btn');
            } else {
                console.error('❌ No se encontró el botón attack-btn');
                // Listar todos los botones disponibles
                const allButtons = document.querySelectorAll('button');
                console.log('Botones disponibles:', Array.from(allButtons).map(btn => btn.id));
            }
            
            const specialBtn = document.getElementById('special-btn');
            console.log('Botón special-btn encontrado:', !!specialBtn);
            console.log('Botón special-btn:', specialBtn);
            if (specialBtn) {
                // Remover event listeners anteriores para evitar duplicados
                specialBtn.removeEventListener('click', this.handleSpecialClick);
                specialBtn.addEventListener('click', this.handleSpecialClick.bind(this));
                console.log('✅ Event listener agregado a special-btn');
            } else {
                console.error('❌ No se encontró el botón special-btn');
            }
            
            const ultimateBtn = document.getElementById('ultimate-btn');
            console.log('Botón ultimate-btn encontrado:', !!ultimateBtn);
            console.log('Botón ultimate-btn:', ultimateBtn);
            if (ultimateBtn) {
                // Remover event listeners anteriores para evitar duplicados
                ultimateBtn.removeEventListener('click', this.handleUltimateClick);
                ultimateBtn.addEventListener('click', this.handleUltimateClick.bind(this));
                console.log('✅ Event listener agregado a ultimate-btn');
            } else {
                console.error('❌ No se encontró el botón ultimate-btn');
            }
            
            console.log('✅ Event listeners de combate configurados');
            
            // Verificar que los botones están habilitados
            setTimeout(() => {
                console.log('🔍 Verificación final de botones:');
                console.log('attack-btn disabled:', attackBtn?.disabled);
                console.log('special-btn disabled:', specialBtn?.disabled);
                console.log('ultimate-btn disabled:', ultimateBtn?.disabled);
            }, 100);
        }, 100);
    },

    // Handlers para los botones de combate
    handleAttackClick() {
        console.log('🖱️ Clic en botón atacar');
        this.performAction('basico');
    },

    handleSpecialClick() {
        console.log('🖱️ Clic en botón habilidad especial');
        this.performAction('especial');
    },

    handleUltimateClick() {
        console.log('🖱️ Clic en botón ultimate');
        this.performAction('ultimate');
    },

    // Mostrar modal de confirmación
    showConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        const content = document.getElementById('fight-summary');
        
        content.innerHTML = `
            <div style="text-align: center;">
                <h3>Confirmar Pelea</h3>
                <p>¿Estás listo para luchar?</p>
                <div style="display: flex; justify-content: space-around; margin: 1rem 0;">
                    <div>
                        <strong>${selectedPlayer.nombre}</strong><br>
                        <small>Nivel ${selectedPlayer.nivel}</small>
                    </div>
                    <div style="font-size: 1.5rem; color: var(--btn-primary);">VS</div>
                    <div>
                        <strong>${selectedOpponent.nombre}</strong><br>
                        <small>Nivel ${selectedOpponent.nivel}</small>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    },

    // Cancelar pelea
    cancelFight() {
        document.getElementById('confirm-modal').classList.add('hidden');
    },

    // Confirmar pelea
    async confirmFight() {
        try {
            this.showLoading('Iniciando pelea...');
            
            // Crear nueva pelea en la base de datos
            const response = await this.fetchWithAuth('/api/fights', {
                method: 'POST',
                body: JSON.stringify({
                    id1: selectedPlayer.id,
                    id2: selectedOpponent.id,
                    atacanteId: selectedPlayer.id,
                    defensorId: selectedOpponent.id,
                    tipoAtaque: 'basico'
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al iniciar la pelea');
            }
            
            const fightData = await response.json();
            currentFightId = fightData.fightId;
            
            this.hideLoading();
            this.startCombat();
            
        } catch (error) {
            this.hideLoading();
            console.error('Error iniciando pelea:', error);
            this.showError('Error al iniciar la pelea: ' + error.message);
        }
    },

    // Iniciar combate
    startCombat() {
        console.log('🎮 Iniciando combate...');
        console.log('Estado anterior isFightInProgress:', isFightInProgress);
        
        isFightInProgress = true;
        
        console.log('✅ Estado actual isFightInProgress:', isFightInProgress);
        console.log('Selected Player:', selectedPlayer);
        console.log('Selected Opponent:', selectedOpponent);
        
        // Ocultar modal de confirmación
        document.getElementById('confirm-modal').classList.add('hidden');
        
        // Ocultar fase de selección y mostrar fase de combate
        document.getElementById('selection-phase').classList.add('hidden');
        document.getElementById('combat-phase').classList.remove('hidden');
        
        console.log('🔄 Configurando área de combate...');
        this.setupCombatArea();
        console.log('✅ Combate iniciado correctamente');
        
        // Configurar event listeners de combate después de mostrar la fase
        this.setupCombatEventListeners();
    },

         // Configurar área de combate
     setupCombatArea() {
         // Configurar personajes en el área de combate
         const playerArea = document.getElementById('player-combat');
         const opponentArea = document.getElementById('opponent-combat');
         
         if (playerArea && opponentArea) {
             // Mapear nombres a archivos de imagen para el área de combate
             const combatImageMap = {
                 'Genji': 'Genji.webp',
                 'Hanzo': 'Hanzo.webp',
                 'Cassidy': 'Cass.webp',
                 'Cass': 'Cass.webp',
                 'Reaper': 'Reaper.webp',
                 'Moira': 'Moira.webp',
                 'Sombra': 'Sombra.webp'
             };
             
             const playerImage = combatImageMap[selectedPlayer.nombre] || 'default.webp';
             const opponentImage = combatImageMap[selectedOpponent.nombre] || 'default.webp';
             
             // Calcular vida máxima
             const playerMaxHealth = 100 + (selectedPlayer.nivel - 1) * 5;
             const opponentMaxHealth = 100 + (selectedOpponent.nivel - 1) * 5;
             
             playerArea.innerHTML = `
                 <div class="combat-character">
                     <img src="../images/Personajes/${playerImage}" alt="${selectedPlayer.nombre}" class="combat-image">
                     <div class="combat-info">
                         <h3>${selectedPlayer.nombre}</h3>
                         <div class="health-bar">
                             <div class="health-fill" style="width: 100%"></div>
                         </div>
                         <span id="player-hp">${playerMaxHealth}</span> HP
                     </div>
                 </div>
             `;
             
             opponentArea.innerHTML = `
                 <div class="combat-character">
                     <img src="../images/Personajes/${opponentImage}" alt="${selectedOpponent.nombre}" class="combat-image">
                     <div class="combat-info">
                         <h3>${selectedOpponent.nombre}</h3>
                         <div class="health-bar">
                             <div class="health-fill" style="width: 100%"></div>
                         </div>
                         <span id="opponent-hp">${opponentMaxHealth}</span> HP
                     </div>
                 </div>
             `;
         }
         
         // Limpiar log de combate
         document.getElementById('combat-messages').innerHTML = '<div class="log-message">La batalla ha comenzado...</div>';
         
         // Actualizar botones con información de ultimate
         this.updateUltimateButtons();
     },

    // Realizar acción de combate
    async performAction(action) {
        console.log('🎯 Realizando acción:', action);
        console.log('🔍 Estado de la pelea:');
        console.log('- isFightInProgress:', isFightInProgress);
        console.log('- currentFightId:', currentFightId);
        console.log('- selectedPlayer:', selectedPlayer);
        console.log('- selectedOpponent:', selectedOpponent);
        
        if (!isFightInProgress) {
            console.error('❌ La pelea no está en progreso');
            this.addCombatMessage('La pelea no está en progreso', 'error');
            return;
        }
        
        // Mapear acciones a IDs de botones
        const actionButtonMap = {
            'basico': 'attack-btn',
            'especial': 'special-btn',
            'ultimate': 'ultimate-btn'
        };
        
        const buttonId = actionButtonMap[action];
        const actionBtn = document.getElementById(buttonId);
        console.log(`🔍 Buscando botón ${buttonId} para acción ${action}:`, actionBtn);
        
        if (!actionBtn) {
            console.error('❌ No se encontró el botón:', buttonId);
            // Listar todos los botones para debug
            const allButtons = document.querySelectorAll('button');
            console.log('Botones disponibles:', Array.from(allButtons).map(btn => btn.id));
            return;
        }
        
                 console.log('🔒 Deshabilitando botones durante el turno...');
         document.querySelectorAll('#attack-btn, #special-btn, #ultimate-btn').forEach(btn => {
             btn.disabled = true;
         });
         
         try {
            console.log('📤 Preparando datos para la API...');
            const requestData = {
                atacanteId: selectedPlayer.id,
                defensorId: selectedOpponent.id,
                tipoAtaque: action
            };
            
            // Si es una nueva pelea, agregar los IDs de los personajes
            if (!currentFightId) {
                requestData.id1 = selectedPlayer.id;
                requestData.id2 = selectedOpponent.id;
                console.log('🆕 Nueva pelea - agregando IDs de personajes');
            } else {
                requestData.fightId = currentFightId;
                console.log('🔄 Continuando pelea existente');
            }
            
            console.log('📤 Datos a enviar:', requestData);
            
            const response = await this.fetchWithAuth('/api/fights', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
            
            console.log('📥 Respuesta recibida:', response.status, response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error en la respuesta:', errorText);
                throw new Error(`Error al realizar la acción: ${errorText}`);
            }
            
            const fightData = await response.json();
            console.log('📊 Datos de la pelea recibidos:', fightData);
            
            // Actualizar el ID de la pelea si es nueva
            if (fightData.fightId && !currentFightId) {
                currentFightId = fightData.fightId;
                console.log('🆔 Nuevo ID de pelea asignado:', currentFightId);
            }
            
            // Actualizar información de la pelea
            if (fightData.personajes) {
                const playerData = fightData.personajes.find(p => p.id === selectedPlayer.id);
                const opponentData = fightData.personajes.find(p => p.id === selectedOpponent.id);
                
                                 if (playerData) {
                     console.log('🔄 Actualizando datos del jugador:', playerData);
                     // Actualizar UI del jugador
                     const playerHP = Math.max(0, Math.floor(playerData.vida));
                     document.getElementById('player-hp').textContent = playerHP;
                     document.getElementById('player-ultimate-damage').textContent = playerData.dañoUltimate || 0;
                     
                     // Actualizar barra de vida
                     const playerHealthBar = document.querySelector('#player-combat .health-fill');
                     if (playerHealthBar) {
                         const maxHealth = 100 + (selectedPlayer.nivel - 1) * 5;
                         const healthPercent = (playerData.vida / maxHealth) * 100;
                         playerHealthBar.style.width = `${Math.max(0, healthPercent)}%`;
                     }
                 }
                 
                 if (opponentData) {
                     console.log('🔄 Actualizando datos del oponente:', opponentData);
                     // Actualizar UI del oponente
                     const opponentHP = Math.max(0, Math.floor(opponentData.vida));
                     document.getElementById('opponent-hp').textContent = opponentHP;
                     document.getElementById('opponent-ultimate-damage').textContent = opponentData.dañoUltimate || 0;
                     
                     // Actualizar barra de vida
                     const opponentHealthBar = document.querySelector('#opponent-combat .health-fill');
                     if (opponentHealthBar) {
                         const maxHealth = 100 + (selectedOpponent.nivel - 1) * 5;
                         const healthPercent = (opponentData.vida / maxHealth) * 100;
                         opponentHealthBar.style.width = `${Math.max(0, healthPercent)}%`;
                     }
                 }
            }
            
            // Mostrar resultado del turno
            if (fightData.turno) {
                const turno = fightData.turno;
                console.log('📝 Mostrando resultado del turno:', turno);
                
                let message = `${turno.atacante} ataca a ${turno.defensor}: ${turno.descripcion}`;
                if (turno.reduccion > 0) {
                    message += ` (Escudo redujo ${turno.reduccion.toFixed(1)} daño)`;
                }
                message += ` (${turno.vidaAntes.toFixed(1)} → ${turno.vidaDespues.toFixed(1)} HP)`;
                
                this.addCombatMessage(message, 'attack');
            }
            
            // Verificar si la pelea terminó
            if (fightData.personajes) {
                const playerAlive = fightData.personajes.find(p => p.id === selectedPlayer.id)?.vida > 0;
                const opponentAlive = fightData.personajes.find(p => p.id === selectedOpponent.id)?.vida > 0;
                
                if (!playerAlive || !opponentAlive) {
                    const winner = playerAlive ? selectedPlayer.nombre : selectedOpponent.nombre;
                    this.endFight(winner);
                    return;
                }
            }
            
                     // Actualizar botones con información de ultimate
         this.updateUltimateButtons();
         
         // Después del turno del jugador, el oponente ataca automáticamente
         setTimeout(() => {
             this.opponentAttack();
         }, 1000);
         
     } catch (error) {
            console.error('❌ Error al realizar la acción:', error);
            
            // Manejar errores específicos
            if (error.message.includes('Ultimate no disponible')) {
                this.addCombatMessage('❌ Ultimate no disponible. Necesitas acumular más daño.', 'error');
            } else {
                this.addCombatMessage(`Error: ${error.message}`, 'error');
            }
            
            // Habilitar botón en caso de error
            actionBtn.disabled = false;
        }
    },

         // Ataque del oponente
     async opponentAttack() {
         if (!isFightInProgress) return;
         
         console.log('🤖 Turno del oponente...');
         this.addCombatMessage('🤖 Es el turno del oponente...', 'opponent');
         
         const actions = ['basico', 'especial', 'critico'];
         const action = actions[Math.floor(Math.random() * actions.length)];
         
         try {
             // Realizar acción del oponente en la API
             const response = await this.fetchWithAuth('/api/fights', {
                 method: 'POST',
                 body: JSON.stringify({
                     fightId: currentFightId,
                     atacanteId: selectedOpponent.id,
                     defensorId: selectedPlayer.id,
                     tipoAtaque: action
                 })
             });
             
             if (!response.ok) {
                 throw new Error('Error al realizar la acción del oponente');
             }
             
             const fightData = await response.json();
             
             // Actualizar información de la pelea
             if (fightData.personajes) {
                 const playerData = fightData.personajes.find(p => p.id === selectedPlayer.id);
                 const opponentData = fightData.personajes.find(p => p.id === selectedOpponent.id);
                 
                 if (playerData) {
                     const playerHP = Math.max(0, Math.floor(playerData.vida));
                     document.getElementById('player-hp').textContent = playerHP;
                     
                     // Actualizar barra de vida del jugador
                     const playerHealthBar = document.querySelector('#player-combat .health-fill');
                     if (playerHealthBar) {
                         const maxHealth = 100 + (selectedPlayer.nivel - 1) * 5;
                         const healthPercent = (playerData.vida / maxHealth) * 100;
                         playerHealthBar.style.width = `${Math.max(0, healthPercent)}%`;
                     }
                 }
                 if (opponentData) {
                     const opponentHP = Math.max(0, Math.floor(opponentData.vida));
                     document.getElementById('opponent-hp').textContent = opponentHP;
                     
                     // Actualizar barra de vida del oponente
                     const opponentHealthBar = document.querySelector('#opponent-combat .health-fill');
                     if (opponentHealthBar) {
                         const maxHealth = 100 + (selectedOpponent.nivel - 1) * 5;
                         const healthPercent = (opponentData.vida / maxHealth) * 100;
                         opponentHealthBar.style.width = `${Math.max(0, healthPercent)}%`;
                     }
                 }
             }
             
             // Mostrar mensaje del turno
             if (fightData.turno) {
                 const turno = fightData.turno;
                 let message = `${turno.atacante} ataca a ${turno.defensor}: ${turno.descripcion}`;
                 if (turno.reduccion > 0) {
                     message += ` (Escudo redujo ${turno.reduccion.toFixed(1)} daño)`;
                 }
                 message += ` (${turno.vidaAntes.toFixed(1)} → ${turno.vidaDespues.toFixed(1)} HP)`;
                 this.addCombatMessage(message, 'opponent');
             }
             
             // Verificar si el jugador fue derrotado
             const playerHP = parseInt(document.getElementById('player-hp').textContent);
             if (playerHP <= 0) {
                 this.endFight('defeat');
                 return;
             }
             
             // Verificar si el oponente fue derrotado
             const opponentHP = parseInt(document.getElementById('opponent-hp').textContent);
             if (opponentHP <= 0) {
                 this.endFight('victory');
                 return;
             }
             
             // Habilitar botones para el siguiente turno del jugador
             console.log('🔓 Habilitando botones para el siguiente turno del jugador...');
             document.querySelectorAll('#attack-btn, #special-btn, #ultimate-btn').forEach(btn => {
                 btn.disabled = false;
             });
             
             // Actualizar botones con información de ultimate
             this.updateUltimateButtons();
             
         } catch (error) {
             this.addCombatMessage('Error en la acción del oponente: ' + error.message, 'error');
             
             // Habilitar botones en caso de error
             document.querySelectorAll('#attack-btn, #special-btn, #ultimate-btn').forEach(btn => {
                 btn.disabled = false;
             });
         }
     },

    // Terminar pelea
    endFight(result) {
        isFightInProgress = false;
        
        const resultTitle = result === 'victory' ? '🏆 ¡Victoria!' : '💀 Derrota';
        const resultMessage = result === 'victory' 
            ? `¡Has derrotado a ${selectedOpponent.nombre}!`
            : `Has sido derrotado por ${selectedOpponent.nombre}`;
        
        this.addCombatMessage(resultMessage, result);
        
        // Mostrar modal de resultado
        document.getElementById('result-title').textContent = resultTitle;
        document.getElementById('result-content').innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">
                    ${result === 'victory' ? '🏆' : '💀'}
                </div>
                <p style="font-size: 1.2rem; margin-bottom: 1rem;">${resultMessage}</p>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    ${selectedPlayer.nombre} vs ${selectedOpponent.nombre}
                </div>
            </div>
        `;
        
        document.getElementById('result-modal').classList.remove('hidden');
    },

    // Agregar mensaje al log de combate
    addCombatMessage(message, type = 'info') {
        const logContainer = document.getElementById('combat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `log-message ${type}`;
        messageElement.textContent = message;
        
        logContainer.appendChild(messageElement);
        logContainer.scrollTop = logContainer.scrollHeight;
    },

    // Nueva pelea
    newFight() {
        // Ocultar modal de resultado
        document.getElementById('result-modal').classList.add('hidden');
        
        // Resetear variables
        selectedPlayer = null;
        selectedOpponent = null;
        currentFight = null;
        currentFightId = null;
        isFightInProgress = false;
        
        // Limpiar selecciones
        document.querySelectorAll('.character-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Limpiar log de combate
        document.getElementById('combat-messages').innerHTML = '<div class="log-message">La batalla ha comenzado...</div>';
        
        // Mostrar fase de selección
        document.getElementById('selection-phase').classList.remove('hidden');
        document.getElementById('combat-phase').classList.add('hidden');
        
        // Volver a renderizar personajes
        this.renderCharacters();
        
        // Actualizar botón
        this.updateStartButton();
    },

    // Mostrar loading
    showLoading(message) {
        // Implementar loading si es necesario
        console.log('Loading:', message);
    },

    // Ocultar loading
    hideLoading() {
        // Implementar hide loading si es necesario
        console.log('Loading completado');
    },

         // Mostrar error
     showError(message) {
         alert('Error: ' + message);
     },
     
     // Actualizar botones de ultimate con información visual
     updateUltimateButtons() {
         const ultimateBtn = document.getElementById('ultimate-btn');
         if (!ultimateBtn) return;
         
         // Obtener datos del jugador desde la API o usar datos locales
         const playerData = {
             dañoUltimate: parseInt(document.getElementById('player-ultimate-damage')?.textContent || '0'),
             umbralUltimate: 50 // Umbral por defecto
         };
         
         const progress = Math.min(100, (playerData.dañoUltimate / playerData.umbralUltimate) * 100);
         
         // Actualizar el botón con información visual
         ultimateBtn.innerHTML = `
             <div class="ultimate-button-content">
                 <div class="ultimate-icon">⭐</div>
                 <div class="ultimate-text">Ultimate</div>
                 <div class="ultimate-progress">
                     <div class="ultimate-progress-fill" style="width: ${progress}%"></div>
                 </div>
                 <div class="ultimate-damage">${playerData.dañoUltimate}/${playerData.umbralUltimate}</div>
             </div>
         `;
         
         // Habilitar/deshabilitar botón según disponibilidad
         if (progress >= 100) {
             ultimateBtn.classList.add('ultimate-ready');
             ultimateBtn.classList.remove('ultimate-charging');
         } else {
             ultimateBtn.classList.add('ultimate-charging');
             ultimateBtn.classList.remove('ultimate-ready');
         }
     }
 };

// ===== FUNCIONES AUXILIARES =====
function showError(message) {
    fight1vs1App.showError(message);
}

function showLoading(message) {
    fight1vs1App.showLoading(message);
}

function hideLoading() {
    fight1vs1App.hideLoading();
}

// ===== FUNCIONES DE DEPURACIÓN GLOBALES =====
// Función para depurar desde la consola del navegador
window.debugFight = function() {
    console.log('🔍 Iniciando depuración de pelea...');
    fight1vs1App.debugState();
};

// Función para probar autenticación desde la consola
window.testAuth = function() {
    console.log('🔐 Probando autenticación...');
    fight1vs1App.testAuth();
};

// Función para verificar botones desde la consola
window.checkButtons = function() {
    console.log('🔘 Verificando botones...');
    const attackBtn = document.getElementById('attack-btn');
    const specialBtn = document.getElementById('special-btn');
    const ultimateBtn = document.getElementById('ultimate-btn');
    
    console.log('Botones encontrados:');
    console.log('- attack-btn:', !!attackBtn);
    console.log('- special-btn:', !!specialBtn);
    console.log('- ultimate-btn:', !!ultimateBtn);
    
    if (attackBtn) {
        console.log('Event listeners de attack-btn:', attackBtn.onclick);
    }
    
    return { attackBtn, specialBtn, ultimateBtn };
};

// Función para forzar la configuración de event listeners
window.setupCombatListeners = function() {
    console.log('⚙️ Forzando configuración de event listeners...');
    fight1vs1App.setupCombatEventListeners();
};

// Función para probar una acción directamente
window.testAction = function(action = 'basico') {
    console.log('🧪 Probando acción:', action);
    if (fight1vs1App && typeof fight1vs1App.performAction === 'function') {
        fight1vs1App.performAction(action);
    } else {
        console.error('❌ performAction no está disponible');
    }
};

// Función para verificar el historial de combate
window.checkCombatLog = function() {
    console.log('📜 Verificando historial de combate...');
    const logContainer = document.getElementById('combat-messages');
    console.log('Contenedor de log encontrado:', !!logContainer);
    if (logContainer) {
        console.log('Mensajes actuales:', logContainer.children.length);
        console.log('Contenido:', logContainer.innerHTML);
    }
    
    // Probar agregar un mensaje de prueba
    if (fight1vs1App && typeof fight1vs1App.addCombatMessage === 'function') {
        fight1vs1App.addCombatMessage('🧪 Mensaje de prueba desde consola', 'info');
        console.log('✅ Mensaje de prueba agregado');
    } else {
        console.error('❌ addCombatMessage no está disponible');
    }
}; 