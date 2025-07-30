#!/usr/bin/env node

// ===== SCRIPT DE INICIO DEL SERVIDOR =====
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("\n" + "=".repeat(70));
console.log("🎮 HÉROES VS VILLANOS - INICIANDO SERVIDOR");
console.log("=".repeat(70));

// Información del servidor
const SERVER_CONFIG = {
    port: 3000,
    baseUrl: "http://localhost:3000",
    name: "Héroes vs Villanos - API & Frontend",
    version: "1.0.0"
};

// Función para mostrar las URLs disponibles
function showServerUrls() {
    console.log(`\n📋 Información del Servidor:`);
    console.log(`   🏷️  Nombre: ${SERVER_CONFIG.name}`);
    console.log(`   📦 Versión: ${SERVER_CONFIG.version}`);
    console.log(`   🌐 Puerto: ${SERVER_CONFIG.port}`);
    console.log(`   🔗 URL Base: ${SERVER_CONFIG.baseUrl}`);
    
    console.log(`\n🎮 INTERFAZ WEB - DIRECCIONES DIRECTAS:`);
    console.log(`   🔐 Inicio de sesión: ${SERVER_CONFIG.baseUrl}/login`);
    console.log(`   📝 Crear cuenta: ${SERVER_CONFIG.baseUrl}/html/index.html`);
    console.log(`   🎯 Dashboard del juego: ${SERVER_CONFIG.baseUrl}/dashboard`);
    console.log(`   🏠 Página principal: ${SERVER_CONFIG.baseUrl}/html/index.html`);
    
    console.log(`\n📚 DOCUMENTACIÓN:`);
    console.log(`   📖 Swagger UI: ${SERVER_CONFIG.baseUrl}/api-docs`);
    console.log(`   🔗 API Base: ${SERVER_CONFIG.baseUrl}/api`);
    
    console.log(`\n⚡ ENDPOINTS API DISPONIBLES:`);
    console.log(`   🔑 Login: POST ${SERVER_CONFIG.baseUrl}/api/login`);
    console.log(`   👤 Registro: POST ${SERVER_CONFIG.baseUrl}/api/users`);
    console.log(`   👥 Usuarios: GET ${SERVER_CONFIG.baseUrl}/api/users`);
    console.log(`   ⚔️ Personajes: GET ${SERVER_CONFIG.baseUrl}/api/personajes`);
    console.log(`   🥊 Peleas: GET ${SERVER_CONFIG.baseUrl}/api/fights`);
    console.log(`   👥 Equipos: GET ${SERVER_CONFIG.baseUrl}/api/equipos`);
    
    console.log(`\n✨ CARACTERÍSTICAS:`);
    console.log(`   ✅ CORS habilitado para desarrollo local`);
    console.log(`   ✅ Archivos estáticos servidos desde /public`);
    console.log(`   ✅ Autenticación con JWT`);
    console.log(`   ✅ Documentación automática con Swagger`);
    console.log(`   ✅ Interfaz web responsive`);
    console.log(`   ✅ Animaciones y efectos visuales`);
    
    console.log("\n" + "=".repeat(70));
    console.log("🚀 ¡Servidor iniciado correctamente!");
    console.log("=".repeat(70));
    console.log("\n💡 TIP: Abre tu navegador y ve a:");
    console.log(`   🌐 ${SERVER_CONFIG.baseUrl}/login - Para iniciar sesión`);
    console.log(`   🎯 ${SERVER_CONFIG.baseUrl}/dashboard - Para ir al dashboard`);
    console.log("\n" + "=".repeat(70) + "\n");
}

// Función para iniciar el servidor
function startServer() {
    const appPath = join(__dirname, 'app.js');
    
    console.log("🔄 Iniciando servidor...");
    
    const server = spawn('node', [appPath], {
        stdio: 'inherit',
        shell: true
    });
    
    // Mostrar URLs después de un breve delay
    setTimeout(() => {
        showServerUrls();
    }, 2000);
    
    // Manejar eventos del proceso
    server.on('error', (error) => {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1);
    });
    
    server.on('close', (code) => {
        if (code !== 0) {
            console.error(`❌ El servidor se cerró con código ${code}`);
        }
    });
    
    // Manejar señales de terminación
    process.on('SIGINT', () => {
        console.log('\n🛑 Deteniendo servidor...');
        server.kill('SIGINT');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Deteniendo servidor...');
        server.kill('SIGTERM');
        process.exit(0);
    });
}

// Iniciar el servidor
startServer(); 