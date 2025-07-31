class Personaje {
    constructor(id, nombre, ciudad, tipo, equipo, nivel = 1, experiencia = 0, escudo = 0, vida = 100, dañoUltimate = 0, umbralUltimate = 50, ultimateDisponible = false, fuerza = 50) {
        this.id = id;
        this.nombre = nombre;
        this.ciudad = ciudad;
        this.tipo = tipo; // 'superheroe' o 'villano'
        this.equipo = equipo;
        this.nivel = nivel;
        this.experiencia = experiencia;
        this.escudo = escudo;
        this.vida = vida;
        this.dañoUltimate = dañoUltimate;
        this.umbralUltimate = umbralUltimate;
        this.ultimateDisponible = ultimateDisponible;
        this.fuerza = fuerza;
    }

    // Subir experiencia y nivel, con traspaso de experiencia sobrante
    ganarExperiencia(cantidad) {
        if (this.nivel >= 10) return;
        
        this.experiencia += cantidad;
        const expNecesaria = this.nivel * 100;
        
        if (this.experiencia >= expNecesaria) {
            const expSobrante = this.experiencia - expNecesaria;
            this.subirNivel();
            this.ganarExperiencia(expSobrante);
        }
    }

    subirNivel() {
        if (this.nivel < 10) {
            this.nivel++;
            this.vida = 100 + (this.nivel - 1) * 5;
            this.escudo = (this.nivel - 1) * 5;
            this.umbralUltimate = Math.round(this.umbralUltimate * 1.1);
        }
    }

    // Daño de ataques según nivel y fuerza
    getAtaqueBasico() {
        return Math.floor(this.fuerza * 0.1) + (this.nivel - 1) * 1;
    }
    
    getAtaqueEspecial() {
        return Math.floor(this.fuerza * 0.3) + (this.nivel - 1) * 10;
    }

    getAtaqueUltimate() {
        return Math.floor(this.fuerza * 0.8) + (this.nivel - 1) * 10;
    }

    // Calcular daño recibido aplicando escudo (excepto ultimate)
    recibirDanio(danio, esUltimate = false) {
        if (!esUltimate && this.escudo > 0) {
            const reduccion = danio * (this.escudo / 100);
            danio = danio - reduccion;
        }
        this.vida -= danio;
        if (this.vida < 0) this.vida = 0;
    }

    // Sumar daño realizado para cargar ultimate
    cargarUltimate(danio) {
        if (this.nivel >= 10 && this.dañoUltimate >= this.umbralUltimate) return;
        
        this.dañoUltimate += danio;
        if (this.dañoUltimate >= this.umbralUltimate) {
            this.ultimateDisponible = true;
        }
    }

    // Usar ultimate (resetea el contador)
    usarUltimate() {
        if (this.ultimateDisponible) {
            this.dañoUltimate = 0;
            this.ultimateDisponible = false;
            return this.getAtaqueUltimate();
        }
        return 0;
    }
}

class Heroe extends Personaje {
    constructor(id, nombre, ciudad, equipo, nivel = 1, experiencia = 0, escudo = 0, vida = 100, dañoUltimate = 0, umbralUltimate = 50, ultimateDisponible = false, fuerza = 50) {
        super(id, nombre, ciudad, 'superheroe', equipo, nivel, experiencia, escudo, vida, dañoUltimate, umbralUltimate, ultimateDisponible, fuerza);
    }
}

class Villano extends Personaje {
    constructor(id, nombre, ciudad, equipo, nivel = 1, experiencia = 0, escudo = 0, vida = 100, dañoUltimate = 0, umbralUltimate = 50, ultimateDisponible = false, fuerza = 50) {
        super(id, nombre, ciudad, 'villano', equipo, nivel, experiencia, escudo, vida, dañoUltimate, umbralUltimate, ultimateDisponible, fuerza);
    }
}

export { Personaje, Heroe, Villano }; 