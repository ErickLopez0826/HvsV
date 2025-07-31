// ===== CONFIGURACIÓN GLOBAL =====
const API_BASE_URL = 'http://localhost:3003/api';
let currentUser = null;
let selectedTeamType = 'superheroes';
let selectedCharacters = [];
let allCharacters = [];

// ===== MAPEO DE IMÁGENES DE PERSONAJES =====
const CHARACTER_IMAGES = {
    'Genji': '../images/Personajes/Genji.webp',
    'Hanzo': '../images/Personajes/Hanzo.webp',
    'Cassidy': '../images/Personajes/Cass.webp',
    'Reaper': '../images/Personajes/Reaper.webp',
    'Moira': '../images/Personajes/Moira.webp',
    'Sombra': '../images/Personajes/Sombra.webp'
};

// Mapeo de imágenes BN para fondos de modal
const CHARACTER_BN_IMAGES = {
    'Genji': '../images/Personajes/Genji BN.webp',
    'Hanzo': '../images/Personajes/Hanzo BN.webp',
    'Cassidy': '../images/Personajes/Cass BN.webp',
    'Reaper': '../images/Personajes/Reaper BN.webp',
    'Moira': '../images/Personajes/Moira BN.webp',
    'Sombra': '../images/Personajes/Sombra BN.webp'
};

// ===== CLASE PRINCIPAL DE CREAR EQUIPO =====
class CreateTeamApp {
    constructor() {
        this.init();
    }

    init() {
        try {
            console.log('Inicializando CreateTeamApp...');
            this.checkAuthStatus();
            this.setupEventListeners();
            this.loadCharacters();
            this.updateUI();
            console.log('CreateTeamApp inicializado');
        } catch (error) {
            console.error('Error initializing CreateTeamApp:', error);
        }
    }

    // ===== VERIFICACIÓN DE ESTADO DE AUTENTICACIÓN =====
    checkAuthStatus() {
        try {
            const user = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            
            if (user && token) {
                currentUser = JSON.parse(user);
                this.updateWelcomeMessage();
            } else {
                // Para desarrollo, permitir acceso sin autenticación
                console.log('No hay sesión activa, pero permitiendo acceso para desarrollo');
                // window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    // ===== CONFIGURACIÓN DE EVENT LISTENERS =====
    setupEventListeners() {
        try {
            // Botones de navegación
            const backBtn = document.getElementById('back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    window.location.href = '/menu.html';
                });
            }

            // Selector de tipo de equipo
            document.querySelectorAll('.type-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    this.selectTeamType(e.currentTarget.dataset.type);
                });
            });

            // Botones de acciones del equipo
            const createTeamBtn = document.getElementById('create-team-btn');
            if (createTeamBtn) {
                createTeamBtn.addEventListener('click', () => {
                    this.showConfirmModal();
                });
            }

            const clearTeamBtn = document.getElementById('clear-team-btn');
            if (clearTeamBtn) {
                clearTeamBtn.addEventListener('click', () => {
                    this.clearTeam();
                });
            }

            // Búsqueda y filtros
            const characterSearch = document.getElementById('character-search');
            if (characterSearch) {
                characterSearch.addEventListener('input', (e) => {
                    this.filterCharacters();
                });
            }

            const characterFilter = document.getElementById('character-filter');
            if (characterFilter) {
                characterFilter.addEventListener('change', (e) => {
                    this.filterCharacters();
                });
            }

            // Modal de confirmación
            const confirmTeamBtn = document.getElementById('confirm-team-btn');
            if (confirmTeamBtn) {
                confirmTeamBtn.addEventListener('click', () => {
                    this.createTeam();
                });
            }

            const cancelTeamBtn = document.getElementById('cancel-team-btn');
            if (cancelTeamBtn) {
                cancelTeamBtn.addEventListener('click', () => {
                    this.hideModal();
                });
            }

            // Cerrar modal al hacer clic fuera
            const confirmModal = document.getElementById('confirm-modal');
            if (confirmModal) {
                confirmModal.addEventListener('click', (e) => {
                    if (e.target.id === 'confirm-modal') {
                        this.hideModal();
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    // ===== SELECCIÓN DE TIPO DE EQUIPO =====
    selectTeamType(type) {
        try {
            selectedTeamType = type;
            
            // Actualizar UI de las opciones
            document.querySelectorAll('.type-option').forEach(option => {
                option.classList.remove('active');
            });
            const selectedOption = document.querySelector(`[data-type="${type}"]`);
            if (selectedOption) {
                selectedOption.classList.add('active');
            }
            
            // Actualizar título del panel
            const title = type === 'superheroes' ? 'Equipo de Overwatch' : 'Equipo de Blackwatch';
            const teamTypeTitle = document.getElementById('team-type-title');
            if (teamTypeTitle) {
                teamTypeTitle.textContent = title;
            }
            
            // Recargar personajes según el tipo
            this.loadCharacters();
        } catch (error) {
            console.error('Error selecting team type:', error);
        }
    }

    // ===== CARGA DE PERSONAJES =====
    async loadCharacters() {
        try {
            this.showLoading('Cargando personajes...');
            console.log('Iniciando carga de personajes...');
            
            const response = await fetch('/api/personajes?page=1&limit=50');
            console.log('Respuesta de la API:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Datos recibidos:', data);
                allCharacters = data.data;
                
                // Filtrar personajes según el tipo
                allCharacters = allCharacters.filter(char => {
                    const isSuperheroe = char.tipo === 'superheroe';
                    return selectedTeamType === 'superheroes' ? isSuperheroe : !isSuperheroe;
                });
                
                console.log('Personajes filtrados:', allCharacters);
                this.renderCharacters();
                this.hideLoading();
            } else {
                throw new Error('Error al cargar personajes');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Error al cargar personajes: ' + error.message);
            console.error('Error loading characters:', error);
            
            // Cargar datos de ejemplo si falla la API
            console.log('Cargando personajes de ejemplo...');
            this.loadSampleCharacters();
        }
    }

    // ===== CARGA DE PERSONAJES DE EJEMPLO =====
    loadSampleCharacters() {
        try {
            console.log('Cargando personajes de ejemplo...');
            const superheroes = [
                { id: 1, nombre: 'Genji', tipo: 'superheroe', nivel: 1, vida: 100, escudo: 0, fuerza: 85 },
                { id: 2, nombre: 'Hanzo', tipo: 'superheroe', nivel: 1, vida: 100, escudo: 0, fuerza: 90 },
                { id: 3, nombre: 'Cassidy', tipo: 'superheroe', nivel: 1, vida: 100, escudo: 0, fuerza: 85 }
            ];

            const villanos = [
                { id: 4, nombre: 'Reaper', tipo: 'villano', nivel: 1, vida: 100, escudo: 0, fuerza: 95 },
                { id: 5, nombre: 'Moira', tipo: 'villano', nivel: 1, vida: 100, escudo: 0, fuerza: 60 },
                { id: 6, nombre: 'Sombra', tipo: 'villano', nivel: 1, vida: 100, escudo: 0, fuerza: 65 }
            ];

            allCharacters = selectedTeamType === 'superheroes' ? superheroes : villanos;
            console.log('Personajes de ejemplo cargados:', allCharacters);
            this.renderCharacters();
        } catch (error) {
            console.error('Error loading sample characters:', error);
        }
    }

    // ===== RENDERIZADO DE PERSONAJES =====
    renderCharacters() {
        try {
            console.log('Renderizando personajes...');
            const grid = document.getElementById('characters-grid');
            console.log('Grid encontrado:', grid);
            
            if (!grid) {
                console.error('Characters grid not found');
                return;
            }
            
            grid.innerHTML = '';

            console.log('Personajes a renderizar:', allCharacters.length);
            allCharacters.forEach(character => {
                console.log('Creando tarjeta para:', character.nombre);
                const card = this.createCharacterCard(character);
                
                grid.appendChild(card);
            });

            this.updateCharactersTitle();
            console.log('Renderizado completado');
        } catch (error) {
            console.error('Error rendering characters:', error);
        }
    }

    // ===== CREACIÓN DE TARJETA DE PERSONAJE =====
    createCharacterCard(character) {
        try {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.characterId = character.id;
            
            const isSelected = selectedCharacters.some(c => c.id === character.id);
            if (isSelected) {
                card.classList.add('selected');
            }

            // Obtener la imagen del personaje
            const characterImage = CHARACTER_IMAGES[character.nombre] || '👤';
            const isImagePath = characterImage.startsWith('../');

            card.innerHTML = `
                <div class="character-avatar">
                    ${isImagePath ? 
                        `<img src="${characterImage}" alt="${character.nombre}" class="character-image">` : 
                        `<span class="character-emoji">${characterImage}</span>`
                    }
                </div>
                <div class="character-info">
                    <div class="character-name">${character.nombre}</div>
                    <div class="character-type">${character.tipo}</div>
                    <div class="character-stats">
                        <div class="stat">
                            <span class="stat-value">${character.nivel}</span>
                            <span>Nivel</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${character.vida}</span>
                            <span>Vida</span>
                        </div>
                    </div>
                    <button class="btn btn-secondary stats-btn" data-character-id="${character.id}">
                        📊 Estadísticas
                    </button>
                </div>
            `;
            
            // Agregar event listener para selección (solo en la tarjeta, no en el botón)
            card.addEventListener('click', (e) => {
                // No seleccionar si se hace clic en el botón de estadísticas
                if (e.target.classList.contains('stats-btn') || e.target.closest('.stats-btn')) {
                    e.stopPropagation();
                    return;
                }
                this.toggleCharacterSelection(character);
            });
            
            // Event listener específico para el botón de estadísticas
            const statsBtn = card.querySelector('.stats-btn');
            if (statsBtn) {
                statsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showCharacterStats(character.id);
                });
            }
            
            return card;
        } catch (error) {
            console.error('Error creating character card:', error);
            return document.createElement('div'); // Return empty div as fallback
        }
    }

    // ===== SELECCIÓN/DESELECCIÓN DE PERSONAJES =====
    toggleCharacterSelection(character) {
        try {
            const isSelected = selectedCharacters.some(c => c.id === character.id);
            
            if (isSelected) {
                // Remover del equipo
                selectedCharacters = selectedCharacters.filter(c => c.id !== character.id);
                const characterCard = document.querySelector(`[data-character-id="${character.id}"]`);
                if (characterCard) {
                    characterCard.classList.remove('selected');
                }
            } else {
                // Validar que el personaje sea del mismo bando
                if (selectedCharacters.length > 0) {
                    const firstCharacter = selectedCharacters[0];
                    const isSuperheroe = firstCharacter.tipo === 'superheroe';
                    const isCharacterSuperheroe = character.tipo === 'superheroe';
                    
                    if (isSuperheroe !== isCharacterSuperheroe) {
                        const bandoActual = isSuperheroe ? 'Superhéroes (Overwatch)' : 'Villanos (Blackwatch)';
                        const bandoNuevo = isCharacterSuperheroe ? 'Superhéroes (Overwatch)' : 'Villanos (Blackwatch)';
                        this.showError(`No puedes mezclar personajes de diferentes bandos. Tu equipo actual es de ${bandoActual}, pero ${character.nombre} es de ${bandoNuevo}.`);
                        return;
                    }
                }
                
                // Agregar al equipo si hay espacio
                if (selectedCharacters.length < 3) {
                    selectedCharacters.push(character);
                    const characterCard = document.querySelector(`[data-character-id="${character.id}"]`);
                    if (characterCard) {
                        characterCard.classList.add('selected');
                    }
                } else {
                    this.showError('Ya tienes 3 personajes seleccionados. Remueve uno para agregar otro.');
                    return;
                }
            }

            this.updateTeamPanel();
            this.updateCreateButton();
        } catch (error) {
            console.error('Error toggling character selection:', error);
        }
    }

    // ===== ACTUALIZACIÓN DEL PANEL DEL EQUIPO =====
    updateTeamPanel() {
        try {
            const slots = document.querySelectorAll('.member-slot');
            const counter = document.getElementById('selected-count');
            const teamTypeTitle = document.getElementById('team-type-title');
            
            if (counter) {
                counter.textContent = selectedCharacters.length;
            }

            // Actualizar título del panel con información del bando
            if (teamTypeTitle) {
                if (selectedCharacters.length > 0) {
                    const bando = selectedCharacters[0].tipo === 'superheroe' ? 'Superhéroes (Overwatch)' : 'Villanos (Blackwatch)';
                    teamTypeTitle.textContent = `Equipo de ${bando} (${selectedCharacters.length}/3)`;
                } else {
                    teamTypeTitle.textContent = 'Selecciona el tipo de equipo';
                }
            }

            // Limpiar todos los slots
            slots.forEach(slot => {
                slot.classList.remove('filled');
                slot.innerHTML = `
                    <div class="slot-placeholder">
                        <span>+</span>
                        <p>Personaje ${slot.dataset.slot}</p>
                    </div>
                `;
            });

            // Llenar slots con personajes seleccionados
            selectedCharacters.forEach((character, index) => {
                const slot = slots[index];
                if (slot) {
                    slot.classList.add('filled');
                    const bandoColor = character.tipo === 'superheroe' ? '#28a745' : '#dc3545';
                    
                    // Obtener la imagen del personaje
                    const characterImage = CHARACTER_IMAGES[character.nombre] || character.imagen || '👤';
                    const isImagePath = characterImage.startsWith('../');
                    
                    slot.innerHTML = `
                        <div class="member-card">
                            <div class="member-avatar">
                                ${isImagePath ? 
                                    `<img src="${characterImage}" alt="${character.nombre}" class="member-image">` : 
                                    `<span class="member-emoji">${characterImage}</span>`
                                }
                            </div>
                            <div class="member-info">
                                <div class="member-name">${character.nombre}</div>
                                <div class="member-type" style="color: ${bandoColor}; font-weight: bold;">
                                    ${character.tipo.toUpperCase()}
                                </div>
                            </div>
                            <button class="remove-member" onclick="createTeamApp.removeFromTeam(${character.id})">×</button>
                        </div>
                    `;
                }
            });
        } catch (error) {
            console.error('Error updating team panel:', error);
        }
    }

    // ===== REMOVER PERSONAJE DEL EQUIPO =====
    removeFromTeam(characterId) {
        try {
            selectedCharacters = selectedCharacters.filter(c => c.id !== characterId);
            const characterCard = document.querySelector(`[data-character-id="${characterId}"]`);
            if (characterCard) {
                characterCard.classList.remove('selected');
            }
            this.updateTeamPanel();
            this.updateCreateButton();
        } catch (error) {
            console.error('Error removing character from team:', error);
        }
    }

    // ===== ACTUALIZACIÓN DEL BOTÓN CREAR =====
    updateCreateButton() {
        try {
            const createBtn = document.getElementById('create-team-btn');
            if (createBtn) {
                createBtn.disabled = selectedCharacters.length !== 3;
                
                if (selectedCharacters.length === 3) {
                    const bando = selectedCharacters[0].tipo === 'superheroe' ? 'Superhéroes (Overwatch)' : 'Villanos (Blackwatch)';
                    createBtn.textContent = `Crear Equipo de ${bando}`;
                } else {
                    createBtn.textContent = `Selecciona ${3 - selectedCharacters.length} más`;
                }
            }
        } catch (error) {
            console.error('Error updating create button:', error);
        }
    }

    // ===== LIMPIAR EQUIPO =====
    clearTeam() {
        try {
            selectedCharacters = [];
            document.querySelectorAll('.character-card').forEach(card => {
                card.classList.remove('selected');
            });
            this.updateTeamPanel();
            this.updateCreateButton();
            this.showSuccess('Equipo limpiado');
        } catch (error) {
            console.error('Error clearing team:', error);
        }
    }

    // ===== FILTRADO DE PERSONAJES =====
    filterCharacters() {
        try {
            const searchInput = document.getElementById('character-search');
            const filterSelect = document.getElementById('character-filter');
            
            if (!searchInput || !filterSelect) {
                return;
            }
            
            const searchTerm = searchInput.value.toLowerCase();
            const filterType = filterSelect.value;
            
            const filteredCharacters = allCharacters.filter(character => {
                const matchesSearch = character.nombre.toLowerCase().includes(searchTerm);
                const matchesFilter = !filterType || character.tipo === filterType;
                return matchesSearch && matchesFilter;
            });

            this.renderFilteredCharacters(filteredCharacters);
        } catch (error) {
            console.error('Error filtering characters:', error);
        }
    }

    // ===== RENDERIZADO DE PERSONAJES FILTRADOS =====
    renderFilteredCharacters(characters) {
        try {
            const grid = document.getElementById('characters-grid');
            if (!grid) {
                console.error('Characters grid not found');
                return;
            }
            
            grid.innerHTML = '';

            characters.forEach(character => {
                const card = this.createCharacterCard(character);
                
                grid.appendChild(card);
            });
        } catch (error) {
            console.error('Error rendering filtered characters:', error);
        }
    }

         // ===== ACTUALIZACIÓN DE TÍTULOS =====
     updateCharactersTitle() {
         try {
             const title = document.getElementById('characters-title');
             if (title) {
                 const type = selectedTeamType === 'superheroes' ? 'Overwatch' : 'Blackwatch';
                 title.textContent = `${type} Disponibles (${allCharacters.length})`;
             }
         } catch (error) {
             console.error('Error updating characters title:', error);
         }
     }

    // ===== MODAL DE CONFIRMACIÓN =====
    showConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        const summary = document.getElementById('team-summary');
        
        // Determinar el bando del equipo basado en los personajes seleccionados
        const bando = selectedCharacters[0].tipo === 'superheroe' ? 'Superhéroes (Overwatch)' : 'Villanos (Blackwatch)';
        const bandoColor = selectedCharacters[0].tipo === 'superheroe' ? '#28a745' : '#dc3545';
        
        // Generar nombre por defecto del equipo
        const defaultTeamName = `Equipo de ${bando}`;
        
        summary.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <h3 style="color: ${bandoColor}; margin-bottom: 0.5rem; text-align: center;">
                    🛡️ Equipo de ${bando} 🛡️
                </h3>
                
                <!-- Campo para nombre del equipo -->
                <div style="margin-bottom: 1rem;">
                    <label for="team-name-input" style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 600;">
                        📝 Nombre del Equipo:
                    </label>
                    <input 
                        type="text" 
                        id="team-name-input" 
                        value="${defaultTeamName}"
                        style="
                            width: 100%;
                            padding: 0.75rem;
                            background: var(--bg-tertiary);
                            border: 2px solid var(--btn-secondary);
                            border-radius: var(--border-radius-small);
                            color: var(--text-primary);
                            font-size: 1rem;
                            transition: border-color var(--transition-fast);
                        "
                        placeholder="Ingresa el nombre de tu equipo"
                        maxlength="50"
                    >
                    <small style="color: var(--text-muted); font-size: 0.8rem; display: block; margin-top: 0.25rem;">
                        Máximo 50 caracteres
                    </small>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                         ${selectedCharacters.map(char => {
                         const charBandoColor = char.tipo === 'superheroe' ? '#28a745' : '#dc3545';
                         return `
                             <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--border-radius-small); border-left: 3px solid ${charBandoColor};">
                                 <span style="font-size: 1.2rem;">${char.imagen || '👤'}</span>
                                 <span style="font-weight: 600;">${char.nombre}</span>
                                 <span style="color: ${charBandoColor}; font-size: 0.8rem; font-weight: bold;">(${char.tipo.toUpperCase()})</span>
                             </div>
                         `;
                     }).join('')}
                </div>
                <div style="margin-top: 1rem; padding: 0.5rem; background: rgba(255, 156, 0, 0.1); border-radius: var(--border-radius-small); text-align: center;">
                    <p style="color: var(--btn-primary); font-size: 0.9rem; margin: 0;">
                        ✅ Todos los personajes son del mismo bando (${bando})
                    </p>
                </div>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: center;">
                ¿Estás seguro de que quieres crear este equipo de ${bando}?
            </p>
        `;
        
        // Agregar estilos dinámicos para el input
        const input = summary.querySelector('#team-name-input');
        if (input) {
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--btn-primary)';
            });
            
            input.addEventListener('blur', () => {
                input.style.borderColor = 'var(--btn-secondary)';
            });
            
            input.addEventListener('input', () => {
                // Validar que no esté vacío
                if (input.value.trim() === '') {
                    input.style.borderColor = '#dc3545';
                } else {
                    input.style.borderColor = 'var(--btn-secondary)';
                }
            });
        }
        
        modal.classList.add('show');
    }

    hideModal() {
        document.getElementById('confirm-modal').classList.remove('show');
    }

    // ===== CREACIÓN DEL EQUIPO =====
    async createTeam() {
        try {
            // Obtener el nombre personalizado del equipo
            const teamNameInput = document.getElementById('team-name-input');
            let teamName = '';
            
            if (teamNameInput) {
                teamName = teamNameInput.value.trim();
                if (teamName === '') {
                    this.showError('Por favor, ingresa un nombre para tu equipo.');
                    return;
                }
            } else {
                // Fallback si no encuentra el input
                const bando = selectedCharacters[0].tipo === 'superheroe' ? 'Superhéroes (Overwatch)' : 'Villanos (Blackwatch)';
                teamName = `Equipo de ${bando}`;
            }
            
            this.hideModal();
            this.showLoading('Creando equipo...');
            
            // Determinar el bando basado en los personajes seleccionados
            const bando = selectedCharacters[0].tipo === 'superheroe' ? 'Superhéroes (Overwatch)' : 'Villanos (Blackwatch)';
            
            // Formato correcto para el backend
            const teamData = {
                nombreEquipo: teamName,
                ids: selectedCharacters.map(char => char.id)
            };

            // Determinar el endpoint según el tipo de equipo
            const endpoint = selectedTeamType === 'superheroes' ? 'equipos/superheroes' : 'equipos/villanos';
            
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(teamData)
            });

            if (response.ok) {
                const result = await response.json();
                this.hideLoading();
                this.showSuccess('¡Equipo creado exitosamente!');
                
                // Limpiar selección
                this.clearTeam();
                
                // Redirigir al menú después de un momento
                setTimeout(() => {
                    window.location.href = '/menu.html';
                }, 2000);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al crear el equipo');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Error al crear el equipo: ' + error.message);
            console.error('Error creating team:', error);
        }
    }

    // ===== ACTUALIZACIÓN DE INTERFAZ =====
    updateWelcomeMessage() {
        try {
            if (currentUser && currentUser.name) {
                const userNameElement = document.querySelector('.page-title');
                if (userNameElement) {
                    userNameElement.textContent = `Crear Equipo - ${currentUser.name}`;
                }
            }
        } catch (error) {
            console.error('Error updating welcome message:', error);
        }
    }

    // ===== MANEJO DE LOGOUT =====
    handleLogout() {
        try {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            currentUser = null;
            
            this.showSuccess('Sesión cerrada exitosamente');
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } catch (error) {
            console.error('Error handling logout:', error);
        }
    }

    // ===== ACTUALIZACIÓN DE UI =====
    updateUI() {
        try {
            this.updateTeamPanel();
            this.updateCreateButton();
            this.updateCharactersTitle();
        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    // ===== NOTIFICACIONES Y MENSAJES =====
    showLoading(message) {
        try {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        } catch (error) {
            console.error('Error showing loading:', error);
        }
    }

    hideLoading() {
        try {
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        } catch (error) {
            console.error('Error hiding loading:', error);
        }
    }

    showSuccess(message) {
        try {
            this.showNotification(message, 'success');
        } catch (error) {
            console.error('Error showing success message:', error);
        }
    }

    showError(message) {
        try {
            this.showNotification(message, 'error');
        } catch (error) {
            console.error('Error showing error message:', error);
        }
    }

    showInfo(message) {
        try {
            this.showNotification(message, 'info');
        } catch (error) {
            console.error('Error showing info message:', error);
        }
    }

    showNotification(message, type) {
        try {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-message">${message}</span>
                    <button class="notification-close">&times;</button>
                </div>
            `;

            document.body.appendChild(notification);

            // Auto-remover después de 3 segundos
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }, 3000);

            // Botón de cerrar
            const closeBtn = notification.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 300);
                });
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    // ===== FUNCIONES DE ESTADÍSTICAS =====
    showCharacterStats(characterId) {
        const character = allCharacters.find(char => char.id === characterId);
        if (!character) {
            this.showError('Personaje no encontrado');
            return;
        }

        console.log('Mostrando estadísticas para:', character.nombre);

        // Crear modal de estadísticas si no existe
        let statsModal = document.getElementById('character-stats-modal');
        if (!statsModal) {
            statsModal = document.createElement('div');
            statsModal.id = 'character-stats-modal';
            statsModal.className = 'modal stats-modal';
            document.body.appendChild(statsModal);
        }

        // Obtener las imágenes del personaje
        const characterImage = CHARACTER_IMAGES[character.nombre] || '../images/Personajes/Genji.webp';
        const bnImage = CHARACTER_BN_IMAGES[character.nombre] || '../images/Personajes/Genji BN.webp';

        console.log('Imagen del personaje:', characterImage);
        console.log('Imagen BN para fondo:', bnImage);

        // Actualizar contenido del modal con una única tabla de estadísticas
        statsModal.innerHTML = `
            <div class="popup-container">
                <div class="character-image">
                    <img src="${characterImage}" alt="${character.nombre}" class="main-image">
                </div>
                
                <div class="stats-table">
                    <div class="stat-item">
                        <span class="stat-label">Tipo</span>
                        <span class="stat-value">${character.tipo.toUpperCase()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Nivel</span>
                        <span class="stat-value">${character.nivel}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Vida</span>
                        <span class="stat-value">${character.vida}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Fuerza</span>
                        <span class="stat-value">${character.fuerza || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Escudo</span>
                        <span class="stat-value">${character.escudo || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Experiencia</span>
                        <span class="stat-value">${character.experiencia || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Daño Ultimate</span>
                        <span class="stat-value">${character.dañoUltimate || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Umbral Ultimate</span>
                        <span class="stat-value">${character.umbralUltimate || 0}</span>
                    </div>
                </div>
                
                <button class="close-stats-btn" onclick="createTeamApp.closeCharacterStats()">
                    <span>×</span>
                </button>
            </div>
        `;

        // Mostrar modal primero
        statsModal.classList.add('show');

        // Establecer imagen BN como fondo del modal con overlay semitransparente
        // Usar setTimeout para asegurar que el modal se haya renderizado
        setTimeout(() => {
            const backgroundStyle = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${bnImage})`;
            statsModal.style.backgroundImage = backgroundStyle;
            statsModal.style.backgroundSize = 'cover';
            statsModal.style.backgroundPosition = 'center';
            statsModal.style.backgroundRepeat = 'no-repeat';
            console.log('Fondo BN aplicado:', backgroundStyle);
            
            // Verificar que el estilo se aplicó
            console.log('Background style aplicado:', statsModal.style.backgroundImage);
        }, 200);
    }

    // Cerrar modal de estadísticas
    closeCharacterStats() {
        const statsModal = document.getElementById('character-stats-modal');
        if (statsModal) {
            statsModal.classList.remove('show');
        }
    }
}

// ===== ESTILOS CSS DINÁMICOS PARA NOTIFICACIONES =====
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        padding: 1rem;
        box-shadow: var(--shadow-heavy);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        border-left: 4px solid var(--btn-primary);
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification-success {
        border-left-color: #00FF00;
    }

    .notification-error {
        border-left-color: var(--btn-danger);
    }

    .notification-info {
        border-left-color: var(--btn-secondary);
    }

    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .notification-message {
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: 1rem;
    }

    .notification-close:hover {
        color: var(--text-primary);
    }

    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .loading-spinner {
        text-align: center;
        color: var(--text-primary);
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 3px solid var(--bg-secondary);
        border-top: 3px solid var(--btn-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .fade-out {
        opacity: 0;
        transform: translateX(100%);
    }
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
let createTeamApp;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, creando CreateTeamApp...');
    createTeamApp = new CreateTeamApp();
    console.log('CreateTeamApp creado:', createTeamApp);
});

// ===== EXPORTAR PARA USO EXTERNO =====
window.CreateTeamApp = CreateTeamApp; 