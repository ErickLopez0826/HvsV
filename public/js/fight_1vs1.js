// ===== VARIABLES GLOBALES =====
let allCharacters = [];
let selectedPlayer = null;
let selectedOpponent = null;
let currentFight = null;
let isFightInProgress = false;

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
    init() {
        this.loadCharacters();
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

    // Cargar personajes desde la API
    async loadCharacters() {
        try {
            const response = await fetch('/api/personajes?page=1&limit=50');

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
            'Reaper': 'Reaper.webp',
            'Moira': 'Moira.webp',
            'Sombra': 'Sombra.webp'
        };
        
        const imageName = imageMap[character.nombre] || 'Genji.webp';
        const imagePath = `/images/Personajes/${imageName}`;
        
        card.innerHTML = `
            <div class="character-avatar">
                <img src="${imagePath}" alt="${character.nombre}" class="character-image">
            </div>
            <div class="character-name">${character.nombre}</div>
            <div class="character-type">${character.tipo.toUpperCase()}</div>
        `;
        
        return card;
    },

    // Seleccionar personaje del jugador
    selectPlayer(character) {
        // Remover selección anterior
        document.querySelectorAll('#player-characters .character-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar nuevo personaje
        const card = document.querySelector(`#player-characters [data-character-id="${character.id}"]`);
        if (card) {
            card.classList.add('selected');
        }
        
        selectedPlayer = character;
        
        // Actualizar oponentes disponibles
        this.updateOpponents();
        
        this.updateStartButton();
    },

    // Actualizar oponentes disponibles
    updateOpponents() {
        const opponentGrid = document.getElementById('opponent-characters');
        opponentGrid.innerHTML = '';
        
        if (!selectedPlayer) {
            opponentGrid.innerHTML = '<div class="opponent-placeholder">Selecciona tu personaje para ver los oponentes disponibles</div>';
            return;
        }
        
        // Filtrar oponentes del tipo opuesto
        const playerType = selectedPlayer.tipo.toLowerCase();
        const opponents = allCharacters.filter(character => 
            character.tipo.toLowerCase() !== playerType && 
            character.id !== selectedPlayer.id
        );
        
        if (opponents.length === 0) {
            opponentGrid.innerHTML = '<div class="opponent-placeholder">No hay oponentes disponibles para este personaje</div>';
            return;
        }
        
        // Crear tarjetas de oponentes
        opponents.forEach(character => {
            const card = this.createCharacterCard(character);
            card.addEventListener('click', () => this.selectOpponent(character));
            opponentGrid.appendChild(card);
        });
        
        // Limpiar selección de oponente
        selectedOpponent = null;
        this.updateStartButton();
    },

    // Seleccionar oponente
    selectOpponent(character) {
        // Remover selección anterior
        document.querySelectorAll('#opponent-characters .character-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar nuevo personaje
        const card = document.querySelector(`#opponent-characters [data-character-id="${character.id}"]`);
        if (card) {
            card.classList.add('selected');
        }
        
        selectedOpponent = character;
        this.updateStartButton();
    },

    // Actualizar estado del botón de iniciar pelea
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

        document.getElementById('defend-btn').addEventListener('click', () => {
            this.performAction('defend');
        });
    },

    // Mostrar modal de confirmación
    showConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        const summary = document.getElementById('fight-summary');
        
        // Mapear nombres a archivos de imagen
        const imageMap = {
            'Genji': 'Genji.webp',
            'Hanzo': 'Hanzo.webp',
            'Cassidy': 'Cass.webp',
            'Reaper': 'Reaper.webp',
            'Moira': 'Moira.webp',
            'Sombra': 'Sombra.webp'
        };
        
        const playerImageName = imageMap[selectedPlayer.nombre] || 'Genji.webp';
        const opponentImageName = imageMap[selectedOpponent.nombre] || 'Genji.webp';
        
        summary.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h4 style="color: var(--accent-color); margin-bottom: 1rem;">⚔️ Resumen de la Pelea</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div style="text-align: center;">
                        <img src="/images/Personajes/${playerImageName}" alt="${selectedPlayer.nombre}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; margin-bottom: 0.5rem;">
                        <div style="font-weight: 600;">${selectedPlayer.nombre}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${selectedPlayer.tipo.toUpperCase()}</div>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">VS</div>
                    <div style="text-align: center;">
                        <img src="/images/Personajes/${opponentImageName}" alt="${selectedOpponent.nombre}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; margin-bottom: 0.5rem;">
                        <div style="font-weight: 600;">${selectedOpponent.nombre}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${selectedOpponent.tipo.toUpperCase()}</div>
                    </div>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    ¿Estás listo para la batalla?
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
            this.showLoading('Iniciando pelea...');
            
            // Crear datos de la pelea
            const fightData = {
                player: selectedPlayer,
                opponent: selectedOpponent,
                type: '1vs1',
                timestamp: new Date().toISOString()
            };
            
            // Preparar para enviar al endpoint (comentado por ahora)
            // const response = await fetch('/api/fights', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${localStorage.getItem('token')}`
            //     },
            //     body: JSON.stringify(fightData)
            // });
            
            // Por ahora, simular la respuesta
            currentFight = {
                id: Date.now(),
                ...fightData,
                status: 'active'
            };
            
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
        
        // Configurar personajes en el área de combate
        this.setupCombatArea();
        
        // Agregar mensaje inicial
        this.addCombatMessage('La batalla ha comenzado...', 'info');
        
        isFightInProgress = true;
    },

    // Configurar área de combate
    setupCombatArea() {
        // Mapear nombres a archivos de imagen
        const imageMap = {
            'Genji': 'Genji.webp',
            'Hanzo': 'Hanzo.webp',
            'Cassidy': 'Cass.webp',
            'Reaper': 'Reaper.webp',
            'Moira': 'Moira.webp',
            'Sombra': 'Sombra.webp'
        };
        
        // Configurar jugador
        const playerImageName = imageMap[selectedPlayer.nombre] || 'Genji.webp';
        const playerImagePath = `/images/Personajes/${playerImageName}`;
        const playerAvatar = document.getElementById('player-avatar');
        playerAvatar.innerHTML = `<img src="${playerImagePath}" alt="${selectedPlayer.nombre}" class="fighter-image">`;
        document.getElementById('player-name').textContent = selectedPlayer.nombre;
        document.getElementById('player-level').textContent = selectedPlayer.nivel || 1;
        document.getElementById('player-hp').textContent = selectedPlayer.vida || 100;
        document.getElementById('player-exp').textContent = selectedPlayer.experiencia || 0;
        document.getElementById('player-shield').textContent = selectedPlayer.escudo || 0;
        document.getElementById('player-strength').textContent = selectedPlayer.fuerza || 50;
        document.getElementById('player-ultimate-damage').textContent = selectedPlayer.dañoUltimate || 0;
        document.getElementById('player-ultimate-threshold').textContent = selectedPlayer.umbralUltimate || 150;
        
        // Configurar oponente
        const opponentImageName = imageMap[selectedOpponent.nombre] || 'Genji.webp';
        const opponentImagePath = `/images/Personajes/${opponentImageName}`;
        const opponentAvatar = document.getElementById('opponent-avatar');
        opponentAvatar.innerHTML = `<img src="${opponentImagePath}" alt="${selectedOpponent.nombre}" class="fighter-image">`;
        document.getElementById('opponent-name').textContent = selectedOpponent.nombre;
        document.getElementById('opponent-level').textContent = selectedOpponent.nivel || 1;
        document.getElementById('opponent-hp').textContent = selectedOpponent.vida || 100;
        document.getElementById('opponent-exp').textContent = selectedOpponent.experiencia || 0;
        document.getElementById('opponent-shield').textContent = selectedOpponent.escudo || 0;
        document.getElementById('opponent-strength').textContent = selectedOpponent.fuerza || 50;
        document.getElementById('opponent-ultimate-damage').textContent = selectedOpponent.dañoUltimate || 0;
        document.getElementById('opponent-ultimate-threshold').textContent = selectedOpponent.umbralUltimate || 150;
    },

    // Realizar acción de combate
    async performAction(action) {
        if (!isFightInProgress) return;
        
        const actionBtn = document.getElementById(`${action}-btn`);
        actionBtn.disabled = true;
        
        try {
            // Simular acción de combate
            const damage = this.calculateDamage(action);
            const message = this.getActionMessage(action, damage);
            
            this.addCombatMessage(message, action);
            
            // Actualizar HP del oponente
            const currentHP = parseInt(document.getElementById('opponent-hp').textContent);
            const newHP = Math.max(0, currentHP - damage);
            document.getElementById('opponent-hp').textContent = newHP;
            
            // Verificar si el oponente fue derrotado
            if (newHP <= 0) {
                this.endFight('victory');
                return;
            }
            
            // Simular contraataque del oponente
            setTimeout(() => {
                this.opponentAttack();
            }, 1000);
            
        } catch (error) {
            this.addCombatMessage('Error en la acción: ' + error.message, 'error');
        } finally {
            actionBtn.disabled = false;
        }
    },

    // Calcular daño
    calculateDamage(action) {
        const baseAttack = selectedPlayer.nivel * 10;
        const opponentDefense = selectedOpponent.nivel * 5;
        
        let damage = 0;
        
        switch (action) {
            case 'attack':
                damage = Math.max(10, baseAttack - opponentDefense / 2);
                break;
            case 'special':
                damage = Math.max(20, baseAttack * 1.5 - opponentDefense / 2);
                break;
            case 'defend':
                damage = Math.max(5, baseAttack / 2 - opponentDefense / 2);
                break;
        }
        
        return Math.floor(damage + Math.random() * 10);
    },

    // Obtener mensaje de acción
    getActionMessage(action, damage) {
        const playerName = selectedPlayer.nombre;
        const opponentName = selectedOpponent.nombre;
        
        switch (action) {
            case 'attack':
                return `⚔️ ${playerName} ataca a ${opponentName} causando ${damage} de daño`;
            case 'special':
                return `🔥 ${playerName} usa habilidad especial contra ${opponentName} causando ${damage} de daño`;
            case 'defend':
                return `🛡️ ${playerName} ataca con cautela a ${opponentName} causando ${damage} de daño`;
        }
    },

    // Ataque del oponente
    opponentAttack() {
        if (!isFightInProgress) return;
        
        const actions = ['attack', 'special', 'defend'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        const damage = this.calculateOpponentDamage(action);
        const message = this.getOpponentActionMessage(action, damage);
        
        this.addCombatMessage(message, 'opponent');
        
        // Actualizar HP del jugador
        const currentHP = parseInt(document.getElementById('player-hp').textContent);
        const newHP = Math.max(0, currentHP - damage);
        document.getElementById('player-hp').textContent = newHP;
        
        // Verificar si el jugador fue derrotado
        if (newHP <= 0) {
            this.endFight('defeat');
        }
    },

    // Calcular daño del oponente
    calculateOpponentDamage(action) {
        const baseAttack = selectedOpponent.nivel * 10;
        const playerDefense = selectedPlayer.nivel * 5;
        
        let damage = 0;
        
        switch (action) {
            case 'attack':
                damage = Math.max(8, baseAttack - playerDefense / 2);
                break;
            case 'special':
                damage = Math.max(15, baseAttack * 1.3 - playerDefense / 2);
                break;
            case 'defend':
                damage = Math.max(3, baseAttack / 2 - playerDefense / 2);
                break;
        }
        
        return Math.floor(damage + Math.random() * 8);
    },

    // Obtener mensaje de acción del oponente
    getOpponentActionMessage(action, damage) {
        const playerName = selectedPlayer.nombre;
        const opponentName = selectedOpponent.nombre;
        
        switch (action) {
            case 'attack':
                return `⚔️ ${opponentName} contraataca a ${playerName} causando ${damage} de daño`;
            case 'special':
                return `🔥 ${opponentName} usa habilidad especial contra ${playerName} causando ${damage} de daño`;
            case 'defend':
                return `🛡️ ${opponentName} ataca con cautela a ${playerName} causando ${damage} de daño`;
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