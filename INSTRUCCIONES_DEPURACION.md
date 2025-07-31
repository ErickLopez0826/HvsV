# 🔍 Instrucciones de Depuración - Botones de Ataque

## Problema
Los botones de ataque (Atacar, Habilidad Especial, Ultimate) no funcionan en la página de pelea 1 vs 1.

## Pasos para Depurar

### 1. Abrir la Consola del Navegador
- Presiona `F12` o `Ctrl+Shift+I`
- Ve a la pestaña "Console"

### 2. Verificar el Estado de la Aplicación
Ejecuta estos comandos en la consola:

```javascript
// Verificar estado general
debugFight()

// Verificar autenticación
testAuth()

// Verificar botones
checkButtons()
```

### 3. Verificar Event Listeners
Si los botones existen pero no funcionan:

```javascript
// Forzar configuración de event listeners
setupCombatListeners()
```

### 4. Probar Acciones Directamente
Si los event listeners están configurados pero no funcionan:

```javascript
// Probar un ataque básico
testAction('basico')

// Probar habilidad especial
testAction('especial')

// Probar ultimate
testAction('ultimate')
```

### 5. Verificar el Historial de Combate
Para verificar si los mensajes se están agregando:

```javascript
// Verificar el contenedor de mensajes
checkCombatLog()
```

### 6. Verificar Autenticación Manual
```javascript
// Verificar token
console.log('Token:', localStorage.getItem('token'))

// Verificar usuario
console.log('User:', localStorage.getItem('user'))
```

### 7. Probar API Directamente
```javascript
// Probar endpoint de peleas
fetch('/api/fights', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({
        id1: 2,
        id2: 5,
        atacanteId: 2,
        defensorId: 5,
        tipoAtaque: 'basico'
    })
}).then(r => r.json()).then(console.log)
```

## Posibles Problemas y Soluciones

### Problema 1: Botones no responden
**Solución:** Ejecutar `setupCombatListeners()`

### Problema 2: Acciones no se ejecutan
**Solución:** Ejecutar `testAction('basico')` para probar directamente

### Problema 3: No aparecen mensajes en el historial
**Solución:** Ejecutar `checkCombatLog()` para verificar el contenedor

### Problema 4: Error de autenticación
**Solución:** Verificar token con `testAuth()`

## Comandos de Emergencia

Si nada funciona, ejecuta esta secuencia completa:

```javascript
// 1. Verificar estado
debugFight()

// 2. Forzar configuración
setupCombatListeners()

// 3. Probar acción
testAction('basico')

// 4. Verificar resultado
checkCombatLog()
```

## Información de Contacto
Si los problemas persisten, proporciona los logs de la consola para análisis adicional. 