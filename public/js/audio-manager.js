/**
 * Audio Manager para el soundtrack del juego
 * Maneja la reproducción del audio de manera consistente en todas las páginas
 */
class AudioManager {
    constructor() {
        this.soundtrack = null;
        this.isInitialized = false;
        this.volume = 0.3; // Volumen por defecto al 30%
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAudio());
        } else {
            this.setupAudio();
        }
    }

    setupAudio() {
        // Buscar el elemento de audio
        this.soundtrack = document.getElementById('game-soundtrack');
        
        if (!this.soundtrack) {
            console.log('🔇 No se encontró el elemento de audio del soundtrack');
            return;
        }

        // Configurar el audio
        this.soundtrack.volume = this.volume;
        this.soundtrack.loop = true;
        
        // Marcar como inicializado
        this.isInitialized = true;
        
        console.log('🎵 Audio Manager inicializado correctamente');
        
        // Configurar eventos para reproducir audio
        this.setupPlayEvents();
    }

    setupPlayEvents() {
        // Función para intentar reproducir el audio
        const playSoundtrack = () => {
            if (this.soundtrack && this.soundtrack.paused && this.isInitialized) {
                this.soundtrack.play().catch(function(error) {
                    console.log('🔇 No se pudo reproducir el soundtrack automáticamente:', error);
                });
            }
        };

        // Eventos para iniciar la reproducción (solo una vez)
        const events = ['click', 'keydown', 'touchstart'];
        
        events.forEach(eventType => {
            document.addEventListener(eventType, playSoundtrack, { once: true });
        });

        // También intentar reproducir cuando la página se carga completamente
        window.addEventListener('load', playSoundtrack);
    }

    // Método para cambiar el volumen
    setVolume(volume) {
        if (this.soundtrack && volume >= 0 && volume <= 1) {
            this.volume = volume;
            this.soundtrack.volume = volume;
            console.log(`🔊 Volumen ajustado a: ${Math.round(volume * 100)}%`);
        }
    }

    // Método para pausar/reanudar
    togglePlay() {
        if (this.soundtrack) {
            if (this.soundtrack.paused) {
                this.soundtrack.play();
                console.log('▶️ Soundtrack reanudado');
            } else {
                this.soundtrack.pause();
                console.log('⏸️ Soundtrack pausado');
            }
        }
    }

    // Método para detener completamente
    stop() {
        if (this.soundtrack) {
            this.soundtrack.pause();
            this.soundtrack.currentTime = 0;
            console.log('⏹️ Soundtrack detenido');
        }
    }

    // Método para verificar si está reproduciéndose
    isPlaying() {
        return this.soundtrack && !this.soundtrack.paused;
    }
}

// Inicializar el Audio Manager cuando se carga el script
const audioManager = new AudioManager();

// Exportar para uso global
window.audioManager = audioManager; 