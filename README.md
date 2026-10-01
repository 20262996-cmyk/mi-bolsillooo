# 💰 Mi Bolsillo

**Mi Bolsillo** es una aplicación web de finanzas personales creada para estudiantes, cuyo objetivo es ayudar a llevar un mejor control del dinero utilizado durante la semana.

La aplicación permite registrar los gastos realizados, establecer una meta de gasto semanal y visualizar mediante un semáforo el estado del presupuesto.

---

## 🎯 Objetivo del proyecto

El objetivo de **Mi Bolsillo** es brindar una herramienta sencilla para que los estudiantes puedan conocer en qué están utilizando su dinero y tomar mejores decisiones sobre sus gastos semanales.

---

## ✨ Funcionalidades principales

* 📝 Registro de gastos.
* 💵 Ingreso del monto gastado.
* 📂 Selección de categoría del gasto.
* 📅 Registro de la fecha.
* 📝 Agregar una nota al gasto.
* 🎯 Establecer una meta de gasto semanal.
* 🚦 Semáforo presupuestario:

  * 🟢 Verde: gasto menor al 70% de la meta.
  * 🟡 Amarillo: gasto entre el 70% y menos del 100%.
  * 🔴 Rojo: se alcanzó o superó la meta.
* 📊 Visualización del progreso semanal.
* 🗑️ Eliminación de gastos registrados.
* 💾 Guardado de información mediante `localStorage`.
* 📱 Interfaz adaptada para facilitar su uso.

---

## 🛠️ Tecnologías utilizadas

El proyecto fue desarrollado utilizando:

* **React**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **Lucide React**
* **HTML5**
* **CSS**
* **JavaScript/TypeScript**
* **LocalStorage**

---

## 📁 Estructura del proyecto

```text
mi-bolsillo/
│
├── src/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 💾 Almacenamiento de datos

La aplicación utiliza **localStorage** del navegador para guardar la información.

Se utilizan las siguientes claves:

```text
mi_bolsillo_gastos
mi_bolsillo_meta_semanal
```

Esto permite que los gastos y la meta semanal permanezcan guardados aunque el usuario cierre la pestaña y vuelva a abrir la aplicación en el mismo navegador y dispositivo.

### ⚠️ Limitación

Los datos almacenados mediante `localStorage` pertenecen al navegador y dispositivo donde fueron registrados.

Si se eliminan los datos del navegador, se cambia de dispositivo o se utiliza otro navegador, la información puede no estar disponible.

---

## 🧪 Prueba de persistencia

Para comprobar que los datos se guardan correctamente:

1. Registrar tres gastos.
2. Establecer una meta semanal.
3. Cerrar completamente la pestaña.
4. Volver a abrir la aplicación.
5. Comprobar que los gastos y la meta continúan registrados.

---

## 🚦 Funcionamiento del semáforo

El semáforo compara el total de gastos de la semana con la meta establecida.

| Estado      | Condición                  |
| ----------- | -------------------------- |
| 🟢 Verde    | Menos del 70% de la meta   |
| 🟡 Amarillo | 70% o más y menos del 100% |
| 🔴 Rojo     | 100% o más                 |

De esta manera, el usuario puede identificar rápidamente cómo se encuentra su presupuesto semanal.

---

## ▶️ Instalación y ejecución

Para ejecutar el proyecto localmente es necesario tener instalado **Node.js**.

Primero se deben instalar las dependencias:

```bash
npm install
```

Después se inicia el servidor de desarrollo:

```bash
npm run dev
```

Finalmente, se abre en el navegador la dirección que proporciona Vite.

---

## 🔎 Validaciones

La aplicación realiza validaciones básicas antes de guardar información.

Por ejemplo:

* El monto del gasto debe ser mayor que cero.
* La fecha del gasto debe estar seleccionada.
* La meta semanal debe ser mayor que cero.

Estas validaciones ayudan a evitar registros incorrectos.

---

## 🤖 Proyección de inteligencia artificial

Como parte de las mejoras futuras del proyecto, se plantea incorporar una función de inteligencia artificial capaz de revisar los gastos de la semana y generar recomendaciones concretas.

La función propuesta es:

> **“La IA revisa la semana y propone dónde recortar sin sacrificar lo necesario, con montos concretos.”**

La respuesta de la IA deberá utilizar información estructurada para que la aplicación pueda mostrar las recomendaciones dentro de la interfaz.

---

## 👩‍💻 Autora

**Daniela Colocho**

Proyecto académico: **Mi Bolsillo**

---

## 📌 Estado del proyecto

El proyecto se encuentra en desarrollo y se mejora progresivamente mediante diferentes etapas:

* **M1:** Funciones principales.
* **M2:** Persistencia de datos.
* **M3:** Experiencia de uso en celular.
* **M4:** Validaciones y manejo de errores.
* **M5:** Inteligencia artificial con salida estructurada.

---

## 📄 Licencia

Proyecto desarrollado con fines académicos.
