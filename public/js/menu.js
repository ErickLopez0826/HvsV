// ===== CONFIGURACIÓN GLOBAL =====
// Detectar automáticamente la URL base según el entorno
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3003/api' 
    : `${window.location.protocol}//${window.location.host}/api`;
let currentUser = null;

// ===== CLASE PRINCIPAL DEL MENÚ =====
class MenuApp {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.addAnimations();
    }

    // ===== VERIFICACIÓN DE ESTADO DE AUTENTICACIÓN =====
    checkAuthStatus() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (user && token) {
            currentUser = JSON.parse(user);
            this.updateWelcomeMessage();
        } else {
            // Si no hay sesión, redirigir al login
            window.location.href = '/login';
        }
    }

    // ===== CONFIGURACIÓN DE EVENT LISTENERS =====
    setupEventListeners() {
        // Botón de logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Event listeners para las tarjetas
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Evitar doble click si se hace clic en el botón
                if (e.target.classList.contains('btn')) {
                    return;
                }
                
                const cardId = card.id;
                this.handleCardClick(cardId);
            });
        });

        // Event listeners para los botones de acción
        document.querySelectorAll('.card-action').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que se active el click de la tarjeta
                const action = button.textContent.trim();
                this.handleGameAction(action);
            });
        });
    }

    // ===== ACTUALIZACIÓN DE INTERFAZ =====
    updateWelcomeMessage() {
        if (currentUser) {
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = currentUser.name || currentUser.username;
            }
        }
    }

    // ===== MANEJO DE CLICKS EN TARJETAS =====
    handleCardClick(cardId) {
        console.log(`Tarjeta clickeada: ${cardId}`);
        
        // Agregar efecto visual
        const card = document.getElementById(cardId);
        card.classList.add('loading');
        
        // Simular carga
        setTimeout(() => {
            card.classList.remove('loading');
            this.navigateToCard(cardId);
        }, 500);
    }

    // ===== NAVEGACIÓN SEGÚN TARJETA =====
    navigateToCard(cardId) {
        switch (cardId) {
            case 'create-team-card':
                this.navigateTo('create-team');
                break;
            case 'fight-1v1-card':
                this.navigateTo('fight-1v1');
                break;
            case 'fight-teams-card':
                this.navigateTo('fight-teams');
                break;
            default:
                console.log('Tarjeta no reconocida:', cardId);
        }
    }

    // ===== MANEJO DE ACCIONES DEL JUEGO =====
    handleGameAction(action) {
        console.log(`Acción del juego: ${action}`);
        
        switch (action) {
            case 'Crear Equipo':
                this.navigateTo('create-team');
                break;
            case 'Pelea 1 vs 1':
                this.navigateTo('fight-1v1');
                break;
            case 'Pelea de Equipos':
                this.navigateTo('fight-teams');
                break;
            default:
                this.showInfo('Función en desarrollo');
        }
    }

    // ===== NAVEGACIÓN A PANTALLAS =====
    navigateTo(screen) {
        console.log(`Navegando a: ${screen}`);
        
        switch (screen) {
            case 'create-team':
                window.location.href = '/create-team.html';
                break;
            case 'fight-1v1':
                window.location.href = '/fight-1vs1.html';
                break;
            case 'fight-teams':
                window.location.href = '/fight-teams';
                break;
            case 'history':
                window.location.href = '/history.html';
                break;
            default:
                this.showInfo(`Navegando a ${screen}...`);
                setTimeout(() => {
                    this.showSuccess(`¡Pantalla ${screen} cargada!`);
                }, 1000);
        }
    }

    // ===== MANEJO DE LOGOUT =====
    handleLogout() {
        // Limpiar datos de sesión
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        currentUser = null;
        
        // Mostrar mensaje
        this.showSuccess('Sesión cerrada exitosamente');
        
        // Redirigir al login
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }

    // ===== ANIMACIONES Y EFECTOS =====
    addAnimations() {
        // Animación de entrada para elementos
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        });

        document.querySelectorAll('.game-card').forEach(el => {
            observer.observe(el);
        });

        // Efecto de hover para las tarjetas
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
            });
        });
    }

    // ===== NOTIFICACIONES Y MENSAJES =====
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
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
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });
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
        border-left-color: #FF4757;
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

    .fade-out {
        opacity: 0;
        transform: translateX(100%);
    }
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// ===== FUNCIÓN GLOBAL PARA NAVEGACIÓN =====
function navigateTo(screen) {
    if (window.menuApp) {
        window.menuApp.navigateTo(screen);
    }
}

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    window.menuApp = new MenuApp();
});

// ===== FUNCIONES DE UTILIDAD =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== EXPORTAR PARA USO EXTERNO =====
window.MenuApp = MenuApp; 