# 🎮 Interfaz Web - Héroes vs Villanos

## 📁 Estructura de Archivos

```
public/
├── html/
│   └── index.html          # Página principal con las 3 pantallas
├── css/
│   ├── styles.css          # Estilos base y variables CSS
│   ├── login.css           # Estilos específicos para login
│   ├── register.css        # Estilos específicos para registro
│   └── dashboard.css       # Estilos específicos para dashboard
├── js/
│   └── main.js            # JavaScript principal con toda la funcionalidad
└── images/                # Carpeta para imágenes (futuras)
```

## 🎨 Características de Diseño

### Paleta de Colores
- **Fondo principal**: `#2B2D31` (gris oscuro)
- **Paneles/tarjetas**: `#3A3F44` (gris medio)
- **Botones primarios**: `#FF9C00` (naranja)
- **Botones secundarios**: `#00BFFF` (azul)
- **Textos**: `#F0F0F0` (blanco cálido)

### Tipografías
- **Títulos**: Rajdhani Bold
- **Texto general**: Roboto

## 🚀 Cómo Usar

### 1. Abrir la Interfaz
```bash
# Navegar a la carpeta public
cd public/html

# Abrir index.html en tu navegador
# O usar un servidor local:
python -m http.server 8000
# Luego ir a http://localhost:8000/html/
```

### 2. Pantallas Disponibles

#### 🔐 Pantalla de Login
- Campos: Usuario y Contraseña
- Botón: "Iniciar Sesión"
- Enlace: "¿No tienes cuenta? Crea una aquí"

#### 📝 Pantalla de Registro
- Campos: Nombre, Usuario, Correo, Contraseña
- Validación de contraseña en tiempo real
- Botón: "Crear Cuenta"
- Enlace: "¿Ya tienes cuenta? Inicia sesión aquí"

#### 🎮 Dashboard Principal
- Saludo personalizado
- 3 tarjetas de juego:
  - **Crear Equipo**: Formar equipos de héroes y villanos
  - **Pelea 1 vs 1**: Batalla individual
  - **Pelea 3 vs 3**: Batalla en equipo
- Botón de cerrar sesión

## 🔧 Configuración del Backend

### Endpoints Requeridos

```javascript
// Configurar en public/js/main.js
const API_BASE_URL = 'http://localhost:3000/api';

// Endpoints necesarios:
POST /api/auth/login
POST /api/auth/register
```

### Estructura de Respuesta Esperada

```javascript
// Login exitoso
{
  "user": {
    "id": "123",
    "name": "Usuario Ejemplo",
    "username": "usuario123",
    "email": "usuario@ejemplo.com"
  },
  "token": "jwt_token_here"
}

// Error
{
  "message": "Mensaje de error"
}
```

## ✨ Características Implementadas

### 🎯 Funcionalidades
- ✅ Navegación entre pantallas
- ✅ Formularios con validación
- ✅ Autenticación con localStorage
- ✅ Notificaciones dinámicas
- ✅ Animaciones y transiciones
- ✅ Diseño responsivo
- ✅ Validación de contraseña en tiempo real

### 🎨 Efectos Visuales
- ✅ Gradientes y sombras
- ✅ Animaciones de hover
- ✅ Efectos de shimmer
- ✅ Transiciones suaves
- ✅ Patrones de fondo sutiles

### 📱 Responsive Design
- ✅ Mobile-first approach
- ✅ Breakpoints: 480px, 768px, 1024px
- ✅ Flexbox y Grid CSS
- ✅ Adaptación de tamaños y espaciados

## 🛠️ Personalización

### Cambiar Colores
Editar variables CSS en `public/css/styles.css`:
```css
:root {
    --bg-primary: #2B2D31;
    --btn-primary: #FF9C00;
    --btn-secondary: #00BFFF;
    /* ... más variables */
}
```

### Agregar Nuevas Pantallas
1. Crear HTML en `index.html`
2. Agregar estilos en archivo CSS correspondiente
3. Implementar lógica en `main.js`

### Modificar Endpoints
Editar en `public/js/main.js`:
```javascript
const API_BASE_URL = 'tu_url_del_backend';
```

## 🐛 Solución de Problemas

### La interfaz no carga
- Verificar que todos los archivos CSS y JS estén en las rutas correctas
- Revisar la consola del navegador para errores

### Los estilos no se aplican
- Verificar que las fuentes de Google estén cargando
- Comprobar que los archivos CSS se estén importando correctamente

### Las animaciones no funcionan
- Verificar que el navegador soporte CSS Grid y Flexbox
- Comprobar que JavaScript esté habilitado

## 📝 Notas de Desarrollo

### Compatibilidad
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

### Performance
- CSS optimizado con variables
- JavaScript modular y eficiente
- Imágenes optimizadas (cuando se agreguen)

### Seguridad
- Validación de formularios en frontend
- Sanitización de inputs
- Manejo seguro de tokens JWT

## 🚀 Próximos Pasos

1. **Integrar con Backend**: Conectar con los endpoints reales
2. **Agregar Imágenes**: Incluir sprites de personajes
3. **Funcionalidades de Juego**: Implementar lógica de batallas
4. **PWA**: Convertir en Progressive Web App
5. **Testing**: Agregar tests unitarios y de integración

---

**¡La interfaz está lista para usar!** 🎉 