// ===== VARIABLES GLOBALES =====
let playerTeam = null;
let enemyTeam = null;
let currentFight = null;
let isFightInProgress = false;
let allCharacters = [];
let availableTeams = [];

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
        this.loadPlayerTeam();
        await this.loadCharacters();
        await this.loadAvailableTeams();
        this.setupEventListeners();
        this.checkAuthentication();
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
            this.showError('Error al cargar los personajes.');
        }
    },

    // Cargar equipos disponibles
    async loadAvailableTeams() {
        try {
            const response = await this.fetchWithAuth('/api/equipos');

            if (!response.ok) {
                throw new Error('Error al cargar equipos disponibles');
            }

            const data = await response.json();
            // Transformar el formato de equipos para que coincida con el esperado
            availableTeams = data.equipos.map(equipo => ({
                nombre: equipo.nombre,
                bando: equipo.integrantes[0].tipo === 'superheroe' ? 'Superhéroes (Overwatch)' : 'Villanos (Blackwatch)',
                characters: equipo.integrantes.map(integrante => {
                    // Buscar el personaje completo en allCharacters
                    const character = allCharacters.find(char => char.id === integrante.id);
                    return character || integrante;
                })
            }));
            
            console.log(`📋 Cargados ${availableTeams.length} equipos disponibles`);
            
        } catch (error) {
            console.error('Error cargando equipos disponibles:', error);
            // No mostrar error, usar equipos aleatorios
        }
    },

    // Renderizar equipo del jugador
    renderPlayerTeam() {
        if (!playerTeam) {
            document.getElementById('player-team-characters').innerHTML = 
                '<div class="no-team-message">Selecciona tu equipo para comenzar la batalla</div>';
            document.getElementById('player-team-name').textContent = 'Selecciona tu equipo';
            document.getElementById('player-team-level').textContent = '-';
            document.getElementById('player-team-power').textContent = '-';
            return;
        }

        const container = document.getElementById('player-team-characters');
        container.innerHTML = '';

        playerTeam.characters.forEach(character => {
            const card = this.createCharacterCard(character);
            container.appendChild(card);
        });

        // Actualizar nombre y estadísticas del equipo
        document.getElementById('player-team-name').textContent = playerTeam.nombre || 'Mi Equipo';
        this.updateTeamStats('player');
    },

    // Crear tarjeta de personaje
    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        
        const imageName = CHARACTER_IMAGES[character.nombre] || 'Genji.webp';
        const imagePath = imageName.replace('../', '/');
        
        card.innerHTML = `
            <div class="character-avatar">
                <img src="${imagePath}" alt="${character.nombre}" class="character-image">
            </div>
            <div class="character-name">${character.nombre}</div>
            <div class="character-type">${character.tipo.toUpperCase()}</div>
            <div class="character-stats">
                <div class="stat">
                    <span class="stat-label">Nivel</span>
                    <span class="stat-value">${character.nivel}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Vida</span>
                    <span class="stat-value">${character.vida}</span>
                </div>
            </div>
        `;
        
        return card;
    },

    // Generar equipo aleatorio
    generateRandomTeam() {
        const teamSize = 3;
        const shuffled = allCharacters.sort(() => 0.5 - Math.random());
        const randomTeam = shuffled.slice(0, teamSize);
        
        enemyTeam = {
            id: 'random-' + Date.now(),
            name: 'Equipo Aleatorio',
            characters: randomTeam
        };
        
        this.renderEnemyTeam();
        this.updateStartButton();
    },

    // Mostrar modal de selección de equipo
    showTeamSelectionModal() {
        const modal = document.getElementById('team-select-modal');
        const container = document.getElementById('available-teams');
        
        container.innerHTML = '';
        
        if (availableTeams.length === 0) {
            container.innerHTML = '<div class="no-teams-message">No hay equipos disponibles. Usa "Equipo Aleatorio" en su lugar.</div>';
        } else {
            availableTeams.forEach(team => {
                const teamCard = document.createElement('div');
                teamCard.className = 'team-card';
                teamCard.onclick = () => this.selectEnemyTeam(team);
                
                const teamPower = this.calculateTeamPower(team.characters);
                const avgLevel = Math.round(team.characters.reduce((sum, char) => sum + char.nivel, 0) / team.characters.length);
                
                teamCard.innerHTML = `
                    <div class="team-card-header">
                        <h4>${team.nombre}</h4>
                        <span class="team-type">${team.bando}</span>
                    </div>
                    <div class="team-card-stats">
                        <span>Nivel: ${avgLevel}</span>
                        <span>Poder: ${teamPower}</span>
                    </div>
                    <div class="team-card-characters">
                        ${team.characters.map(char => `
                            <div class="team-character">
                                <img src="${CHARACTER_IMAGES[char.nombre] || '../images/Personajes/Genji.webp'}" alt="${char.nombre}">
                                <span>${char.nombre}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                container.appendChild(teamCard);
            });
        }
        
        modal.classList.remove('hidden');
    },

    // Seleccionar equipo enemigo
    selectEnemyTeam(team) {
        enemyTeam = team;
        
        // Remover selección anterior
        document.querySelectorAll('.team-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar nuevo equipo
        const card = event.target.closest('.team-card');
        if (card) {
            card.classList.add('selected');
        }
        
        this.renderEnemyTeam();
        this.updateStartButton();
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
            this.cancelTeamSelection();
        }, 500);
    },

    // Cancelar selección de equipo
    cancelTeamSelection() {
        document.getElementById('team-select-modal').classList.add('hidden');
    },

    // Mostrar modal de selección de equipo del jugador
    showPlayerTeamSelectionModal() {
        const modal = document.getElementById('player-team-select-modal');
        const teamList = document.getElementById('available-player-teams');
        
        if (availableTeams.length === 0) {
            this.showError('No hay equipos disponibles. Crea equipos primero.');
            return;
        }
        
        teamList.innerHTML = '';
        
        availableTeams.forEach(team => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            teamCard.onclick = () => this.selectPlayerTeam(team);
            
            const teamPower = this.calculateTeamPower(team.characters);
            const avgLevel = Math.round(team.characters.reduce((sum, char) => sum + char.nivel, 0) / team.characters.length);
            
            teamCard.innerHTML = `
                <div class="team-card-header">
                    <h4>${team.nombre}</h4>
                    <span class="team-type">${team.bando}</span>
                </div>
                <div class="team-card-stats">
                    <span>Nivel: ${avgLevel}</span>
                    <span>Poder: ${teamPower}</span>
                </div>
                <div class="team-card-characters">
                    ${team.characters.map(char => `
                        <div class="team-character">
                            <img src="${CHARACTER_IMAGES[char.nombre] || '../images/Personajes/Genji.webp'}" alt="${char.nombre}">
                            <span>${char.nombre}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            teamList.appendChild(teamCard);
        });
        
        modal.classList.remove('hidden');
    },

    // Seleccionar equipo del jugador
    selectPlayerTeam(team) {
        playerTeam = team;
        document.getElementById('player-team-select-modal').classList.add('hidden');
        this.renderPlayerTeam();
        this.updateStartButton();
        this.showSuccess(`Equipo "${team.nombre}" seleccionado`);
    },

    // Cancelar selección de equipo del jugador
    cancelPlayerTeamSelection() {
        document.getElementById('player-team-select-modal').classList.add('hidden');
    },

    // Renderizar equipo enemigo
    renderEnemyTeam() {
        if (!enemyTeam) return;

        const container = document.getElementById('enemy-team-characters');
        container.innerHTML = '';

        enemyTeam.characters.forEach(character => {
            const card = this.createCharacterCard(character);
            container.appendChild(card);
        });

        // Actualizar estadísticas del equipo
        this.updateTeamStats('enemy');
    },

    // Actualizar estadísticas del equipo
    updateTeamStats(teamType) {
        const team = teamType === 'player' ? playerTeam : enemyTeam;
        if (!team) return;

        const avgLevel = Math.round(team.characters.reduce((sum, char) => sum + char.nivel, 0) / team.characters.length);
        const totalPower = this.calculateTeamPower(team.characters);

        document.getElementById(`${teamType}-team-level`).textContent = avgLevel;
        document.getElementById(`${teamType}-team-power`).textContent = totalPower;
        document.getElementById(`${teamType}-team-name`).textContent = team.nombre || team.name || 'Equipo';
    },

    // Calcular poder del equipo
    calculateTeamPower(characters) {
        return characters.reduce((total, char) => {
            return total + (char.nivel * 10) + char.fuerza + char.vida;
        }, 0);
    },

    // Actualizar estado del botón de iniciar pelea
    updateStartButton() {
        const startBtn = document.getElementById('start-fight-btn');
        startBtn.disabled = !playerTeam || !enemyTeam;
        
        if (playerTeam && enemyTeam) {
            startBtn.textContent = '⚔️ Iniciar Pelea de Equipos';
        } else {
            startBtn.textContent = 'Selecciona ambos equipos';
        }
    },

    // Configurar event listeners
    setupEventListeners() {
        // Botones de selección de equipo del jugador
        document.getElementById('select-player-team-btn').addEventListener('click', () => {
            this.showPlayerTeamSelectionModal();
        });

        // Botones de selección de equipo enemigo
        document.getElementById('random-team-btn').addEventListener('click', () => {
            this.generateRandomTeam();
        });

        document.getElementById('select-team-btn').addEventListener('click', () => {
            this.showTeamSelectionModal();
        });

        // Botón de iniciar pelea
        document.getElementById('start-fight-btn').addEventListener('click', () => {
            this.showConfirmModal();
        });

        // Botones de combate
        document.getElementById('attack-btn').addEventListener('click', () => {
            this.performAction('attack');
        });

        document.getElementById('special-btn').addEventListener('click', () => {
            this.performAction('special');
        });

        document.getElementById('ultimate-btn').addEventListener('click', () => {
            this.performAction('ultimate');
        });

        document.getElementById('defend-btn').addEventListener('click', () => {
            this.performAction('defend');
        });
    },

    // Mostrar modal de confirmación
    showConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        const summary = document.getElementById('fight-summary');
        
        summary.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h4 style="color: var(--accent-color); margin-bottom: 1rem;">⚔️ Resumen de la Pelea de Equipos</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-weight: 600; margin-bottom: 0.5rem;">${playerTeam.nombre || playerTeam.name || 'Mi Equipo'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${playerTeam.characters.map(c => c.nombre).join(', ')}</div>
                        <div style="font-size: 0.8rem; color: var(--accent-color);">Poder: ${this.calculateTeamPower(playerTeam.characters)}</div>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">VS</div>
                    <div style="text-align: center;">
                        <div style="font-weight: 600; margin-bottom: 0.5rem;">${enemyTeam.nombre || enemyTeam.name || 'Equipo Enemigo'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${enemyTeam.characters.map(c => c.nombre).join(', ')}</div>
                        <div style="font-size: 0.8rem; color: var(--accent-color);">Poder: ${this.calculateTeamPower(enemyTeam.characters)}</div>
                    </div>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    ¿Estás listo para la batalla de equipos?
                </p>
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
            
            // Crear datos de la pelea con el formato correcto para el backend
            // Usar nombres únicos para los equipos basados en los personajes seleccionados
            const playerTeamName = playerTeam.nombre || playerTeam.name || `EQUIPO_${playerTeam.characters.map(c => c.nombre).join('_')}`;
            const enemyTeamName = enemyTeam.nombre || enemyTeam.name || `EQUIPO_${enemyTeam.characters.map(c => c.nombre).join('_')}`;
            
            const fightData = {
                equipoHeroes: playerTeamName,
                equipoVillanos: enemyTeamName,
                atacanteId: playerTeam.characters[0].id, // ID del primer personaje del equipo del jugador
                defensorId: enemyTeam.characters[0].id,   // ID del primer personaje del equipo enemigo
                tipoAtaque: 'basico' // Ataque inicial básico
            };
            
            // Enviar al endpoint de peleas de equipos
            const token = localStorage.getItem('token');
            const response = await fetch('/api/fights/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(fightData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al iniciar la pelea de equipos');
            }
            
            const data = await response.json();
            currentFight = data;
            
            this.hideLoading();
            this.startCombat();
            
        } catch (error) {
            this.hideLoading();
            this.showError('Error al iniciar la pelea: ' + error.message);
        }
    },

    // Iniciar combate
    startCombat() {
        // Ocultar fase de selección
        document.getElementById('selection-phase').classList.add('hidden');
        
        // Mostrar área de combate
        document.getElementById('combat-phase').classList.remove('hidden');
        
        // Configurar equipos en el área de combate
        this.setupCombatArea();
        
        // Inicializar sistema de turnos
        this.initializeTurnSystem();
        
        // Agregar mensaje inicial
        this.addCombatMessage('La batalla de equipos ha comenzado...', 'info');
        
        isFightInProgress = true;
    },

    // Inicializar sistema de turnos
    initializeTurnSystem() {
        // Inicializar HP de los equipos
        playerTeam.characters.forEach(char => {
            playerTeamHealth[char.id] = char.vida;
            playerTeamExperience[char.id] = char.experiencia || 0;
        });
        
        enemyTeam.characters.forEach(char => {
            enemyTeamHealth[char.id] = char.vida;
            enemyTeamExperience[char.id] = char.experiencia || 0;
        });
        
        // Reiniciar cargas de ultimate
        playerUltimateCharge = 0;
        enemyUltimateCharge = 0;
        
        // Limpiar personajes muertos
        deadCharacters.clear();
        
        // Configurar display de objetivos
        this.updateTargetDisplay();
        
        // Configurar display del turno
        this.updateTurnDisplay();
        
        // Actualizar displays de vida y ultimate
        this.updateTeamHealthDisplay();
        this.updateUltimateDisplay();
        
        // Deshabilitar acciones inicialmente hasta que se seleccione un objetivo
        this.disablePlayerActions();
    },

    // Configurar área de combate
    setupCombatArea() {
        // Configurar equipo del jugador
        document.getElementById('player-team-title').textContent = playerTeam.nombre || playerTeam.name || 'Mi Equipo';
        document.getElementById('player-team-health').textContent = this.calculateTeamHealth(playerTeam.characters);
        this.renderCombatTeam('player', playerTeam.characters);
        
        // Configurar equipo enemigo
        document.getElementById('enemy-team-title').textContent = enemyTeam.nombre || enemyTeam.name || 'Equipo Enemigo';
        document.getElementById('enemy-team-health').textContent = this.calculateTeamHealth(enemyTeam.characters);
        this.renderCombatTeam('enemy', enemyTeam.characters);
    },

    // Renderizar equipo en combate
    renderCombatTeam(teamType, characters) {
        const container = document.getElementById(`${teamType}-team-combat`);
        container.innerHTML = '';

        characters.forEach(character => {
            const combatChar = document.createElement('div');
            combatChar.className = 'combat-character alive';
            combatChar.dataset.characterId = character.id;
            
            const imageName = CHARACTER_IMAGES[character.nombre] || 'Genji.webp';
            const imagePath = imageName.replace('../', '/');
            
            combatChar.innerHTML = `
                <div class="combat-character-avatar">
                    <img src="${imagePath}" alt="${character.nombre}" class="combat-character-image">
                </div>
                <div class="combat-character-name">${character.nombre}</div>
                <div class="combat-character-hp">${character.vida} HP</div>
            `;
            
            container.appendChild(combatChar);
        });
    },

    // Calcular vida total del equipo
    calculateTeamHealth(characters) {
        return characters.reduce((total, char) => total + char.vida, 0);
    },

    // Actualizar display de vida de equipos dinámicamente
    updateTeamHealthDisplay() {
        // Calcular vida total del equipo del jugador
        const playerTotalHealth = Object.values(playerTeamHealth).reduce((total, hp) => total + hp, 0);
        document.getElementById('player-team-health').textContent = playerTotalHealth;
        
        // Calcular vida total del equipo enemigo
        const enemyTotalHealth = Object.values(enemyTeamHealth).reduce((total, hp) => total + hp, 0);
        document.getElementById('enemy-team-health').textContent = enemyTotalHealth;
        
        // Actualizar vida individual de personajes
        this.updateIndividualCharacterHealth();
    },

    // Actualizar vida individual de personajes
    updateIndividualCharacterHealth() {
        // Actualizar personajes del equipo del jugador
        playerTeam.characters.forEach(char => {
            const charElement = document.querySelector(`#player-team-combat [data-character-id="${char.id}"]`);
            if (charElement) {
                const hpElement = charElement.querySelector('.combat-character-hp');
                const currentHP = playerTeamHealth[char.id] || 0;
                hpElement.textContent = `${currentHP} HP`;
                
                // Marcar como muerto si HP <= 0
                if (currentHP <= 0) {
                    charElement.classList.remove('alive');
                    charElement.classList.add('dead');
                    deadCharacters.add(char.id);
                } else {
                    charElement.classList.remove('dead');
                    charElement.classList.add('alive');
                    deadCharacters.delete(char.id);
                }
            }
        });
        
        // Actualizar personajes del equipo enemigo
        enemyTeam.characters.forEach(char => {
            const charElement = document.querySelector(`#enemy-team-combat [data-character-id="${char.id}"]`);
            if (charElement) {
                const hpElement = charElement.querySelector('.combat-character-hp');
                const currentHP = enemyTeamHealth[char.id] || 0;
                hpElement.textContent = `${currentHP} HP`;
                
                // Marcar como muerto si HP <= 0
                if (currentHP <= 0) {
                    charElement.classList.remove('alive');
                    charElement.classList.add('dead');
                    deadCharacters.add(char.id);
                } else {
                    charElement.classList.remove('dead');
                    charElement.classList.add('alive');
                    deadCharacters.delete(char.id);
                }
            }
        });
    },

    // Actualizar display de ultimate
    updateUltimateDisplay() {
        const ultimateBtn = document.getElementById('ultimate-btn');
        if (playerUltimateCharge >= ultimateChargeThreshold) {
            ultimateBtn.disabled = false;
            ultimateBtn.textContent = `⭐ Ultimate (${playerUltimateCharge}/${ultimateChargeThreshold})`;
        } else {
            ultimateBtn.disabled = true;
            ultimateBtn.textContent = `⭐ Ultimate (${playerUltimateCharge}/${ultimateChargeThreshold})`;
        }
    },

    // Cargar ultimate basado en daño o kills
    chargeUltimate(damage, isKill = false) {
        const chargeAmount = isKill ? 50 : Math.floor(damage / 2);
        playerUltimateCharge = Math.min(ultimateChargeThreshold, playerUltimateCharge + chargeAmount);
        this.updateUltimateDisplay();
        
        if (playerUltimateCharge >= ultimateChargeThreshold) {
            this.addCombatMessage('⭐ ¡Ultimate cargado!', 'ultimate');
        }
    },

    // Sistema de experiencia
    addExperienceToCharacter(characterId, experienceGained) {
        if (!playerTeamExperience[characterId]) {
            playerTeamExperience[characterId] = 0;
        }
        
        const currentExp = playerTeamExperience[characterId];
        const newExp = currentExp + experienceGained;
        
        // Verificar si sube de nivel
        if (newExp >= 100) {
            const levelsGained = Math.floor(newExp / 100);
            const excessExp = newExp % 100;
            
            // Encontrar el personaje y subir su nivel
            const character = playerTeam.characters.find(char => char.id === characterId);
            if (character) {
                character.nivel += levelsGained;
                this.addCombatMessage(`🎉 ${character.nombre} subió ${levelsGained} nivel(es)!`, 'levelup');
            }
            
            playerTeamExperience[characterId] = excessExp;
        } else {
            playerTeamExperience[characterId] = newExp;
        }
    },

    // Calcular experiencia ganada por victoria
    calculateVictoryExperience() {
        const baseExp = 50; // Experiencia base por victoria
        const enemyLevel = enemyTeam.characters.reduce((total, char) => total + char.nivel, 0) / enemyTeam.characters.length;
        const levelBonus = Math.floor(enemyLevel * 5);
        
        return baseExp + levelBonus;
    },

    // Distribuir experiencia al equipo ganador
    distributeExperienceToWinningTeam(experiencePerCharacter) {
        const aliveCharacters = playerTeam.characters.filter(char => !deadCharacters.has(char.id));
        
        aliveCharacters.forEach(char => {
            this.addExperienceToCharacter(char.id, experiencePerCharacter);
        });
        
        return aliveCharacters.length;
    },

    // Variables para el sistema de turnos
    selectedTarget: null,
    currentTurn: 'player', // 'player' o 'enemy'

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
            // Calcular daño basado en el personaje atacante y objetivo
            const damage = this.calculateCharacterDamage(action, this.selectedTarget);
            const message = this.getActionMessage(action, damage, this.selectedTarget);
            
            this.addCombatMessage(message, action);
            
            // Aplicar daño al objetivo específico
            this.applyDamageToTarget(this.selectedTarget, damage);
            
            // Cargar ultimate basado en daño
            this.chargeUltimate(damage);
            
            // Verificar si el objetivo murió
            if (enemyTeamHealth[this.selectedTarget.id] <= 0) {
                this.addCombatMessage(`💀 ${this.selectedTarget.nombre} ha sido derrotado!`, 'info');
                // Cargar ultimate adicional por kill
                this.chargeUltimate(0, true);
                this.updateTargetDisplay();
            }
            
            // Actualizar display de vida
            this.updateTeamHealthDisplay();
            
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
            case 'attack':
                damage = Math.max(15, baseAttack - targetDefense / 2);
                break;
            case 'special':
                damage = Math.max(30, baseAttack * 1.8 - targetDefense / 2);
                break;
            case 'ultimate':
                damage = Math.max(50, baseAttack * 2.5 - targetDefense / 2);
                break;
        }
        
        return Math.floor(damage + Math.random() * 15);
    },

    // Aplicar daño al objetivo específico
    applyDamageToTarget(target, damage) {
        if (enemyTeamHealth[target.id]) {
            enemyTeamHealth[target.id] = Math.max(0, enemyTeamHealth[target.id] - damage);
        }
        this.updateTargetDisplay();
    },

    // Seleccionar objetivo enemigo
    selectTarget(target) {
        if (this.currentTurn !== 'player' || !isFightInProgress) return;
        
        // Remover selección anterior
        document.querySelectorAll('.target-character.selected').forEach(char => {
            char.classList.remove('selected');
        });
        
        // Seleccionar nuevo objetivo
        const targetElement = document.querySelector(`[data-target-id="${target.id}"]`);
        if (targetElement && !targetElement.classList.contains('dead')) {
            targetElement.classList.add('selected');
            this.selectedTarget = target;
            this.enablePlayerActions();
        }
    },

    // Habilitar acciones del jugador
    enablePlayerActions() {
        document.getElementById('attack-btn').disabled = false;
        document.getElementById('special-btn').disabled = false;
        document.getElementById('ultimate-btn').disabled = false;
    },

    // Deshabilitar acciones del jugador
    disablePlayerActions() {
        document.getElementById('attack-btn').disabled = true;
        document.getElementById('special-btn').disabled = true;
        document.getElementById('ultimate-btn').disabled = true;
        
        // Remover selección de objetivo
        document.querySelectorAll('.target-character.selected').forEach(char => {
            char.classList.remove('selected');
        });
        this.selectedTarget = null;
    },

    // Actualizar display de objetivos
    updateTargetDisplay() {
        const targetContainer = document.getElementById('enemy-targets');
        targetContainer.innerHTML = '';
        
        // Solo mostrar personajes vivos como objetivos
        const aliveEnemies = enemyTeam.characters.filter(char => !deadCharacters.has(char.id));
        
        if (aliveEnemies.length === 0) {
            targetContainer.innerHTML = '<div class="no-targets">No hay objetivos disponibles</div>';
            return;
        }
        
        aliveEnemies.forEach(char => {
            const targetElement = document.createElement('div');
            targetElement.className = 'target-character';
            targetElement.dataset.targetId = char.id;
            targetElement.onclick = () => this.selectTarget(char);
            
            const imageName = CHARACTER_IMAGES[char.nombre] || 'Genji.webp';
            const imagePath = imageName.replace('../', '/');
            
            targetElement.innerHTML = `
                <img src="${imagePath}" alt="${char.nombre}">
                <div class="character-name">${char.nombre}</div>
                <div class="character-hp">${Math.max(0, enemyTeamHealth[char.id] || char.vida)} HP</div>
            `;
            
            targetContainer.appendChild(targetElement);
        });
    },

    // Actualizar display del turno
    updateTurnDisplay() {
        const turnInfo = document.getElementById('current-turn');
        const turnContainer = document.querySelector('.turn-info');
        
        if (this.currentTurn === 'player') {
            turnInfo.textContent = 'Turno: Tu equipo';
            turnContainer.classList.remove('enemy-turn');
        } else {
            turnInfo.textContent = 'Turno: Equipo enemigo';
            turnContainer.classList.add('enemy-turn');
        }
    },

    // Obtener mensaje de acción
    getActionMessage(action, damage, target) {
        const attacker = playerTeam.characters[Math.floor(Math.random() * playerTeam.characters.length)];
        
        switch (action) {
            case 'attack':
                return `⚔️ ${attacker.nombre} ataca a ${target.nombre} causando ${damage} de daño`;
            case 'special':
                return `🔥 ${attacker.nombre} usa habilidad especial contra ${target.nombre} causando ${damage} de daño`;
            case 'ultimate':
                return `⭐ ${attacker.nombre} usa ultimate contra ${target.nombre} causando ${damage} de daño`;
        }
    },

    // Actualizar vida del equipo
    updateTeamHealth(teamType, damage) {
        const healthElement = document.getElementById(`${teamType}-team-health`);
        const currentHealth = parseInt(healthElement.textContent);
        const newHealth = Math.max(0, currentHealth - damage);
        healthElement.textContent = newHealth;
        
        // Actualizar personajes individuales
        this.updateIndividualCharacters(teamType, damage);
    },

    // Actualizar personajes individuales
    updateIndividualCharacters(teamType, totalDamage) {
        const characters = teamType === 'player' ? playerTeam.characters : enemyTeam.characters;
        const damagePerChar = Math.floor(totalDamage / characters.length);
        
        characters.forEach((character, index) => {
            const charElement = document.querySelector(`#${teamType}-team-combat [data-character-id="${character.id}"]`);
            if (charElement) {
                const hpElement = charElement.querySelector('.combat-character-hp');
                const currentHP = parseInt(hpElement.textContent);
                const newHP = Math.max(0, currentHP - damagePerChar);
                hpElement.textContent = `${newHP} HP`;
                
                if (newHP <= 0) {
                    charElement.classList.remove('alive');
                    charElement.classList.add('dead');
                }
            }
        });
    },

    // Ataque del equipo enemigo
    enemyTeamAttack() {
        if (!isFightInProgress || this.currentTurn !== 'enemy') return;
        
        // Seleccionar un personaje aleatorio del equipo enemigo como atacante (solo vivos)
        const aliveEnemyAttackers = enemyTeam.characters.filter(char => !deadCharacters.has(char.id));
        if (aliveEnemyAttackers.length === 0) {
            this.endFight('victory');
            return;
        }
        
        const attacker = aliveEnemyAttackers[Math.floor(Math.random() * aliveEnemyAttackers.length)];
        
        // Seleccionar un personaje aleatorio del equipo del jugador como objetivo (solo vivos)
        const alivePlayers = playerTeam.characters.filter(char => !deadCharacters.has(char.id));
        if (alivePlayers.length === 0) {
            this.endFight('defeat');
            return;
        }
        
        const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
        
        // Seleccionar acción aleatoria del enemigo
        const actions = ['attack', 'special', 'ultimate'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        // Calcular daño del enemigo
        const damage = this.calculateEnemyCharacterDamage(randomAction, target);
        const message = this.getEnemyActionMessage(randomAction, damage, target);
        
        this.addCombatMessage(message, 'enemy');
        
        // Aplicar daño al objetivo específico
        this.applyDamageToPlayerTarget(target, damage);
        
        // Verificar si el objetivo murió
        if (playerTeamHealth[target.id] <= 0) {
            this.addCombatMessage(`💀 ${target.nombre} ha sido derrotado!`, 'info');
        }
        
        // Actualizar display de vida
        this.updateTeamHealthDisplay();
        
        // Verificar si todo el equipo del jugador fue derrotado
        const alivePlayersAfter = Object.values(playerTeamHealth).filter(hp => hp > 0).length;
        if (alivePlayersAfter === 0) {
            this.endFight('defeat');
            return;
        }
        
        // Cambiar al turno del jugador
        this.currentTurn = 'player';
        this.updateTurnDisplay();
        this.enablePlayerActions();
    },

    // Calcular daño de personaje enemigo específico
    calculateEnemyCharacterDamage(action, target) {
        // Seleccionar un personaje aleatorio del equipo enemigo como atacante
        const attacker = enemyTeam.characters[Math.floor(Math.random() * enemyTeam.characters.length)];
        
        const baseAttack = attacker.nivel * 7;
        const targetDefense = target.nivel * 3;
        
        let damage = 0;
        
        switch (action) {
            case 'attack':
                damage = Math.max(12, baseAttack - targetDefense / 2);
                break;
            case 'special':
                damage = Math.max(25, baseAttack * 1.6 - targetDefense / 2);
                break;
            case 'ultimate':
                damage = Math.max(40, baseAttack * 2.2 - targetDefense / 2);
                break;
        }
        
        return Math.floor(damage + Math.random() * 12);
    },

    // Aplicar daño al objetivo del jugador
    applyDamageToPlayerTarget(target, damage) {
        if (playerTeamHealth[target.id]) {
            playerTeamHealth[target.id] = Math.max(0, playerTeamHealth[target.id] - damage);
        }
    },

    // Obtener mensaje de acción del enemigo
    getEnemyActionMessage(action, damage, target) {
        const attacker = enemyTeam.characters[Math.floor(Math.random() * enemyTeam.characters.length)];
        
        switch (action) {
            case 'attack':
                return `⚔️ ${attacker.nombre} ataca a ${target.nombre} causando ${damage} de daño`;
            case 'special':
                return `🔥 ${attacker.nombre} usa habilidad especial contra ${target.nombre} causando ${damage} de daño`;
            case 'ultimate':
                return `⭐ ${attacker.nombre} usa ultimate contra ${target.nombre} causando ${damage} de daño`;
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
        isFightInProgress = false;
        this.selectedTarget = null;
        this.currentTurn = 'player';
        this.playerTeamHealth = {};
        this.enemyTeamHealth = {};
        
        // Limpiar equipos mostrados
        document.getElementById('player-team-display').innerHTML = '';
        document.getElementById('enemy-team-display').innerHTML = '';
        
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

    // Mostrar estadísticas del personaje

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