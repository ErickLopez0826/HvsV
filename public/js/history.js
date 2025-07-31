// ===== HISTORIAL DE BATALLAS =====

class HistoryManager {
    constructor() {
        this.fights = [];
        this.filteredFights = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilters = {
            type: '',
            sortBy: 'newest'
        };
        
        // Mapeo de nombres de personajes a nombres de archivos de imagen
        this.characterImageMap = {
            'Genji': 'Genji',
            'Hanzo': 'Hanzo',
            'Cassidy': 'Cass',
            'Reaper': 'Reaper',
            'Moira': 'Moira',
            'Sombra': 'Sombra'
        };
        
        this.init();
    }
    
    init() {
        console.log('📜 Inicializando Historial de Batallas...');
        
        // Verificar autenticación
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log('Token disponible:', !!token);
        console.log('Usuario:', user);
        
        if (!token || !user) {
            console.error('Usuario no autenticado');
            this.showError('Debes iniciar sesión para ver el historial');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }
        
        this.bindEvents();
        this.loadFights();
    }
    
    bindEvents() {
        // Botón volver al menú
        document.getElementById('back-to-menu').addEventListener('click', () => {
            window.location.href = 'menu.html';
        });
        
        // Botón eliminar todo el historial
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            this.clearAllHistory();
        });
        
        // Filtros
        document.getElementById('fight-type-filter').addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('date-filter').addEventListener('change', (e) => {
            this.currentFilters.sortBy = e.target.value;
            this.applyFilters();
        });
        
        // Paginación
        document.getElementById('prev-page').addEventListener('click', () => {
            this.goToPage(this.currentPage - 1);
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            this.goToPage(this.currentPage + 1);
        });
    }
    
    async loadFights() {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/fights');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Datos recibidos de la API:', data);
            
            this.fights = data.fights || data || [];
            console.log('Peleas cargadas:', this.fights);
            
            // Debug: Mostrar estructura de cada pelea
            this.fights.forEach((fight, index) => {
                console.log(`Pelea ${index + 1}:`, {
                    fightId: fight.fightId,
                    tipo: fight.tipo,
                    heroes: fight.heroes ? fight.heroes.length : 'no',
                    villanos: fight.villanos ? fight.villanos.length : 'no',
                    personaje1: fight.personaje1 ? 'sí' : 'no',
                    personaje2: fight.personaje2 ? 'sí' : 'no',
                    winner: fight.winner ? 'sí' : 'no',
                    fecha: fight.fecha,
                    resultado: fight.resultado,
                    simulados: fight.simulados ? Object.keys(fight.simulados).length : 'no'
                });
                
                // Mostrar detalles completos de peleas para debug
                if (index === 0) {
                    console.log('Detalles completos de la primera pelea:', fight);
                }
                // Mostrar detalles de peleas sin resultado
                if (!fight.resultado) {
                    console.log(`Pelea ${index + 1} SIN RESULTADO - Detalles completos:`, fight);
                }
            });
            
            this.applyFilters();
            
        } catch (error) {
            console.error('Error cargando batallas:', error);
            this.showError('Error al cargar el historial de batallas');
        } finally {
            this.showLoading(false);
        }
    }
    
    // Método auxiliar para obtener el nombre correcto de la imagen del personaje
    getCharacterImageName(characterName) {
        return this.characterImageMap[characterName] || characterName;
    }
    
    applyFilters() {
        this.filteredFights = [...this.fights];
        console.log('Peleas antes de filtrar:', this.filteredFights);
        
        // Filtrar por tipo
        if (this.currentFilters.type) {
            this.filteredFights = this.filteredFights.filter(fight => {
                // Determinar tipo de pelea basado en la estructura
                const isTeamFight = fight.heroes && fight.villanos;
                const isNewStructureFight = fight.personaje1 && fight.personaje2;
                const isOldStructureFight = fight.winner;
                
                let fightType = 'unknown';
                if (isTeamFight) {
                    fightType = '3v3';
                } else if (isNewStructureFight || isOldStructureFight) {
                    fightType = '1v1';
                }
                
                console.log('Fight:', fight, 'fightType:', fightType);
                
                if (this.currentFilters.type === '1v1') {
                    return fightType === '1v1';
                } else if (this.currentFilters.type === '3v3') {
                    return fightType === '3v3';
                }
                return true;
            });
        }
        
        console.log('Peleas después de filtrar:', this.filteredFights);
        
        // Ordenar
        this.filteredFights.sort((a, b) => {
            const dateA = new Date(a.fecha || a.date || a.createdAt || a.timestamp || a.fightId);
            const dateB = new Date(b.fecha || b.date || b.createdAt || b.timestamp || b.fightId);
            
            if (this.currentFilters.sortBy === 'newest') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });
        
        this.currentPage = 1;
        this.renderFights();
        this.updatePagination();
    }
    
    renderFights() {
        const fightsList = document.getElementById('fights-list');
        const emptyState = document.getElementById('empty-state');
        
        if (this.filteredFights.length === 0) {
            fightsList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentFights = this.filteredFights.slice(startIndex, endIndex);
        
        fightsList.innerHTML = currentFights.map(fight => this.createFightCard(fight)).join('');
    }
    
    createFightCard(fight) {
        // Determinar el tipo de batalla basado en la estructura de datos
        const isTeamFight = fight.heroes && fight.villanos;
        const isNewStructureFight = fight.personaje1 && fight.personaje2;
        const isOldStructureFight = fight.winner;
        
        let fightType = 'unknown';
        if (isTeamFight) {
            fightType = '3v3';
        } else if (isNewStructureFight || isOldStructureFight) {
            fightType = '1v1';
        }
        
        // Usar la fecha actual si no hay fecha en los datos
        const fightDate = new Date(fight.fecha || fight.date || fight.createdAt || fight.timestamp || Date.now());
        const formattedDate = fightDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let participantsHTML = '';
        let resultHTML = '';
        
        if (isTeamFight) {
            // Batalla de equipos
            const heroes = fight.heroes || [];
            const villains = fight.villanos || [];
            
            participantsHTML = `
                <div class="fight-participants">
                    <div class="participant">
                        <div class="team-participants">
                            ${heroes.map(hero => `
                                <div class="team-member">
                                    <img src="../images/Personajes/${this.getCharacterImageName(hero.nombre) || 'Genji'}.webp" 
                                         alt="${hero.nombre || 'Héroe'}" 
                                         class="team-member-image"
                                         onerror="this.src='../images/Personajes/default.webp'">
                                    <span class="team-member-name">${hero.nombre || 'Héroe'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="vs-separator">VS</div>
                    
                    <div class="participant">
                        <div class="team-participants">
                            ${villains.map(villain => `
                                <div class="team-member">
                                    <img src="../images/Personajes/${this.getCharacterImageName(villain.nombre) || 'Reaper'}.webp" 
                                         alt="${villain.nombre || 'Villano'}" 
                                         class="team-member-image"
                                         onerror="this.src='../images/Personajes/default.webp'">
                                    <span class="team-member-name">${villain.nombre || 'Villano'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else if (isNewStructureFight) {
            // Batalla 1v1 con nueva estructura
            const personaje1 = fight.personaje1 || {};
            const personaje2 = fight.personaje2 || {};
            
            participantsHTML = `
                <div class="fight-participants">
                    <div class="participant">
                        <img src="../images/Personajes/${this.getCharacterImageName(personaje1.nombre) || 'Genji'}.webp" 
                             alt="${personaje1.nombre || 'Héroe'}" 
                             class="participant-image"
                             onerror="this.src='../images/Personajes/default.webp'">
                        <div class="participant-name">${personaje1.nombre || 'Héroe'}</div>
                        <div class="participant-type">${personaje1.tipo === 'superheroe' ? 'HÉROE' : 'VILLANO'}</div>
                    </div>
                    
                    <div class="vs-separator">VS</div>
                    
                    <div class="participant">
                        <img src="../images/Personajes/${this.getCharacterImageName(personaje2.nombre) || 'Reaper'}.webp" 
                             alt="${personaje2.nombre || 'Villano'}" 
                             class="participant-image"
                             onerror="this.src='../images/Personajes/default.webp'">
                        <div class="participant-name">${personaje2.nombre || 'Villano'}</div>
                        <div class="participant-type">${personaje2.tipo === 'superheroe' ? 'HÉROE' : 'VILLANO'}</div>
                    </div>
                </div>
            `;
        } else if (isOldStructureFight) {
            // Batalla 1v1 con estructura antigua
            participantsHTML = `
                <div class="fight-participants">
                    <div class="participant">
                        <img src="../images/Personajes/default.webp" 
                             alt="Participante" 
                             class="participant-image">
                        <div class="participant-name">Participante</div>
                        <div class="participant-type">HÉROE</div>
                    </div>
                    
                    <div class="vs-separator">VS</div>
                    
                    <div class="participant">
                        <img src="../images/Personajes/default.webp" 
                             alt="Participante" 
                             class="participant-image">
                        <div class="participant-name">Participante</div>
                        <div class="participant-type">VILLANO</div>
                    </div>
                </div>
            `;
        } else {
            // Estructura desconocida
            participantsHTML = `
                <div class="fight-participants">
                    <div class="participant">
                        <img src="../images/Personajes/default.webp" 
                             alt="Desconocido" 
                             class="participant-image">
                        <div class="participant-name">Desconocido</div>
                        <div class="participant-type">DESCONOCIDO</div>
                    </div>
                    
                    <div class="vs-separator">VS</div>
                    
                    <div class="participant">
                        <img src="../images/Personajes/default.webp" 
                             alt="Desconocido" 
                             class="participant-image">
                        <div class="participant-name">Desconocido</div>
                        <div class="participant-type">DESCONOCIDO</div>
                    </div>
                </div>
            `;
        }
        
        // Determinar resultado
        let resultText = 'Inconclusa';
        
        if (isTeamFight) {
            // Para peleas de equipos, usar directamente el campo resultado
            console.log('Pelea de equipos - resultado:', fight.resultado);
            if (fight.resultado) {
                // Convertir el resultado a texto legible
                if (fight.resultado === 'victory') {
                    resultText = 'Victoria';
                } else if (fight.resultado === 'defeat') {
                    resultText = 'Derrota';
                } else {
                    resultText = fight.resultado; // Usar el valor tal como está si no es victory/defeat
                }
                console.log('Usando resultado de la base de datos:', resultText);
            } else {
                // Intentar determinar el resultado basándose en otros datos
                console.log('No hay resultado en la base de datos, intentando determinar...');
                
                // Si tiene simulados, intentar determinar basándose en la vida
                if (fight.simulados && Object.keys(fight.simulados).length > 0) {
                    const simulados = fight.simulados;
                    const heroesAlive = (fight.heroes || []).filter(h => {
                        const heroId = h.id || h._id;
                        return simulados[heroId] && simulados[heroId] > 0;
                    }).length;
                    const villainsAlive = (fight.villanos || []).filter(v => {
                        const villainId = v.id || v._id;
                        return simulados[villainId] && simulados[villainId] > 0;
                    }).length;
                    
                    console.log('Análisis de vida - Héroes vivos:', heroesAlive, 'Villanos vivos:', villainsAlive);
                    
                    if (heroesAlive === 0 && villainsAlive > 0) {
                        resultText = 'Derrota';
                        console.log('Determinado por vida: Derrota');
                    } else if (villainsAlive === 0 && heroesAlive > 0) {
                        resultText = 'Victoria';
                        console.log('Determinado por vida: Victoria');
                    } else if (heroesAlive === 0 && villainsAlive === 0) {
                        // Ambos equipos muertos - mostrar como inconclusa
                        resultText = 'Inconclusa';
                        console.log('Ambos equipos muertos - Inconclusa');
                    } else {
                        console.log('No se puede determinar el resultado por vida');
                    }
                } else {
                    console.log('No hay datos de simulados para determinar resultado');
                }
            }
        } else if (isNewStructureFight) {
            // Para peleas 1v1 con nueva estructura, verificar vida de los personajes
            const personaje1 = fight.personaje1 || {};
            const personaje2 = fight.personaje2 || {};
            
            if (personaje1.vida <= 0 && personaje2.vida > 0) {
                resultText = personaje2.tipo === 'superheroe' ? 'Victoria' : 'Derrota';
            } else if (personaje2.vida <= 0 && personaje1.vida > 0) {
                resultText = personaje1.tipo === 'superheroe' ? 'Victoria' : 'Derrota';
            } else if (personaje1.vida <= 0 && personaje2.vida <= 0) {
                resultText = 'Inconclusa';
            }
        } else if (isOldStructureFight) {
            // Para peleas con estructura antigua, usar el campo winner
            resultText = fight.winner || 'Inconclusa';
        }
        
        resultHTML = `
            <div class="fight-result">
                <div class="result-text">${resultText}</div>
            </div>
        `;
        
        return `
            <div class="fight-card">
                <div class="fight-header">
                    <span class="fight-type">${fightType}</span>
                    <span class="fight-date">${formattedDate}</span>
                </div>
                
                <div class="fight-content">
                    ${participantsHTML}
                    ${resultHTML}
                </div>
            </div>
        `;
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.filteredFights.length / this.itemsPerPage);
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredFights.length);
        
        // Actualizar información
        document.getElementById('pagination-info').textContent = 
            `Mostrando ${startItem}-${endItem} de ${this.filteredFights.length} batallas`;
        
        // Actualizar botones
        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages;
        
        // Generar números de página
        const pageNumbers = document.getElementById('page-numbers');
        pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => this.goToPage(i));
            pageNumbers.appendChild(pageButton);
        }
    }
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredFights.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderFights();
            this.updatePagination();
            
            // Scroll suave hacia arriba
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }
    
    showLoading(show) {
        const loadingState = document.getElementById('loading-state');
        const fightsList = document.getElementById('fights-list');
        
        if (show) {
            loadingState.style.display = 'block';
            fightsList.innerHTML = '';
        } else {
            loadingState.style.display = 'none';
        }
    }
    
    async clearAllHistory() {
        // Confirmar antes de eliminar
        const confirmed = confirm('¿Estás seguro de que quieres eliminar TODO el historial de batallas? Esta acción no se puede deshacer.');
        
        if (!confirmed) {
            return;
        }
        
        try {
            // Mostrar estado de carga
            const clearBtn = document.getElementById('clear-history-btn');
            const originalText = clearBtn.innerHTML;
            clearBtn.innerHTML = '<span>🗑️ Eliminando...</span>';
            clearBtn.disabled = true;
            
            // Obtener token de autenticación
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }
            
            // Realizar petición DELETE
            const response = await fetch('/api/fights', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Historial eliminado:', result);
            
            // Mostrar mensaje de éxito
            alert(`✅ Historial eliminado exitosamente. Se eliminaron ${result.deletedCount || 0} peleas.`);
            
            // Recargar el historial
            this.loadFights();
            
        } catch (error) {
            console.error('Error eliminando historial:', error);
            alert(`❌ Error al eliminar el historial: ${error.message}`);
        } finally {
            // Restaurar botón
            const clearBtn = document.getElementById('clear-history-btn');
            clearBtn.innerHTML = '<span>🗑️ Eliminar Todo el Historial</span>';
            clearBtn.disabled = false;
        }
    }
    
    showError(message) {
        const fightsList = document.getElementById('fights-list');
        fightsList.innerHTML = `
            <div class="empty-state" style="display: block;">
                <div class="empty-icon">⚠️</div>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new HistoryManager();
}); 