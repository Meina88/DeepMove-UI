
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

DeepMove integra un visualizador de G-code nativo que incluye:

- Zoom y navegación fluida  
- Vistas estándar (Top, Front, Isométrica, etc.)  
- Activación/desactivación de grilla y capas  
- Control de cantidad de segmentos para dispositivos con poca memoria  

Esto permite previsualizar archivos antes de su ejecución y monitorear el proceso en tiempo real sin comprometer estabilidad.

---

## Personalización

- 🎨 Múltiples themes  
- 🧩 Estética industrial y neumórfica  
- 🛠 Arquitectura modular y extensible  

---

DeepMove combina simplicidad operativa con potencia técnica, ofreciendo una experiencia moderna para controladores CNC basados en ESP32.

---


## Configuración de las herramientas de desarrollo

1 - Instalar la versión LTS de Node.js (actualmente v20.8.0)

```
node -v
v20.8.0

npm -v
10.2.0
```

2 - Descargar todos los paquetes necesarios en el directorio ESP3D-WEBUI (raíz del repositorio)

```
npm install
```

### Iniciar el servidor de desarrollo

en el directorio ESP3D-WEBUI (raíz del repositorio)

```
npm run dev-<system>-<firmware>
```

- donde `<system>` es `cnc` (sistema CNC, láser, husillo, etc.), `printer` (impresora 3D), `sand` (mesa de arena)
- donde `<firmware>` es:
- `grbl`, `grblhal` para `cnc`
- `marlin`, `marlin-embedded` (esp3dlib), `repetier`, `smoothieware` para `printer`
- `grbl` para `sand`

Abrirá http://localhost:8088, que muestra la interfaz web usando un servidor de pruebas local.

### Construir index.html.gz en la carpeta /dist

en el directorio ESP3D-WEBUI (raíz del repositorio)

```
npm run buildall
```

Generará la versión de producción para cada objetivo y firmware en el directorio dist

para construir index.html.gz específico

```
npm run <system>-<firmware>
```

- donde `<system>` es `cnc` (sistema CNC, láser, husillo...), `printer` (impresora 3D), `sand` (mesa de arena)
- donde `<firmware>` es:
- `grbl`, `grblhal` para `cnc`
- `marlin` `marlin-embedded` (esp3dlib), `repetier`, `smoothieware` para `printer`
- `grbl` para `sand`



# Construido sobre el proyecto de [michmela](https://github.com/michmela44/ESP3D-WEBUI).

# Proyecto base: ESP3D-WEBUI 3.0 ![ESP3D-WEBUI](https://img.shields.io/badge/dynamic/json?label=ESP3D-WEBUI&query=$.version&url=https://raw.githubusercontent.com/luc-github/ESP3D-WEBUI/refs/heads/3.0/info.json)

# ¿Necesitas más información sobre ESP3D-WEBUI y proyectos relacionados?

Visita https://esp3d.io
