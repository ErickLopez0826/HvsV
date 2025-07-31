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
let ultimateChargeThreshold = 100; // Puntos necesarios para cargar ultimate

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
        this.selectedTarget = null;
        
        // Inicializar vida de equipos
        playerTeam.characters.forEach(char => {
            playerTeamHealth[char.id] = 100;
        });
        
        enemyTeam.characters.forEach(char => {
            enemyTeamHealth[char.id] = 100;
        });
        
        this.updateTeamHealthDisplay();
        this.updateTurnDisplay();
        this.enablePlayerActions();
    },

    // Configurar área de combate
    setupCombatArea() {
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
                    ${characters.map(char => `
                        <div class="combat-character" data-character-id="${char.id}">
                            <img src="../images/Personajes/${this.getCharacterImageName(char.nombre)}.webp" alt="${char.nombre}" class="combat-image">
                            <div class="character-health">
                                <div class="health-bar">
                                    <div class="health-fill" style="width: 100%"></div>
                                </div>
                                <span class="health-text">100/100</span>
                            </div>
                            <span class="character-name">${char.nombre}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Calcular vida total del equipo
    calculateTeamHealth(characters) {
        return characters.reduce((total, char) => total + (playerTeamHealth[char.id] || 100), 0);
    },

    // Actualizar display de vida del equipo
    updateTeamHealthDisplay() {
        const playerHealth = this.calculateTeamHealth(playerTeam.characters);
        const enemyHealth = this.calculateTeamHealth(enemyTeam.characters);
        
        document.getElementById('player-team-health').textContent = playerHealth;
        document.getElementById('enemy-team-health').textContent = enemyHealth;
    },

    // Actualizar vida individual de personajes
    updateIndividualCharacterHealth() {
        // Actualizar personajes del jugador
        playerTeam.characters.forEach(char => {
            const charElement = document.querySelector(`[data-character-id="${char.id}"]`);
            if (charElement) {
                const health = playerTeamHealth[char.id] || 100;
                const healthBar = charElement.querySelector('.health-fill');
                const healthText = charElement.querySelector('.health-text');
                
                if (healthBar) {
                    healthBar.style.width = `${Math.max(0, health)}%`;
                }
                if (healthText) {
                    healthText.textContent = `${Math.max(0, Math.floor(health))}/100`;
                }
                
                if (health <= 0) {
                    charElement.classList.add('dead');
                }
            }
        });
        
        // Actualizar personajes enemigos
        enemyTeam.characters.forEach(char => {
            const charElement = document.querySelector(`[data-character-id="${char.id}"]`);
            if (charElement) {
                const health = enemyTeamHealth[char.id] || 100;
                const healthBar = charElement.querySelector('.health-fill');
                const healthText = charElement.querySelector('.health-text');
                
                if (healthBar) {
                    healthBar.style.width = `${Math.max(0, health)}%`;
                }
                if (healthText) {
                    healthText.textContent = `${Math.max(0, Math.floor(health))}/100`;
                }
                
                if (health <= 0) {
                    charElement.classList.add('dead');
                }
            }
        });
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
        const baseCharge = damage * 0.1;
        const killBonus = isKill ? 20 : 0;
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
        
        if (!this.selectedTarget) {
            this.addCombatMessage('⚠️ Debes seleccionar un objetivo enemigo primero', 'error');
            return;
        }
        
        // Verificar si el objetivo está muerto
        if (deadCharacters.has(this.selectedTarget.id)) {
            this.addCombatMessage('⚠️ No puedes atacar a un personaje muerto', 'error');
            return;
        }
        
        // Verificar si ultimate está disponible
        if (action === 'ultimate' && playerUltimateCharge < ultimateChargeThreshold) {
            this.addCombatMessage('⚠️ Ultimate no está completamente cargado', 'error');
            return;
        }
        
        const actionBtn = document.getElementById(`${action}-btn`);
        actionBtn.disabled = true;
        
        try {
            // Realizar acción en la API
            const response = await this.fetchWithAuth('/api/fights/teams', {
                method: 'POST',
                body: JSON.stringify({
                    fightId: currentFightId,
                    atacanteId: playerTeam.characters[0].id, // Seleccionar atacante aleatorio
                    defensorId: this.selectedTarget.id,
                    tipoAtaque: action
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al realizar la acción');
            }
            
            const fightData = await response.json();
            
            // Actualizar información de la pelea
            if (fightData.equipoHeroes) {
                fightData.equipoHeroes.forEach(hero => {
                    playerTeamHealth[hero.id] = hero.vida;
                });
            }
            if (fightData.equipoVillanos) {
                fightData.equipoVillanos.forEach(villain => {
                    enemyTeamHealth[villain.id] = villain.vida;
                });
            }
            
            // Mostrar mensaje del turno
            if (fightData.turno) {
                const message = `${fightData.turno.atacante} ataca a ${fightData.turno.defensor}: ${fightData.turno.descripcion}`;
                this.addCombatMessage(message, action);
            }
            
            // Actualizar displays
            this.updateTeamHealthDisplay();
            this.updateIndividualCharacterHealth();
            
            // Verificar si el objetivo murió
            if (enemyTeamHealth[this.selectedTarget.id] <= 0) {
                this.addCombatMessage(`💀 ${this.selectedTarget.nombre} ha sido derrotado!`, 'info');
                deadCharacters.add(this.selectedTarget.id);
                this.updateTargetDisplay();
            }
            
            // Verificar si todo el equipo enemigo fue derrotado
            const aliveEnemies = Object.values(enemyTeamHealth).filter(hp => hp > 0).length;
            if (aliveEnemies === 0) {
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
        // Seleccionar un personaje aleatorio del equipo del jugador como atacante
        const attacker = playerTeam.characters[Math.floor(Math.random() * playerTeam.characters.length)];
        
        const baseAttack = attacker.nivel * 8;
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

    // Seleccionar objetivo
    selectTarget(target) {
        this.selectedTarget = target;
        this.updateTargetDisplay();
    },

    // Habilitar acciones del jugador
    enablePlayerActions() {
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.classList.remove('disabled');
        }
    },

    // Deshabilitar acciones del jugador
    disablePlayerActions() {
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.classList.add('disabled');
        }
    },

    // Actualizar display de objetivo
    updateTargetDisplay() {
        const targetDisplay = document.getElementById('selected-target');
        
        if (this.selectedTarget && enemyTeamHealth[this.selectedTarget.id] > 0) {
            targetDisplay.innerHTML = `
                <div class="target-info">
                    <img src="../images/Personajes/${this.selectedTarget.nombre}.webp" alt="${this.selectedTarget.nombre}" class="target-image">
                    <div class="target-details">
                        <h4>${this.selectedTarget.nombre}</h4>
                        <p>Vida: ${Math.max(0, Math.floor(enemyTeamHealth[this.selectedTarget.id]))}/100</p>
                    </div>
                </div>
            `;
        } else {
            targetDisplay.innerHTML = '<p>Selecciona un objetivo</p>';
        }
    },

    // Actualizar display de turno
    updateTurnDisplay() {
        const turnDisplay = document.getElementById('current-turn');
        turnDisplay.textContent = `Turno: ${this.currentTurn === 'player' ? 'Tu equipo' : 'Equipo enemigo'}`;
    },

    // Obtener mensaje de acción
    getActionMessage(action, damage, target) {
        const attacker = playerTeam.characters[Math.floor(Math.random() * playerTeam.characters.length)];
        
        switch (action) {
            case 'basico':
                return `⚔️ ${attacker.nombre} ataca a ${target.nombre} causando ${damage} de daño`;
            case 'especial':
                return `🔥 ${attacker.nombre} usa habilidad especial contra ${target.nombre} causando ${damage} de daño`;
            case 'ultimate':
                return `💥 ${attacker.nombre} usa ultimate contra ${target.nombre} causando ${damage} de daño`;
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
            this.endFight('defeat');
            return;
        }
        
        const target = alivePlayerMembers[Math.floor(Math.random() * alivePlayerMembers.length)];
        const actions = ['basico', 'especial', 'critico'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        try {
            // Realizar acción del enemigo en la API
            const response = await this.fetchWithAuth('/api/fights/teams', {
                method: 'POST',
                body: JSON.stringify({
                    fightId: currentFightId,
                    atacanteId: enemyTeam.characters[0].id, // Seleccionar atacante aleatorio
                    defensorId: target.id,
                    tipoAtaque: action
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al realizar la acción del enemigo');
            }
            
            const fightData = await response.json();
            
            // Actualizar información de la pelea
            if (fightData.equipoHeroes) {
                fightData.equipoHeroes.forEach(hero => {
                    playerTeamHealth[hero.id] = hero.vida;
                });
            }
            if (fightData.equipoVillanos) {
                fightData.equipoVillanos.forEach(villain => {
                    enemyTeamHealth[villain.id] = villain.vida;
                });
            }
            
            // Mostrar mensaje del turno
            if (fightData.turno) {
                const message = `${fightData.turno.atacante} ataca a ${fightData.turno.defensor}: ${fightData.turno.descripcion}`;
                this.addCombatMessage(message, 'enemy');
            }
            
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
        const attacker = enemyTeam.characters[Math.floor(Math.random() * enemyTeam.characters.length)];
        
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
    endFight(result) {
        isFightInProgress = false;
        
        const resultTitle = result === 'victory' ? '🏆 ¡Victoria!' : '💀 Derrota';
        const resultMessage = result === 'victory' 
            ? `¡Tu equipo ha derrotado a ${enemyTeam.nombre || enemyTeam.name || 'Equipo Enemigo'}!`
            : `Tu equipo ha sido derrotado por ${enemyTeam.nombre || enemyTeam.name || 'Equipo Enemigo'}`;
        
        this.addCombatMessage(resultMessage, result);
        
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
        this.selectedTarget = null;
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