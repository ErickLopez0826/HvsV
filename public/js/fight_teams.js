// ===== VARIABLES GLOBALES =====
let playerTeam = null;
let enemyTeam = null;
let currentFight = null;
let isFightInProgress = false;
let allCharacters = [];
let availableTeams = [];
let currentFightId = null; // ID de la pelea actual en la base de datos

// Nuevas variables para el sistema mejorado
let playerTeamHealth = {};
let enemyTeamHealth = {};
let playerUltimateCharge = 0;
let enemyUltimateCharge = 0;
let playerTeamExperience = {};
let enemyTeamExperience = {};
let deadCharacters = new Set(); // Personajes muertos
let ultimateChargeThreshold = 50; // Puntos necesarios para cargar ultimate (reducido de 100 a 50)
let selectedTarget = null; // Objetivo seleccionado para atacar
let selectedAttacker = null; // Personaje del jugador seleccionado para atacar
let fightEnded = false; // Flag para evitar múltiples guardados

// Mapeo de imágenes de personajes
const CHARACTER_IMAGES = {
    'Genji': '../images/Personajes/Genji.webp',
    'Hanzo': '../images/Personajes/Hanzo.webp',
    'Cassidy': '../images/Personajes/Cass.webp',
    'Reaper': '../images/Personajes/Reaper.webp',
    'Moira': '../images/Personajes/Moira.webp',
    'Sombra': '../images/Personajes/Sombra.webp'
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎮 Inicializando Pelea de Equipos...');
    await fightTeamsApp.init();
});

// ===== APLICACIÓN PRINCIPAL =====
const fightTeamsApp = {
    // Inicializar la aplicación
    async init() {
        console.log('🎮 Inicializando Pelea de Equipos...');
        
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
        
        this.loadPlayerTeam();
        await this.loadCharacters();
        await this.loadAvailableTeams();
        this.setupEventListeners();
    },

    // Verificar autenticación
    checkAuthentication() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (!token || !user) {
            this.showError('Debes iniciar sesión para acceder a las peleas');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return false;
        }
        
        return true;
    },

    // Verificar y crear token de prueba si es necesario
    async checkAndCreateTestToken() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('=== VERIFICACIÓN DE TOKEN EQUIPOS ===');
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

    // Probar autenticación
    async testAuth() {
        console.log('🧪 Probando autenticación equipos...');
        
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

    // Cargar equipo del jugador (ahora es opcional)
    async loadPlayerTeam() {
        // Ya no cargamos automáticamente un equipo específico
        // El jugador debe seleccionar su equipo
        console.log('👥 Equipo del jugador: pendiente de selección');
        this.renderPlayerTeam();
    },

    // Función helper para hacer llamadas autenticadas
    async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        return fetch(url, {
            ...options,
            headers
        });
    },

    // Cargar personajes disponibles
    async loadCharacters() {
        try {
            const response = await this.fetchWithAuth('/api/personajes?page=1&limit=50');

            if (!response.ok) {
                throw new Error('Error al cargar personajes');
            }

            const data = await response.json();
            allCharacters = data.data;
            
            console.log(`📖 Cargados ${allCharacters.length} personajes`);
            
        } catch (error) {
            console.error('Error cargando personajes:', error);
            this.showError('Error al cargar los personajes. Intenta recargar la página.');
        }
    },

    // Cargar equipos disponibles
    async loadAvailableTeams() {
        try {
            // Crear equipos basados en los personajes disponibles
            const heroes = allCharacters.filter(char => char.tipo === 'superheroe');
            const villains = allCharacters.filter(char => char.tipo === 'villano');
            
            availableTeams = [
                {
                    id: 'heroes1',
                    nombre: 'Equipo Héroes 1',
                    characters: heroes.slice(0, 3),
                    tipo: 'superheroe'
                },
                {
                    id: 'heroes2', 
                    nombre: 'Equipo Héroes 2',
                    characters: heroes.slice(3, 6),
                    tipo: 'superheroe'
                },
                {
                    id: 'villains1',
                    nombre: 'Equipo Villanos 1', 
                    characters: villains.slice(0, 3),
                    tipo: 'villano'
                },
                {
                    id: 'villains2',
                    nombre: 'Equipo Villanos 2',
                    characters: villains.slice(3, 6), 
                    tipo: 'villano'
                }
            ];
            
            console.log(`👥 Cargados ${availableTeams.length} equipos disponibles`);
            
        } catch (error) {
            console.error('Error cargando equipos:', error);
            this.showError('Error al cargar los equipos disponibles.');
        }
    },

    // Configurar event listeners
    setupEventListeners() {
        // Botones de selección de equipos
        document.addEventListener('click', (e) => {
            if (e.target.id === 'select-player-team-btn') {
                this.showPlayerTeamSelectionModal();
            }
            if (e.target.id === 'select-enemy-team-btn') {
                this.showTeamSelectionModal();
            }
            if (e.target.id === 'random-team-btn') {
                this.generateRandomTeam();
            }
            if (e.target.id === 'select-team-btn') {
                this.showTeamSelectionModal();
            }
        });
        
        // Botón de inicio de pelea
        document.getElementById('start-fight-btn').addEventListener('click', () => {
            this.showConfirmModal();
        });
        
        // Botones de acción
        document.getElementById('attack-btn').addEventListener('click', () => {
            this.performAction('basico');
        });
        
        document.getElementById('special-btn').addEventListener('click', () => {
            this.performAction('especial');
        });
        
        document.getElementById('ultimate-btn').addEventListener('click', () => {
            this.performAction('ultimate');
        });
        
        // Botones de modal
        document.getElementById('confirm-fight-btn').addEventListener('click', () => {
            this.confirmFight();
        });
        
        document.getElementById('cancel-fight-btn').addEventListener('click', () => {
            this.cancelFight();
        });
        
        // Botón nueva pelea
        document.getElementById('new-fight-btn').addEventListener('click', () => {
            this.newFight();
        });
    },

    // Generar equipo aleatorio
    generateRandomTeam() {
        const heroes = allCharacters.filter(char => char.tipo === 'superheroe');
        const villains = allCharacters.filter(char => char.tipo === 'villano');
        
        const randomHeroes = heroes.sort(() => 0.5 - Math.random()).slice(0, 3);
        const randomVillains = villains.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // Crear equipo aleatorio para el enemigo
        enemyTeam = {
            id: 'random-' + Date.now(),
            nombre: 'Equipo Aleatorio',
            characters: randomVillains,
            tipo: 'villano'
        };
        
        this.renderEnemyTeam();
        this.updateTeamStats('enemy');
        this.updateStartButton();
    },

    // Mostrar modal de selección de equipo enemigo
    showTeamSelectionModal() {
        const modal = document.getElementById('team-select-modal');
        const content = document.getElementById('available-teams');
        
        content.innerHTML = `
            <h3>Selecciona el Equipo Enemigo</h3>
            <div class="teams-grid">
                ${availableTeams.filter(team => team.tipo === 'villano').map(team => `
                    <div class="team-card" onclick="fightTeamsApp.selectEnemyTeam('${team.id}')">
                        <h4>${team.nombre}</h4>
                        <div class="team-characters">
                            ${team.characters.map(char => `
                                <div class="team-character">
                                    <img src="../images/Personajes/${this.getCharacterImageName(char.nombre)}.webp" alt="${char.nombre}" class="character-image">
                                    <span>${char.nombre}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="modal-actions">
                <button onclick="fightTeamsApp.cancelTeamSelection()" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        
        modal.classList.remove('hidden');
    },

    // Seleccionar equipo enemigo
    selectEnemyTeam(teamId) {
        const team = availableTeams.find(t => t.id === teamId);
        if (team) {
            enemyTeam = team;
            this.renderEnemyTeam();
            this.updateTeamStats('enemy');
            this.updateStartButton();
            
            // Ocultar modal
            document.getElementById('team-select-modal').classList.add('hidden');
        }
    },

    // Cancelar selección de equipo
    cancelTeamSelection() {
        document.getElementById('team-select-modal').classList.add('hidden');
    },

    // Mostrar modal de selección de equipo del jugador
    showPlayerTeamSelectionModal() {
        const modal = document.getElementById('player-team-select-modal');
        const content = document.getElementById('available-player-teams');
        
        content.innerHTML = `
            <h3>Selecciona tu Equipo</h3>
            <div class="teams-grid">
                ${availableTeams.filter(team => team.tipo === 'superheroe').map(team => `
                    <div class="team-card" onclick="fightTeamsApp.selectPlayerTeam('${team.id}')">
                        <h4>${team.nombre}</h4>
                        <div class="team-characters">
                            ${team.characters.map(char => `
                                <div class="team-character">
                                    <img src="../images/Personajes/${this.getCharacterImageName(char.nombre)}.webp" alt="${char.nombre}" class="character-image">
                                    <span>${char.nombre}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="modal-actions">
                <button onclick="fightTeamsApp.cancelPlayerTeamSelection()" class="btn btn-secondary">Cancelar</button>
            </div>
        `;
        
        modal.classList.remove('hidden');
    },

    // Seleccionar equipo del jugador
    selectPlayerTeam(teamId) {
        const team = availableTeams.find(t => t.id === teamId);
        if (team) {
            playerTeam = team;
            this.renderPlayerTeam();
            this.updateTeamStats('player');
            this.updateStartButton();
            
            // Ocultar modal
            document.getElementById('player-team-select-modal').classList.add('hidden');
        }
    },

    // Cancelar selección de equipo del jugador
    cancelPlayerTeamSelection() {
        document.getElementById('player-team-select-modal').classList.add('hidden');
    },

    // Renderizar equipo del jugador
    renderPlayerTeam() {
        const container = document.getElementById('player-team-characters');
        
        if (!playerTeam) {
            container.innerHTML = `
                <div class="team-placeholder">
                    <p>Selecciona tu equipo para comenzar</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="team-info">
                    <h3>${playerTeam.nombre}</h3>
                    <div class="team-characters">
                        ${playerTeam.characters.map(char => `
                            <div class="team-character">
                                <img src="../images/Personajes/${this.getCharacterImageName(char.nombre)}.webp" alt="${char.nombre}" class="character-image">
                                <span>${char.nombre}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    },

    // Renderizar equipo enemigo
    renderEnemyTeam() {
        const container = document.getElementById('enemy-team-characters');
        
        if (!enemyTeam) {
            container.innerHTML = `
                <div class="team-placeholder">
                    <p>Selecciona el equipo enemigo</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="team-info">
                    <h3>${enemyTeam.nombre}</h3>
                    <div class="team-characters">
                        ${enemyTeam.characters.map(char => `
                            <div class="team-character">
                                <img src="../images/Personajes/${this.getCharacterImageName(char.nombre)}.webp" alt="${char.nombre}" class="character-image">
                                <span>${char.nombre}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    },

    // Actualizar estadísticas del equipo
    updateTeamStats(teamType) {
        const team = teamType === 'player' ? playerTeam : enemyTeam;
        if (!team) return;
        
        const power = this.calculateTeamPower(team.characters);
        const avgLevel = Math.round(team.characters.reduce((sum, char) => sum + char.nivel, 0) / team.characters.length);
        
        document.getElementById(`${teamType}-team-level`).textContent = avgLevel;
        document.getElementById(`${teamType}-team-power`).textContent = power;
        document.getElementById(`${teamType}-team-name`).textContent = team.nombre;
    },

    // Calcular poder del equipo
    calculateTeamPower(characters) {
        return characters.reduce((total, char) => total + (char.nivel * 10), 0);
    },

    // Actualizar botón de inicio
    updateStartButton() {
        const startBtn = document.getElementById('start-fight-btn');
        startBtn.disabled = !playerTeam || !enemyTeam;
        
        if (playerTeam && enemyTeam) {
            startBtn.textContent = '⚔️ Iniciar Pelea de Equipos';
        } else {
            startBtn.textContent = 'Selecciona ambos equipos';
        }
    },

    // Mostrar modal de confirmación
    showConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        const content = document.getElementById('fight-summary');
        
        content.innerHTML = `
            <div style="text-align: center;">
                <h3>Confirmar Pelea de Equipos</h3>
                <p>¿Estás listo para la batalla?</p>
                <div style="display: flex; justify-content: space-around; margin: 1rem 0;">
                    <div>
                        <strong>${playerTeam.nombre}</strong><br>
                        <small>${playerTeam.characters.length} miembros</small>
                    </div>
                    <div style="font-size: 1.5rem; color: var(--btn-primary);">VS</div>
                    <div>
                        <strong>${enemyTeam.nombre}</strong><br>
                        <small>${enemyTeam.characters.length} miembros</small>
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
            this.showLoading('Iniciando pelea de equipos...');
            
            // Crear nueva pelea de equipos en la base de datos
            const response = await this.fetchWithAuth('/api/fights/teams', {
                method: 'POST',
                body: JSON.stringify({
                    equipoHeroes: playerTeam.nombre,
                    equipoVillanos: enemyTeam.nombre,
                    atacanteId: playerTeam.characters[0].id,
                    defensorId: enemyTeam.characters[0].id,
                    tipoAtaque: 'basico'
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al iniciar la pelea de equipos');
            }
            
            const fightData = await response.json();
            currentFightId = fightData.fightId;
            
            this.hideLoading();
            this.startCombat();
            
        } catch (error) {
            this.hideLoading();
            console.error('Error iniciando pelea de equipos:', error);
            this.showError('Error al iniciar la pelea de equipos: ' + error.message);
        }
    },

    // Iniciar combate
    startCombat() {
        isFightInProgress = true;
        fightEnded = false; // Resetear flag al iniciar nueva pelea
        
        // Ocultar modal de confirmación
        document.getElementById('confirm-modal').classList.add('hidden');
        
        // Ocultar fase de selección y mostrar fase de combate
        document.getElementById('selection-phase').classList.add('hidden');
        document.getElementById('combat-phase').classList.remove('hidden');
        
        this.initializeTurnSystem();
        this.setupCombatArea();
    },

    // Inicializar sistema de turnos
    initializeTurnSystem() {
        this.currentTurn = 'player';
        selectedTarget = null; // Resetear objetivo seleccionado
        selectedAttacker = null; // Resetear atacante seleccionado
        
        // Verificar que los equipos estén cargados
        if (!playerTeam || !playerTeam.characters || !enemyTeam || !enemyTeam.characters) {
            console.error('❌ Error: Los equipos no están cargados correctamente');
            this.addCombatMessage('Error: Los equipos no están cargados correctamente', 'error');
            return;
        }
        
        // Inicializar vida de equipos
        playerTeam.characters.forEach(char => {
            playerTeamHealth[char.id] = 100;
        });
        
        enemyTeam.characters.forEach(char => {
            enemyTeamHealth[char.id] = 100;
        });
        
        this.updateTeamHealthDisplay();
        this.updateTurnDisplay();
        this.updateUltimateDisplay();
        this.updateAttackerDisplay();
        this.updateTargetDisplay();
        
        // Deshabilitar acciones hasta que se seleccione un objetivo
        this.disablePlayerActions();
        
        this.addCombatMessage('⚔️ ¡La batalla de equipos ha comenzado! Selecciona un objetivo enemigo para atacar.', 'info');
    },

    // Configurar área de combate
    setupCombatArea() {
        // Verificar que los equipos estén cargados
        if (!playerTeam || !playerTeam.characters || !enemyTeam || !enemyTeam.characters) {
            console.error('❌ Error: Los equipos no están cargados correctamente');
            this.addCombatMessage('Error: Los equipos no están cargados correctamente', 'error');
            return;
        }
        
        this.renderCombatTeam('player', playerTeam.characters);
        this.renderCombatTeam('enemy', enemyTeam.characters);
        
        // Limpiar log de combate
        document.getElementById('combat-messages').innerHTML = '<div class="log-message">La batalla de equipos ha comenzado...</div>';
    },

    // Renderizar equipo en combate
    renderCombatTeam(teamType, characters) {
        const container = document.getElementById(`${teamType}-team-combat`);
        
        if (!container) {
            console.error(`No se encontró el contenedor: ${teamType}-team-combat`);
            return;
        }
        
        container.innerHTML = `
            <div class="combat-team">
                <h3>${teamType === 'player' ? playerTeam.nombre : enemyTeam.nombre}</h3>
                <div class="team-characters-combat">
                    ${characters.map(char => {
                        const isDead = teamType === 'player' ? 
                            (playerTeamHealth[char.id] <= 0) : 
                            (enemyTeamHealth[char.id] <= 0);
                        const isSelected = teamType === 'player' ? 
                            (selectedAttacker && selectedAttacker.id === char.id) :
                            (selectedTarget && selectedTarget.id === char.id);
                        
                        return `
                            <div class="combat-character ${teamType === 'enemy' ? 'enemy-character' : ''} ${isDead ? 'dead' : ''} ${isSelected ? 'selected' : ''}" 
                                 data-character-id="${char.id}" 
                                 data-character-name="${char.nombre}"
                                 ${teamType === 'enemy' && !isDead ? 'onclick="fightTeamsApp.selectTarget(this)"' : ''}
                                 ${teamType === 'player' && !isDead ? 'onclick="fightTeamsApp.selectAttacker(this)"' : ''}>
                                <div class="combat-character-avatar">
                                    <img src="../images/Personajes/${this.getCharacterImageName(char.nombre)}.webp" alt="${char.nombre}" class="combat-character-image">
                                    ${isDead ? '<div class="dead-overlay">💀</div>' : ''}
                                </div>
                                <div class="character-health">
                                    <div class="health-bar">
                                        <div class="health-fill" style="width: ${Math.max(0, teamType === 'player' ? (playerTeamHealth[char.id] !== undefined ? Math.max(0, playerTeamHealth[char.id]) : 100) : (enemyTeamHealth[char.id] !== undefined ? Math.max(0, enemyTeamHealth[char.id]) : 100))}%"></div>
                                    </div>
                                    <span class="health-text">${Math.max(0, Math.floor(teamType === 'player' ? (playerTeamHealth[char.id] !== undefined ? Math.max(0, playerTeamHealth[char.id]) : 100) : (enemyTeamHealth[char.id] !== undefined ? Math.max(0, enemyTeamHealth[char.id]) : 100)))}/100</span>
                                </div>
                                <span class="combat-character-name">${char.nombre}</span>
                                ${isDead ? '<span class="dead-status">MUERTO</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        // Si es el equipo enemigo, configurar la selección de objetivos
        if (teamType === 'enemy') {
            this.setupTargetSelection();
        }
    },

    // Calcular vida total del equipo
    calculateTeamHealth(characters) {
        return characters.reduce((total, char) => {
            const health = playerTeamHealth[char.id];
            return total + (health !== undefined ? Math.max(0, health) : 100);
        }, 0);
    },

    // Actualizar display de vida del equipo
    updateTeamHealthDisplay() {
        // Verificar que los equipos estén cargados
        if (!playerTeam || !playerTeam.characters || !enemyTeam || !enemyTeam.characters) {
            console.error('❌ Error: Los equipos no están cargados correctamente');
            return;
        }
        
        const playerHealth = this.calculateTeamHealth(playerTeam.characters);
        const enemyHealth = this.calculateTeamHealth(enemyTeam.characters);
        
        const playerHealthElement = document.getElementById('player-team-health');
        const enemyHealthElement = document.getElementById('enemy-team-health');
        
        if (playerHealthElement) {
            playerHealthElement.textContent = playerHealth;
        }
        if (enemyHealthElement) {
            enemyHealthElement.textContent = enemyHealth;
        }
    },

    // Actualizar vida individual de personajes
    updateIndividualCharacterHealth() {
        // Verificar que los equipos estén cargados
        if (!playerTeam || !playerTeam.characters || !enemyTeam || !enemyTeam.characters) {
            console.error('❌ Error: Los equipos no están cargados correctamente');
            return;
        }
        
        // Actualizar personajes del jugador
        playerTeam.characters.forEach(char => {
            const charElement = document.querySelector(`[data-character-id="${char.id}"]`);
            if (charElement) {
                // Si el personaje no tiene vida definida, usar 100, pero si está muerto, mantener en 0
                let health = playerTeamHealth[char.id];
                if (health === undefined) {
                    health = 100;
                } else if (health <= 0) {
                    health = 0; // Asegurar que permanezca en 0 si está muerto
                }
                
                const healthBar = charElement.querySelector('.health-fill');
                const healthText = charElement.querySelector('.health-text');
                
                if (healthBar) {
                    healthBar.style.width = `${Math.max(0, health)}%`;
                }
                if (healthText) {
                    healthText.textContent = `${Math.max(0, Math.floor(health))}/100`;
                }
                
                // Actualizar estado de muerte
                if (health <= 0) {
                    charElement.classList.add('dead');
                    deadCharacters.add(char.id);
                    
                    // Remover selección si el personaje muere
                    if (selectedAttacker && selectedAttacker.id === char.id) {
                        selectedAttacker = null;
                        charElement.classList.remove('selected');
                        this.updateAttackerDisplay();
                    }
                } else {
                    charElement.classList.remove('dead');
                    deadCharacters.delete(char.id);
                }
            }
        });
        
        // Actualizar personajes enemigos
        enemyTeam.characters.forEach(char => {
            const charElement = document.querySelector(`[data-character-id="${char.id}"]`);
            if (charElement) {
                // Si el personaje no tiene vida definida, usar 100, pero si está muerto, mantener en 0
                let health = enemyTeamHealth[char.id];
                if (health === undefined) {
                    health = 100;
                } else if (health <= 0) {
                    health = 0; // Asegurar que permanezca en 0 si está muerto
                }
                
                const healthBar = charElement.querySelector('.health-fill');
                const healthText = charElement.querySelector('.health-text');
                
                if (healthBar) {
                    healthBar.style.width = `${Math.max(0, health)}%`;
                }
                if (healthText) {
                    healthText.textContent = `${Math.max(0, Math.floor(health))}/100`;
                }
                
                // Actualizar estado de muerte
                if (health <= 0) {
                    charElement.classList.add('dead');
                    deadCharacters.add(char.id);
                    
                    // Remover selección si el objetivo muere
                    if (selectedTarget && selectedTarget.id === char.id) {
                        selectedTarget = null;
                        charElement.classList.remove('selected');
                        this.updateTargetDisplay();
                    }
                } else {
                    charElement.classList.remove('dead');
                    deadCharacters.delete(char.id);
                }
            }
        });
        
        // Actualizar displays y acciones del jugador después de verificar muertes
        this.updateAttackerDisplay();
        this.updateTargetDisplay();
        this.enablePlayerActions();
    },

    // Actualizar display de ultimate
    updateUltimateDisplay() {
        const ultimateBar = document.getElementById('ultimate-bar');
        const ultimateText = document.getElementById('ultimate-text');
        
        if (ultimateBar && ultimateText) {
            const percentage = (playerUltimateCharge / ultimateChargeThreshold) * 100;
            ultimateBar.style.width = `${Math.min(100, percentage)}%`;
            ultimateText.textContent = `${playerUltimateCharge}/${ultimateChargeThreshold}`;
        }
    },

    // Cargar ultimate
    chargeUltimate(damage, isKill = false) {
        const baseCharge = damage * 0.3; // Aumentado de 0.1 a 0.3 (30% del daño)
        const killBonus = isKill ? 30 : 0; // Aumentado de 20 a 30 puntos por kill
        playerUltimateCharge = Math.min(ultimateChargeThreshold, playerUltimateCharge + baseCharge + killBonus);
        this.updateUltimateDisplay();
    },

    // Agregar experiencia a personaje
    addExperienceToCharacter(characterId, experienceGained) {
        if (!playerTeamExperience[characterId]) {
            playerTeamExperience[characterId] = 0;
        }
        playerTeamExperience[characterId] += experienceGained;
    },

    // Calcular experiencia de victoria
    calculateVictoryExperience() {
        const baseExperience = 100;
        const levelBonus = enemyTeam.characters.reduce((total, char) => total + char.nivel, 0) * 5;
        return baseExperience + levelBonus;
    },

    // Distribuir experiencia al equipo ganador
    distributeExperienceToWinningTeam(experiencePerCharacter) {
        const survivors = playerTeam.characters.filter(char => playerTeamHealth[char.id] > 0);
        survivors.forEach(char => {
            this.addExperienceToCharacter(char.id, experiencePerCharacter);
        });
        return survivors.map(char => char.nombre).join(', ');
    },

    // Realizar acción de combate
    async performAction(action) {
        if (!isFightInProgress || this.currentTurn !== 'player') return;
        
        if (!selectedTarget) {
            this.addCombatMessage('⚠️ Debes seleccionar un objetivo enemigo primero', 'error');
            return;
        }
        
        if (!selectedAttacker) {
            this.addCombatMessage('⚠️ Debes seleccionar un personaje de tu equipo para atacar', 'error');
            return;
        }
        
        // Verificar si el atacante está muerto
        if (playerTeamHealth[selectedAttacker.id] <= 0) {
            this.addCombatMessage('⚠️ No puedes usar un personaje muerto para atacar', 'error');
            return;
        }
        
        // Verificar si el objetivo está muerto
        if (deadCharacters.has(selectedTarget.id)) {
            this.addCombatMessage('⚠️ No puedes atacar a un personaje muerto', 'error');
            return;
        }
        
        // Verificar si ultimate está disponible
        if (action === 'ultimate' && playerUltimateCharge < ultimateChargeThreshold) {
            this.addCombatMessage('⚠️ Ultimate no está completamente cargado', 'error');
            return;
        }
        
        // Mapear nombres de acción a IDs de botones
        const actionButtonMap = {
            'basico': 'attack-btn',
            'especial': 'special-btn',
            'ultimate': 'ultimate-btn'
        };
        
        const buttonId = actionButtonMap[action];
        const actionBtn = document.getElementById(buttonId);
        
        if (!actionBtn) {
            this.addCombatMessage(`Error: No se encontró el botón para la acción ${action}`, 'error');
            return;
        }
        
        actionBtn.disabled = true;
        
        try {
            // Calcular daño localmente sin llamar a la API
            const damage = this.calculateCharacterDamage(action, selectedTarget);
            
            // Aplicar daño
            this.applyDamageToTarget(selectedTarget, damage);
            
            // Mostrar mensaje del turno
            const message = this.getActionMessage(action, damage, selectedTarget);
            this.addCombatMessage(message, action);
            
            // Cargar ultimate basado en el daño causado
            if (damage > 0) {
                const isKill = enemyTeamHealth[selectedTarget.id] <= 0;
                this.chargeUltimate(damage, isKill);
            }
            
            // Actualizar displays
            this.updateTeamHealthDisplay();
            this.updateIndividualCharacterHealth();
            
            // Verificar si el objetivo murió
            if (enemyTeamHealth[selectedTarget.id] <= 0) {
                this.addCombatMessage(`💀 ${selectedTarget.nombre} ha sido derrotado!`, 'info');
                deadCharacters.add(selectedTarget.id);
                this.updateTargetDisplay();
            }
            
            // Verificar si todo el equipo enemigo fue derrotado
            const aliveEnemies = Object.values(enemyTeamHealth).filter(hp => hp > 0).length;
            if (aliveEnemies === 0) {
                console.log('🎯 Llamando endFight desde performAction - VICTORY');
                this.endFight('victory');
                return;
            }
            
            // Consumir ultimate si se usó
            if (action === 'ultimate') {
                playerUltimateCharge = 0;
                this.updateUltimateDisplay();
            }
            
            // Cambiar al turno del enemigo
            this.currentTurn = 'enemy';
            this.updateTurnDisplay();
            this.disablePlayerActions();
            
            // Simular contraataque del equipo enemigo
            setTimeout(() => {
                this.enemyTeamAttack();
            }, 1500);
            
        } catch (error) {
            this.addCombatMessage('Error en la acción: ' + error.message, 'error');
        } finally {
            actionBtn.disabled = false;
        }
    },

    // Calcular daño de personaje específico
    calculateCharacterDamage(action, target) {
        // Verificar que playerTeam esté cargado
        if (!playerTeam || !playerTeam.characters || playerTeam.characters.length === 0) {
            console.error('❌ Error: playerTeam no está cargado correctamente');
            return 0;
        }
        
        // Verificar que el atacante seleccionado tenga la propiedad nivel
        if (!selectedAttacker || !selectedAttacker.nivel) {
            console.error('❌ Error: selectedAttacker no tiene la propiedad nivel');
            return 0;
        }
        
        // Verificar que el objetivo tenga la propiedad nivel
        if (!target || !target.nivel) {
            console.error('❌ Error: target no tiene la propiedad nivel');
            return 0;
        }
        
        const baseAttack = selectedAttacker.nivel * 8;
        const targetDefense = target.nivel * 3;
        
        let damage = 0;
        
        switch (action) {
            case 'basico':
                damage = Math.max(15, baseAttack - targetDefense / 2);
                break;
            case 'especial':
                damage = Math.max(30, baseAttack * 1.8 - targetDefense / 2);
                break;
            case 'ultimate':
                damage = Math.max(50, baseAttack * 2.5 - targetDefense / 2);
                break;
        }
        
        return Math.floor(damage + Math.random() * 10);
    },

    // Aplicar daño al objetivo
    applyDamageToTarget(target, damage) {
        enemyTeamHealth[target.id] = Math.max(0, enemyTeamHealth[target.id] - damage);
    },

    // Configurar selección de objetivos
    setupTargetSelection() {
        const enemyCharacters = document.querySelectorAll('.enemy-character');
        enemyCharacters.forEach(char => {
            char.addEventListener('click', () => this.selectTarget(char));
        });
    },

    // Seleccionar objetivo
    selectTarget(targetElement) {
        // Remover selección anterior
        const previousSelected = document.querySelector('.enemy-character.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        // Verificar si el objetivo está muerto
        const characterId = targetElement.getAttribute('data-character-id');
        if (deadCharacters.has(characterId)) {
            this.addCombatMessage('⚠️ No puedes seleccionar un personaje muerto', 'error');
            return;
        }
        
        // Buscar el personaje completo en el equipo enemigo
        const targetCharacter = enemyTeam.characters.find(char => char.id == characterId);
        if (!targetCharacter) {
            this.addCombatMessage('⚠️ Error: No se encontró el personaje seleccionado', 'error');
            return;
        }
        
        // Seleccionar nuevo objetivo
        targetElement.classList.add('selected');
        selectedTarget = {
            id: characterId,
            nombre: targetCharacter.nombre,
            nivel: targetCharacter.nivel,
            element: targetElement
        };
        
        this.updateTargetDisplay();
        this.enablePlayerActions();
        
        this.addCombatMessage(`🎯 Objetivo seleccionado: ${selectedTarget.nombre}`, 'info');
    },

    // Seleccionar atacante del equipo del jugador
    selectAttacker(attackerElement) {
        const characterId = attackerElement.getAttribute('data-character-id');
        const characterName = attackerElement.getAttribute('data-character-name');
        
        // Verificar si el personaje está muerto
        if (playerTeamHealth[characterId] <= 0) {
            this.addCombatMessage('⚠️ No puedes seleccionar un personaje muerto como atacante', 'error');
            return;
        }
        
        // Buscar el personaje completo en el equipo del jugador
        const attackerCharacter = playerTeam.characters.find(char => char.id == characterId);
        if (!attackerCharacter) {
            this.addCombatMessage('⚠️ Error: No se encontró el personaje seleccionado', 'error');
            return;
        }
        
        // Remover selección anterior
        document.querySelectorAll('.combat-character:not(.enemy-character)').forEach(char => {
            char.classList.remove('selected');
        });
        
        // Seleccionar nuevo atacante
        attackerElement.classList.add('selected');
        selectedAttacker = { 
            id: characterId, 
            nombre: attackerCharacter.nombre,
            nivel: attackerCharacter.nivel
        };
        
        this.updateAttackerDisplay();
        this.enablePlayerActions();
        
        this.addCombatMessage(`⚔️ Atacante seleccionado: ${characterName}`, 'info');
    },

    // Habilitar acciones del jugador
    enablePlayerActions() {
        const actionButtons = document.querySelectorAll('.action-buttons .btn');
        const hasTarget = selectedTarget && enemyTeamHealth[selectedTarget.id] > 0;
        const hasAttacker = selectedAttacker && playerTeamHealth[selectedAttacker.id] > 0;
        
        actionButtons.forEach(btn => {
            if (btn.id === 'ultimate-btn') {
                // Solo habilitar ultimate si está cargado y hay objetivo y atacante válidos
                btn.disabled = playerUltimateCharge < ultimateChargeThreshold || !hasTarget || !hasAttacker;
            } else {
                // Solo habilitar otros botones si hay objetivo y atacante válidos
                btn.disabled = !hasTarget || !hasAttacker;
            }
        });
    },

    // Deshabilitar acciones del jugador
    disablePlayerActions() {
        const actionButtons = document.querySelectorAll('.action-buttons .btn');
        actionButtons.forEach(btn => {
            btn.disabled = true;
        });
    },

    // Actualizar display de atacante
    updateAttackerDisplay() {
        const attackerDisplay = document.getElementById('selected-attacker');
        
        if (selectedAttacker && playerTeamHealth[selectedAttacker.id] > 0) {
            const health = playerTeamHealth[selectedAttacker.id];
            attackerDisplay.innerHTML = `
                <div class="attacker-character">
                    <img src="../images/Personajes/${this.getCharacterImageName(selectedAttacker.nombre)}.webp" alt="${selectedAttacker.nombre}">
                    <span>${selectedAttacker.nombre}</span>
                </div>
                <p>Vida: ${Math.max(0, Math.floor(health))}/100</p>
            `;
        } else {
            attackerDisplay.innerHTML = `
                <p>Haz clic en uno de tus personajes para seleccionarlo como atacante</p>
            `;
        }
    },

    // Actualizar display de objetivo
    updateTargetDisplay() {
        const targetDisplay = document.getElementById('selected-target');
        
        if (selectedTarget && enemyTeamHealth[selectedTarget.id] > 0) {
            const health = enemyTeamHealth[selectedTarget.id];
            targetDisplay.innerHTML = `
                <div class="target-character">
                    <img src="../images/Personajes/${this.getCharacterImageName(selectedTarget.nombre)}.webp" alt="${selectedTarget.nombre}">
                    <span>${selectedTarget.nombre}</span>
                </div>
                <p>Vida: ${Math.max(0, Math.floor(health))}/100</p>
            `;
        } else {
            targetDisplay.innerHTML = `
                <p>Haz clic en un personaje enemigo para seleccionarlo como objetivo</p>
            `;
        }
    },

    // Actualizar display de turno
    updateTurnDisplay() {
        const turnDisplay = document.getElementById('current-turn');
        turnDisplay.textContent = `Turno: ${this.currentTurn === 'player' ? 'Tu equipo' : 'Equipo enemigo'}`;
    },

    // Obtener mensaje de acción
    getActionMessage(action, damage, target) {
        // Verificar que el atacante seleccionado esté disponible
        if (!selectedAttacker || !selectedAttacker.nombre) {
            console.error('❌ Error: selectedAttacker no está disponible');
            return 'Error: Atacante no seleccionado';
        }
        
        // Verificar que el objetivo esté disponible
        if (!target || !target.nombre) {
            console.error('❌ Error: target no está disponible');
            return 'Error: Objetivo no válido';
        }
        
        switch (action) {
            case 'basico':
                return `⚔️ ${selectedAttacker.nombre} ataca a ${target.nombre} causando ${damage} de daño`;
            case 'especial':
                return `🔥 ${selectedAttacker.nombre} usa habilidad especial contra ${target.nombre} causando ${damage} de daño`;
            case 'ultimate':
                return `💥 ${selectedAttacker.nombre} usa ultimate contra ${target.nombre} causando ${damage} de daño`;
        }
    },

    // Actualizar vida del equipo
    updateTeamHealth(teamType, damage) {
        const team = teamType === 'player' ? playerTeam : enemyTeam;
        const healthObj = teamType === 'player' ? playerTeamHealth : enemyTeamHealth;
        
        // Distribuir daño entre miembros vivos
        const aliveMembers = team.characters.filter(char => healthObj[char.id] > 0);
        if (aliveMembers.length > 0) {
            const damagePerMember = damage / aliveMembers.length;
            aliveMembers.forEach(char => {
                healthObj[char.id] = Math.max(0, healthObj[char.id] - damagePerMember);
            });
        }
    },

    // Actualizar personajes individuales
    updateIndividualCharacters(teamType, totalDamage) {
        this.updateTeamHealth(teamType, totalDamage);
        this.updateTeamHealthDisplay();
        this.updateIndividualCharacterHealth();
    },

    // Ataque del equipo enemigo
    async enemyTeamAttack() {
        if (!isFightInProgress || this.currentTurn !== 'enemy') return;
        
        // Seleccionar objetivo aleatorio del equipo del jugador
        const alivePlayerMembers = playerTeam.characters.filter(char => playerTeamHealth[char.id] > 0);
        if (alivePlayerMembers.length === 0) {
            console.log('🎯 Llamando endFight desde enemyTeamAttack - DEFEAT (no hay jugadores vivos)');
            this.endFight('defeat');
            return;
        }
        
        const target = alivePlayerMembers[Math.floor(Math.random() * alivePlayerMembers.length)];
        const actions = ['basico', 'especial', 'critico'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        try {
            // Calcular daño localmente sin llamar a la API
            const attacker = enemyTeam.characters[Math.floor(Math.random() * enemyTeam.characters.length)];
            const damage = this.calculateEnemyCharacterDamage(action, target);
            
            // Aplicar daño
            this.applyDamageToPlayerTarget(target, damage);
            
            // Mostrar mensaje del turno
            const message = this.getEnemyActionMessage(action, damage, target);
            this.addCombatMessage(message, 'enemy');
            
            // Actualizar displays
            this.updateTeamHealthDisplay();
            this.updateIndividualCharacterHealth();
            
            // Verificar si el objetivo murió
            if (playerTeamHealth[target.id] <= 0) {
                this.addCombatMessage(`💀 ${target.nombre} ha sido derrotado!`, 'info');
            }
            
            // Verificar si todo el equipo del jugador fue derrotado
            const alivePlayerMembers = Object.values(playerTeamHealth).filter(hp => hp > 0).length;
            if (alivePlayerMembers === 0) {
                console.log('🎯 Llamando endFight desde enemyTeamAttack - DEFEAT (todos los jugadores muertos)');
                this.endFight('defeat');
                return;
            }
            
            // Cambiar al turno del jugador
            this.currentTurn = 'player';
            this.updateTurnDisplay();
            this.enablePlayerActions();
            
        } catch (error) {
            this.addCombatMessage('Error en la acción del enemigo: ' + error.message, 'error');
        }
    },

    // Calcular daño del personaje enemigo
    calculateEnemyCharacterDamage(action, target) {
        // Verificar que el equipo enemigo esté cargado
        if (!enemyTeam || !enemyTeam.characters || enemyTeam.characters.length === 0) {
            console.error('❌ Error: enemyTeam no está cargado correctamente');
            return 0;
        }
        
        // Verificar que el objetivo tenga la propiedad nivel
        if (!target || !target.nivel) {
            console.error('❌ Error: target no tiene la propiedad nivel');
            return 0;
        }
        
        const attacker = enemyTeam.characters[Math.floor(Math.random() * enemyTeam.characters.length)];
        
        // Verificar que el atacante tenga la propiedad nivel
        if (!attacker || !attacker.nivel) {
            console.error('❌ Error: attacker no tiene la propiedad nivel');
            return 0;
        }
        
        const baseAttack = attacker.nivel * 7;
        const targetDefense = target.nivel * 3;
        
        let damage = 0;
        
        switch (action) {
            case 'basico':
                damage = Math.max(12, baseAttack - targetDefense / 2);
                break;
            case 'especial':
                damage = Math.max(25, baseAttack * 1.6 - targetDefense / 2);
                break;
            case 'critico':
                damage = Math.max(40, baseAttack * 2.2 - targetDefense / 2);
                break;
        }
        
        return Math.floor(damage + Math.random() * 8);
    },

    // Aplicar daño al objetivo del jugador
    applyDamageToPlayerTarget(target, damage) {
        playerTeamHealth[target.id] = Math.max(0, playerTeamHealth[target.id] - damage);
    },

    // Obtener mensaje de acción del enemigo
    getEnemyActionMessage(action, damage, target) {
        const attacker = enemyTeam.characters[Math.floor(Math.random() * enemyTeam.characters.length)];
        
        switch (action) {
            case 'basico':
                return `⚔️ ${attacker.nombre} ataca a ${target.nombre} causando ${damage} de daño`;
            case 'especial':
                return `🔥 ${attacker.nombre} usa habilidad especial contra ${target.nombre} causando ${damage} de daño`;
            case 'critico':
                return `💥 ${attacker.nombre} usa ataque crítico contra ${target.nombre} causando ${damage} de daño`;
        }
    },

    // Terminar pelea
    async endFight(result) {
        console.log(`🔍 endFight llamado con resultado: ${result}, fightEnded: ${fightEnded}, isFightInProgress: ${isFightInProgress}`);
        
        // Verificar si la pelea ya terminó para evitar múltiples guardados
        if (fightEnded) {
            console.log('⚠️ La pelea ya terminó, ignorando llamada adicional a endFight');
            return;
        }
        
        fightEnded = true;
        isFightInProgress = false;
        
        console.log(`🏁 Terminando pelea con resultado: ${result}`);
        
        const resultTitle = result === 'victory' ? '🏆 ¡Victoria!' : '💀 Derrota';
        const resultMessage = result === 'victory' 
            ? `¡Tu equipo ha derrotado a ${enemyTeam.nombre || enemyTeam.name || 'Equipo Enemigo'}!`
            : `Tu equipo ha sido derrotado por ${enemyTeam.nombre || enemyTeam.name || 'Equipo Enemigo'}`;
        
        this.addCombatMessage(resultMessage, result);
        
        // Guardar la pelea en el historial
        await this.saveFightToHistory(result);
        
        // Sistema de experiencia para victoria
        let experienceInfo = '';
        if (result === 'victory') {
            const totalExperience = this.calculateVictoryExperience();
            const charactersGainedExp = this.distributeExperienceToWinningTeam(totalExperience);
            
            experienceInfo = `
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(0, 255, 0, 0.1); border-radius: 8px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #4CAF50;">🎉 Experiencia Ganada</h4>
                    <p style="margin: 0; font-size: 0.9rem;">
                        Cada personaje superviviente ganó <strong>${totalExperience} XP</strong><br>
                        Personajes que ganaron experiencia: <strong>${charactersGainedExp}</strong>
                    </p>
                </div>
            `;
        }
        
        // Mostrar modal de resultado
        document.getElementById('result-title').textContent = resultTitle;
        document.getElementById('result-content').innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">
                    ${result === 'victory' ? '🏆' : '💀'}
                </div>
                <p style="font-size: 1.2rem; margin-bottom: 1rem;">${resultMessage}</p>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    ${playerTeam.nombre || playerTeam.name || 'Mi Equipo'} vs ${enemyTeam.nombre || enemyTeam.name || 'Equipo Enemigo'}
                </div>
                ${experienceInfo}
            </div>
        `;
        
        document.getElementById('result-modal').classList.remove('hidden');
    },

    // Guardar pelea en el historial
    async saveFightToHistory(result) {
        try {
            console.log(`💾 Guardando pelea en el historial... resultado: ${result}, currentFightId: ${currentFightId}`);
            
            // Verificar que no se haya guardado ya esta pelea
            if (currentFightId && currentFightId === 'saved') {
                console.log('⚠️ Esta pelea ya fue guardada, evitando duplicado');
                return;
            }
            
            // Preparar datos de la pelea
            const fightData = {
                heroes: playerTeam.characters || [],
                villanos: enemyTeam.characters || [],
                simulados: {
                    ...this.playerTeamHealth,
                    ...this.enemyTeamHealth
                },
                resultado: result,
                fecha: new Date().toISOString(),
                tipo: '3v3',
                creador: localStorage.getItem('user') || 'Usuario'
            };
            
            // Obtener token de autenticación
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No hay token de autenticación');
                return;
            }
            
            // Enviar datos al servidor usando el nuevo endpoint
            const response = await fetch('/api/fights/teams/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(fightData)
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const savedFight = await response.json();
            console.log('✅ Pelea guardada exitosamente:', savedFight);
            
            // Marcar como guardada para evitar duplicados
            currentFightId = 'saved';
            
        } catch (error) {
            console.error('❌ Error guardando pelea en el historial:', error);
            // No mostrar error al usuario para no interrumpir la experiencia
        }
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
        playerTeam = null;
        enemyTeam = null;
        currentFight = null;
        currentFightId = null;
        isFightInProgress = false;
        fightEnded = false; // Resetear flag de pelea terminada
        this.selectedTarget = null;
        this.selectedAttacker = null;
        this.currentTurn = 'player';
        this.playerTeamHealth = {};
        this.enemyTeamHealth = {};
        
        // Limpiar equipos mostrados
        document.getElementById('player-team-characters').innerHTML = '';
        document.getElementById('enemy-team-characters').innerHTML = '';
        
        // Limpiar log de combate
        document.getElementById('combat-messages').innerHTML = '<div class="log-message">La batalla de equipos ha comenzado...</div>';
        
        // Mostrar fase de selección
        document.getElementById('selection-phase').classList.remove('hidden');
        document.getElementById('combat-phase').classList.add('hidden');
        
        // Resetear botón de inicio
        document.getElementById('start-fight-btn').disabled = true;
        document.getElementById('start-fight-btn').textContent = 'Iniciar Pelea de Equipos';
    },

    // Mostrar loading
    showLoading(message) {
        console.log('Loading:', message);
    },

    // Ocultar loading
    hideLoading() {
        console.log('Loading completado');
    },

    // Mostrar error
    showError(message) {
        alert('Error: ' + message);
    },

    // Función helper para obtener el nombre correcto del archivo de imagen
    getCharacterImageName(characterName) {
        const imageMap = {
            'Cassidy': 'Cass',
            'Genji': 'Genji',
            'Hanzo': 'Hanzo',
            'Reaper': 'Reaper',
            'Moira': 'Moira',
            'Sombra': 'Sombra'
        };
        return imageMap[characterName] || characterName;
    },

    // Función de debug para verificar el estado
    async debugState() {
        console.log('=== DEBUG ESTADO EQUIPOS ===');
        
        // Verificar autenticación
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('Token:', !!token);
        console.log('User:', user);
        
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
        
        // Verificar equipos seleccionados
        console.log('Player Team:', playerTeam);
        console.log('Enemy Team:', enemyTeam);
        console.log('Current Fight ID:', currentFightId);
        console.log('Available Teams:', availableTeams);
        
        console.log('=== FIN DEBUG EQUIPOS ===');
    }
};

// ===== FUNCIONES AUXILIARES =====
function showError(message) {
    fightTeamsApp.showError(message);
}

function showLoading(message) {
    fightTeamsApp.showLoading(message);
}

function hideLoading() {
    fightTeamsApp.hideLoading();
} 