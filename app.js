let movimientos = JSON.parse(localStorage.getItem("movimientos")) || [];
let chartPrincipal, chartAnalisis, chartMeta;

const categorias = {
  ingreso: ["Trabajo", "Propinas", "Ventas"],
  egreso: ["Alimentación", "Vivienda", "Ocio"],
  ahorro: ["Meta", "Inversión"]
};

function actualizarCategorias() {
  categoria.innerHTML = "";
  categorias[tipo.value].forEach(c => {
    let o = document.createElement("option");
    o.textContent = c;
    categoria.appendChild(o);
  });
}
actualizarCategorias();

const formato = v => `S/ ${v.toFixed(2)}`;

form.onsubmit = e => {
  e.preventDefault();
  movimientos.push({
    descripcion: descripcion.value,
    monto: +monto.value,
    tipo: tipo.value,
    fecha: fecha.value
  });
  localStorage.setItem("movimientos", JSON.stringify(movimientos));
  form.reset();
  actualizarCategorias();
  render();
};

function render() {
  lista.innerHTML = "";
  let i = 0, e = 0, a = 0;

  movimientos.forEach((m, idx) => {
    if (m.tipo === "ingreso") i += m.monto;
    if (m.tipo === "egreso") e += m.monto;
    if (m.tipo === "ahorro") a += m.monto;

    let li = document.createElement("li");
    if (m.tipo === "egreso") li.classList.add("egreso-box");

    li.innerHTML = `
      <div>
        <strong>${m.tipo}</strong><br>
        <small>${m.descripcion}</small>
      </div>

      <strong style="color:${m.tipo==='ingreso'?'#2563eb':m.tipo==='egreso'?'#dc2626':'#d4af37'}">
        ${m.tipo==='egreso' ? '-' : '+'} ${formato(m.monto)}
      </strong>

      <div class="actions">
        <div class="btn-blue" onclick="editarMonto(${idx})"></div>
        <div class="btn-red" onclick="eliminar(${idx})"></div>
      </div>
    `;
    lista.appendChild(li);
  });

  ingresos.textContent = formato(i);
  egresos.textContent = formato(e);
  ahorro.textContent = formato(a);
  balance.textContent = formato(i - e);

  renderGrafico();
}

/* EDITAR MONTO */
function editarMonto(index) {
  let actual = movimientos[index].monto;
  let nuevo = prompt("Nuevo monto (S/):", actual);

  if (nuevo === null) return;
  nuevo = parseFloat(nuevo);

  if (isNaN(nuevo) || nuevo <= 0) {
    alert("Monto inválido");
    return;
  }

  movimientos[index].monto = nuevo;
  localStorage.setItem("movimientos", JSON.stringify(movimientos));
  render();
}

/* GRAFICO PRINCIPAL */
function renderGrafico() {
  if (chartPrincipal) chartPrincipal.destroy();

  let tipoGraf = chartType.value === "combo" ? "bar" : chartType.value;

  chartPrincipal = new Chart(graficoPrincipal, {
    type: tipoGraf,
    data: {
      labels: movimientos.map(m => m.fecha),
      datasets: [
        {
          label: "Ingresos",
          data: movimientos.filter(m => m.tipo === "ingreso").map(m => m.monto),
          borderColor: "#2563eb",
          backgroundColor: "#2563eb55",
          type: chartType.value === "combo" ? "line" : undefined,
          tension: 0.4
        },
        {
          label: "Egresos",
          data: movimientos.filter(m => m.tipo === "egreso").map(m => m.monto),
          borderColor: "#dc2626",
          backgroundColor: "#dc262655"
        },
        {
          label: "Ahorros",
          data: movimientos.filter(m => m.tipo === "ahorro").map(m => m.monto),
          borderColor: "#d4af37",
          backgroundColor: "#d4af3755",
          type: chartType.value === "combo" ? "line" : undefined,
          tension: 0.4
        }
      ]
    },
    options: { animation:{ duration:1400 } }
  });
}

/* ELIMINAR */
function eliminar(i) {
  movimientos.splice(i, 1);
  localStorage.setItem("movimientos", JSON.stringify(movimientos));
  render();
}

/* META DE AHORRO */
function abrirMeta() { modalMeta.classList.add("active"); }
function cerrarMeta() { modalMeta.classList.remove("active"); }

function calcularMeta() {
  let meta = +metaMonto.value;
  let total = movimientos.filter(m => m.tipo === "ahorro")
    .reduce((s, m) => s + m.monto, 0);

  let mensual = total || 1;
  let meses = Math.ceil(meta / mensual);

  barra.style.width = Math.min((total / meta) * 100, 100) + "%";
  resultadoMeta.textContent = `Al ritmo actual alcanzarás tu meta en ${meses} meses`;

  if (chartMeta) chartMeta.destroy();
  chartMeta = new Chart(graficoMeta, {
    type: "line",
    data: {
      labels: Array.from({ length: meses }, (_, i) => `Mes ${i+1}`),
      datasets: [{
        label: "Proyección de Ahorro",
        data: Array.from({ length: meses }, (_, i) => (i+1)*mensual),
        borderColor: "#d4af37",
        tension: 0.4
      }]
    }
  });
}

/* ANALISIS FINANCIERO */
function mostrarAnalisis() {
  modalAnalisis.classList.add("active");

  let acumulado = 0;
  let data = movimientos.map(m => {
    acumulado += m.tipo === "ingreso" ? m.monto :
                 m.tipo === "egreso" ? -m.monto : 0;
    return acumulado;
  });

  if (chartAnalisis) chartAnalisis.destroy();
  chartAnalisis = new Chart(graficoAnalisis, {
    type: "line",
    data: {
      labels: movimientos.map(m => m.fecha),
      datasets: [{
        label: "Evolución Financiera",
        data: data,
        borderColor: "#22c55e",
        tension: 0.3
      }]
    }
  });
}

function cerrarAnalisis() { modalAnalisis.classList.remove("active"); }
function setTheme(t) { document.body.className = t; }

render();
