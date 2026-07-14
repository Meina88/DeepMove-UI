
> [!WARNING]
> ### Aviso legal
> Este software se proporciona "tal cual", sin garantías de ningún tipo, expresas o implícitas, incluyendo —entre otras— garantías de comerciabilidad, idoneidad para un propósito específico o no infracción.
>
> En ningún caso los autores o titulares de derechos serán responsables por daños, pérdidas o reclamaciones derivadas del uso del software.
>
> Al utilizar este software, usted acepta estos términos.

---

# DeepMove – CNC Web HMI

Interfaz Hombre-Máquina (HMI) web para máquinas CNC basadas en **ESP32 + FluidNC**.

---

## ¿Qué es DeepMove?

DeepMove es una interfaz CNC moderna, optimizada para fresadoras y routers, construida sobre **ESP3D-WebUI** y reorganizada para ofrecer un entorno de producción más claro, enfocado y eficiente.

Fue diseñada especialmente para el controlador [**MillingStation**](https://github.com/Meina88/MillingStation), aunque es compatible con cualquier controlador CNC basado en **ESP32 con firmware FluidNC**.

---

## Características de DeepMove

Esto es lo que DeepMove agrega sobre la base de [michmela44/ESP3D-WEBUI](https://github.com/michmela44/ESP3D-WEBUI):

### 🔀 Modo dual CNC / Láser

- Selector CNC/Láser en el navbar, con los números de herramienta leídos directamente del `.yaml` de FluidNC (`ModbusVFD`/`Laser`), no hardcodeados.
- Cambio de husillo seguro: antes de conmutar se apaga el husillo activo (`M5`/`S0`), y el cambio se confirma contra el firmware (mensaje `[MSG:INFO: Changed to spindle...]` o estado `$G`), con timeout y aviso si no hay confirmación.
- Detección automática de si un G-code es de router o de láser (heurística sobre patrones de `M3`/`M4`, potencia `S`, cortes en `Z`, arcos, refrigerante), para advertir si el archivo cargado no coincide con el modo activo de la máquina antes de correrlo.
- Límites de seguridad específicos para láser: pasos de Jog restringidos (1 mm / 0.1 mm), botón de potencia de foco configurable, activación automática de M7/M8 al entrar en modo láser.
- Botón **Frame**: traza con el láser a baja potencia el contorno del área de trabajo cargada, para verificar posicionamiento antes de grabar — calculado a partir del G-code ya interpretado (respeta unidades y modo relativo/absoluto).
- El panel Overrides adapta sus controles dinámicamente según el modo activo (RPM/feed para router, potencia para láser).

### 🖥 Modo HMI industrial (fullscreen)

- Layout de consola dedicado para tablets y desktop: Jog, Files, Overrides y Toolpath integrados en una sola pantalla fullscreen, pensado para operarse sin alternar entre paneles.
- Bloqueo de orientación landscape en tablets, con aviso si el dispositivo está en portrait.
- Botón de reset industrial, feedback háptico en toda la navegación del HMI, y salida rápida al modo Paneles tradicionales.

### 🎮 Jog rediseñado

- Motor de Jog unificado (puntero + teclado) con jog continuo de feed variable según el stepping seleccionado.
- Perilla de cambio de stepping con detents, en vez de botones sueltos.
- Seguridad de eje Z: si el stepping está en un valor grande (ej. 100 mm) y se presiona +Z/-Z, cambia automáticamente a un paso más chico (10 mm) para evitar un salto de eje excesivo cerca del material.
- Atajos de teclado configurables (keymap) para jog sin mouse/touch.

### 🎚 Overrides y Machine I/O

- Panel Overrides con sliders de RPM y Feed, gráficos de barra, indicador de potencia, y botón para enlazar Feed con RPM y mantener la carga de viruta constante.
- Los botones +/- se deshabilitan automáticamente al llegar a los límites de `rpm_max`/`feed_max`.
- Panel **Machine I/O** (ex-Spindle): estado de los pines de entrada, control de salidas digitales D1–D4 con lógica toggle, y apagado conjunto de M7/M8/salidas digitales.

### 🔒 Seguridad

- Disclaimer de seguridad de aceptación obligatoria y persistente (multi-paso, versionado) antes de poder operar la interfaz.
- Sincronización de estado tras reset/reconexión: el husillo activo y las salidas (incluido el PWM del láser) se fuerzan a un estado conocido y seguro en vez de asumir que siguen como estaban.
- Confirmación explícita antes de ejecutar un archivo si el tipo de G-code detectado no coincide con el modo (CNC/Láser) activo de la máquina.

### 📶 Wi-Fi

- Detección de modo real vs. modo configurado, para no mostrar un estado engañoso si la configuración guardada no coincide con lo que el firmware está usando realmente.
- Las contraseñas guardadas no se exponen en la UI.
- Confirmación crítica antes de desactivar el Wi-Fi, para evitar perder la conexión a la interfaz por accidente.

### 🎨 Interfaz y personalización

- Theming completamente desacoplado del SCSS hardcodeado: todo pasa por variables CSS semánticas (`--ms-*`), lo que permite crear temas nuevos sin tocar componentes.
- Estética neumórfica/industrial propia, con sombras y superficies semánticas reutilizables.
- Splash screen de marca, manifest PWA e íconos propios de DeepMove.

---

## Filosofía

La mayoría de las interfaces intentan mostrar todos los controles en una sola pantalla.  
DeepMove muestra únicamente lo necesario en cada contexto de uso.

### Smartphone

- 🟢 Durante el mecanizado → no es necesario visualizar el panel de Jog  
- 🟢 Durante el seteo inicial → no es necesario mostrar el gestor de archivos  
- 🟢 La operación se simplifica mediante un panel de navegación inferior

  <img width="409" height="776" alt="image" src="https://github.com/user-attachments/assets/f2685f45-0186-4a04-b66f-ed705556394a" />

### Tablets

- 📱 Puede activarse el modo HMI para visualizar mayor información sin necesidad de desplazarse entre paneles  

<img width="1342" height="803" alt="image" src="https://github.com/user-attachments/assets/cdff39ab-d44d-408b-88a8-e458bf4c9836" />

### Desktop

Puede utilizarse en modo **HMI** o en modo **Paneles tradicionales**, según preferencia.

---

## Visualizador de Trayectorias

DeepMove integra un visualizador de G-code nativo, con intérprete propio que soporta planos G17/G18/G19, distancia absoluta/relativa (G90/G91), unidades (G20/G21), offsets G92 y arcos G2/G3 (incluyendo círculos completos, hélices e IJK relativo/absoluto). Incluye:

- Zoom, pan y recentrado por doble click/doble tap, con vistas estándar (Top, Front, Isométrica, etc.)
- Animación del cabezal sincronizada con la posición real (`WPos`) reportada por FluidNC durante la ejecución, con coloreado progresivo del recorrido ya realizado
- Activación/desactivación de grilla
- Control de cantidad de segmentos renderizados (por PC/Mobile), para no comprometer la estabilidad en dispositivos con poca memoria

Esto permite previsualizar archivos antes de su ejecución y monitorear el proceso en tiempo real sin comprometer estabilidad.

---

DeepMove combina simplicidad operativa con potencia técnica, ofreciendo una experiencia moderna para controladores CNC basados en ESP32.

---


## Configuración de las herramientas de desarrollo

1 - Instalar la versión LTS de Node.js

```
node -v
npm -v
```

2 - Clonar el repositorio e instalar las dependencias

```
git clone https://github.com/Meina88/DeepMove-UI.git
cd DeepMove-UI
npm install
```

### Iniciar el servidor de desarrollo

```
npm run dev
```

Levanta en simultáneo un backend simulado de ESP32/FluidNC (HTTP en `:8080`, WebSocket en `:8090` — ver `config/server.js`) y el `webpack-dev-server` del frontend. Abrí `http://localhost:8088` para usar la interfaz contra ese backend simulado, sin necesidad de hardware real.

También se pueden levantar por separado:

```
npm run server   # solo el backend simulado
npm run front    # solo el dev server del frontend
```

### Generar la build de producción

```
npm run build
```

Genera `dist/index.html.gz`, listo para subir a la memoria flash del ESP32.

### Otros comandos

```
npm run type-check   # chequeo de tipos (tsc --noEmit)
npm run lint          # eslint sobre src/
npm run lint:fix      # eslint con autofix
```

---

# Construido sobre el trabajo de [michmela44/ESP3D-WEBUI](https://github.com/michmela44/ESP3D-WEBUI) y del proyecto original [ESP3D-WEBUI](https://github.com/luc-github/ESP3D-WEBUI) de Luc Lebosse.

![DeepMove-UI](https://img.shields.io/badge/DeepMove--UI-1.0.0-blue)

# ¿Necesitas más información sobre ESP3D-WEBUI y proyectos relacionados?

Visita https://esp3d.io
