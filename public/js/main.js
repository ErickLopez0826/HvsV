// ===== CONFIGURACIÓN GLOBAL =====
// Detectar automáticamente la URL base según el entorno
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3003/api' 
    : `${window.location.protocol}//${window.location.host}/api`;
let currentUser = null;

// ===== CLASE PRINCIPAL DE LA APLICACIÓN =====
class GameApp {
    constructor() {
        this.currentScreen = 'login';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.addAnimations();
        this.setupBackgroundVideo();
    }

    // ===== CONFIGURACIÓN DEL VIDEO DE FONDO =====
    setupBackgroundVideo() {
        const video = document.getElementById('background-video');
        if (video) {
            // Asegurar que el video se reproduzca automáticamente
            video.play().catch(error => {
                console.log('Error reproduciendo video de fondo:', error);
                // Fallback: ocultar el video si no se puede reproducir
                const videoContainer = document.querySelector('.background-video-container');
                if (videoContainer) {
                    videoContainer.style.display = 'none';
                }
            });

            // Manejar eventos del video
            video.addEventListener('loadeddata', () => {
                console.log('Video de fondo cargado correctamente');
                const videoContainer = document.querySelector('.background-video-container');
                if (videoContainer) {
                    videoContainer.classList.add('loaded');
                }
            });

            video.addEventListener('error', () => {
                console.log('Error cargando video de fondo');
                const videoContainer = document.querySelector('.background-video-container');
                if (videoContainer) {
                    videoContainer.style.display = 'none';
                }
            });
        }
    }

    // ===== CONFIGURACIÓN DE EVENT LISTENERS =====
    setupEventListeners() {
        // Navegación entre pantallas
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('register');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('login');
        });

        // Formularios
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Botón de logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Botones del dashboard
        document.querySelectorAll('.btn-card').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleGameAction(e.target.textContent.trim());
            });
        });

        // Validación de contraseña en tiempo real
        document.getElementById('register-password').addEventListener('input', (e) => {
            this.validatePassword(e.target.value);
        });
    }

    // ===== NAVEGACIÓN ENTRE PANTALLAS =====
    showScreen(screenName) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Mostrar la pantalla seleccionada
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            
            // Animación de entrada
            setTimeout(() => {
                targetScreen.classList.add('fade-in-up');
            }, 100);
        }
    }

    // ===== MANEJO DE AUTENTICACIÓN =====
    async handleLogin() {
        const form = document.getElementById('login-form');
        const formData = new FormData(form);
        
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            this.showLoading('Iniciando sesión...');
            
            console.log('🔐 Intentando login con URL:', `${API_BASE_URL}/login`);
            console.log('📝 Datos de login:', { username: loginData.username, password: '***' });
            
            // Llamada al backend
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            console.log('📡 Respuesta del servidor:', response.status, response.statusText);
            
            const data = await response.json();
            console.log('📦 Datos recibidos:', data);

            if (response.ok) {
                this.hideLoading();
                this.showSuccess('¡Inicio de sesión exitoso!');
                
                // Guardar datos del usuario
                currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                
                // Actualizar mensaje de bienvenida
                this.updateWelcomeMessage();
                
                // Navegar al menú principal
                setTimeout(() => {
                    window.location.href = '/menu.html';
                }, 1000);
            } else {
                this.hideLoading();
                this.showError(data.message || 'Error en el inicio de sesión');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Error de conexión. Intenta nuevamente.');
            console.error('❌ Error de login:', error);
            console.error('🔍 Detalles del error:', {
                message: error.message,
                stack: error.stack,
                url: `${API_BASE_URL}/login`
            });
        }
    }

    async handleRegister() {
        const form = document.getElementById('register-form');
        const formData = new FormData(form);
        
        const registerData = {
            name: formData.get('name'),
            password: formData.get('password')
        };

        try {
            this.showLoading('Creando cuenta...');
            
            // Llamada al backend
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const data = await response.json();

            if (response.ok) {
                this.hideLoading();
                this.showSuccess('¡Cuenta creada exitosamente!');
                
                // Limpiar formulario
                form.reset();
                
                // Volver al login
                setTimeout(() => {
                    this.showScreen('login');
                }, 1500);
            } else {
                this.hideLoading();
                this.showError(data.message || 'Error al crear la cuenta');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Error de conexión. Intenta nuevamente.');
            console.error('Error de registro:', error);
        }
    }

    handleLogout() {
        // Limpiar datos de sesión
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        currentUser = null;
        
        // Mostrar mensaje
        this.showSuccess('Sesión cerrada exitosamente');
        
        // Volver al login
        setTimeout(() => {
            this.showScreen('login');
        }, 1000);
    }

    // ===== VERIFICACIÓN DE ESTADO DE AUTENTICACIÓN =====
    checkAuthStatus() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        // Verificar si estamos en la ruta del dashboard
        const isDashboardRoute = window.location.pathname === '/dashboard' || 
                               window.location.hash === '#dashboard';
        
        // Verificar si estamos en la ruta del login
        const isLoginRoute = window.location.pathname === '/login' || 
                           window.location.pathname === '/index.html';
        
        if (user && token) {
            currentUser = JSON.parse(user);
            this.updateWelcomeMessage();
            
            // Si estamos en la ruta del dashboard, mostrar dashboard directamente
            if (isDashboardRoute) {
                this.showScreen('dashboard');
            } else if (isLoginRoute) {
                // Si estamos en login pero tenemos sesión, ir al menú
                window.location.href = '/menu.html';
            } else {
                // Si no estamos en dashboard pero tenemos sesión, ir al dashboard
                this.showScreen('dashboard');
            }
        } else if (isDashboardRoute) {
            // Si estamos en dashboard pero no hay sesión, ir al login
            this.showScreen('login');
        } else if (isLoginRoute) {
            // Si estamos en login y no hay sesión, mostrar login
            this.showScreen('login');
        }
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

    // ===== MANEJO DE ACCIONES DEL JUEGO =====
    handleGameAction(action) {
        console.log(`Acción del juego: ${action}`);
        
        // Aquí puedes agregar la lógica para cada acción
        switch (action) {
            case 'Crear Equipo':
                this.showInfo('Función de crear equipo en desarrollo');
                break;
            case 'Pelea 1 vs 1':
                this.showInfo('Función de pelea 1 vs 1 en desarrollo');
                break;
            case 'Pelea 3 vs 3':
                this.showInfo('Función de pelea 3 vs 3 en desarrollo');
                break;
            default:
                this.showInfo('Función en desarrollo');
        }
    }

    // ===== VALIDACIÓN DE CONTRASEÑA =====
    validatePassword(password) {
        const strengthElement = document.querySelector('.password-strength');
        if (!strengthElement) {
            // Crear elemento si no existe
            const inputGroup = document.getElementById('register-password').parentElement;
            const strengthDiv = document.createElement('div');
            strengthDiv.className = 'password-strength';
            inputGroup.appendChild(strengthDiv);
        }

        const strength = this.getPasswordStrength(password);
        const element = document.querySelector('.password-strength');
        
        element.textContent = `Fortaleza: ${strength.text}`;
        element.className = `password-strength ${strength.class}`;
    }

    getPasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score < 2) return { text: 'Débil', class: 'weak' };
        if (score < 4) return { text: 'Media', class: 'medium' };
        return { text: 'Fuerte', class: 'strong' };
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

        document.querySelectorAll('.game-card, .login-card, .register-card').forEach(el => {
            observer.observe(el);
        });
    }

    // ===== NOTIFICACIONES Y MENSAJES =====
    showLoading(message) {
        // Crear overlay de carga
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

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
document.addEventListener('DOMContentLoaded', () => {
    new GameApp();
    
    // Mostrar mensaje sobre caché si es necesario
    setTimeout(() => {
        showCacheMessage();
    }, 2000);
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

// Función para forzar la recarga de CSS
function forceCSSReload() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            const separator = href.indexOf('?') !== -1 ? '&' : '?';
            link.setAttribute('href', href + separator + 'v=' + Date.now());
        }
    });
}

// Función para mostrar mensaje sobre caché
function showCacheMessage() {
    const message = `
        <div style="position: fixed; top: 20px; right: 20px; background: #ff6b35; color: white; padding: 15px; border-radius: 8px; z-index: 10000; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <h4 style="margin: 0 0 10px 0;">⚠️ Problema de Caché</h4>
            <p style="margin: 0 0 10px 0; font-size: 14px;">Si no ves los cambios en las imágenes, presiona Ctrl+F5 para limpiar el caché del navegador.</p>
            <button onclick="this.parentElement.remove()" style="background: white; color: #ff6b35; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Cerrar</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', message);
}

// ===== EXPORTAR PARA USO EXTERNO =====
window.GameApp = GameApp;
window.forceCSSReload = forceCSSReload;
window.showCacheMessage = showCacheMessage; 