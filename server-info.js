// ===== INFORMACIÓN DEL SERVIDOR =====
const SERVER_INFO = {
    name: "Héroes vs Villanos - API & Frontend",
    version: "1.0.0",
    description: "Servidor para el juego Héroes vs Villanos con API REST y interfaz web",
    port: 3000,
    baseUrl: "http://localhost:3000",
    
    // Rutas del Frontend
    frontend: {
        login: "http://localhost:3000/login",
        register: "http://localhost:3000/html/index.html",
        dashboard: "http://localhost:3000/dashboard",
        mainPage: "http://localhost:3000/html/index.html"
    },
    
    // Endpoints de la API
    api: {
        base: "http://localhost:3000/api",
        docs: "http://localhost:3000/api-docs",
        auth: {
            login: "POST /api/login",
            register: "POST /api/users"
        },
        users: "GET /api/users",
        heroes: "GET /api/personajes",
        fights: "GET /api/fights",
        teams: "GET /api/equipos"
    },
    
    // Características del servidor
    features: {
        cors: "Habilitado para desarrollo local",
        staticFiles: "Archivos estáticos servidos desde /public",
        jwt: "Autenticación con JWT",
        swagger: "Documentación automática con Swagger"
    }
};

// Función para mostrar información del servidor
function displayServerInfo() {
    console.log("\n" + "=".repeat(60));
    console.log("🎮 HÉROES VS VILLANOS - SERVIDOR");
    console.log("=".repeat(60));
    
    console.log(`\n📋 Información del Servidor:`);
    console.log(`   Nombre: ${SERVER_INFO.name}`);
    console.log(`   Versión: ${SERVER_INFO.version}`);
    console.log(`   Puerto: ${SERVER_INFO.port}`);
    console.log(`   URL Base: ${SERVER_INFO.baseUrl}`);
    
    console.log(`\n🎮 Interfaz Web:`);
    console.log(`   🔐 Inicio de sesión: ${SERVER_INFO.frontend.login}`);
    console.log(`   📝 Crear cuenta: ${SERVER_INFO.frontend.register}`);
    console.log(`   🎯 Dashboard del juego: ${SERVER_INFO.frontend.dashboard}`);
    console.log(`   🏠 Página principal: ${SERVER_INFO.frontend.mainPage}`);
    
    console.log(`\n📚 Documentación:`);
    console.log(`   📖 Swagger UI: ${SERVER_INFO.api.docs}`);
    console.log(`   🔗 API Base: ${SERVER_INFO.api.base}`);
    
    console.log(`\n⚡ Endpoints API:`);
    console.log(`   🔑 Login: ${SERVER_INFO.api.auth.login}`);
    console.log(`   👤 Registro: ${SERVER_INFO.api.auth.register}`);
    console.log(`   👥 Usuarios: ${SERVER_INFO.api.users}`);
    console.log(`   ⚔️ Personajes: ${SERVER_INFO.api.heroes}`);
    console.log(`   🥊 Peleas: ${SERVER_INFO.api.fights}`);
    console.log(`   👥 Equipos: ${SERVER_INFO.api.teams}`);
    
    console.log(`\n✨ Características:`);
    Object.entries(SERVER_INFO.features).forEach(([key, value]) => {
        console.log(`   ✅ ${key}: ${value}`);
    });
    
    console.log("\n" + "=".repeat(60));
    console.log("🚀 ¡Servidor listo para usar!");
    console.log("=".repeat(60) + "\n");
}

// Exportar para uso en app.js
export { SERVER_INFO, displayServerInfo }; 