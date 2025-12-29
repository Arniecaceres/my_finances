Chart.register(ChartDataLabels);

/* =========================
   DOM
========================= */
const form = document.getElementById("transactionForm");
const list = document.getElementById("trackingList");

const movement = document.getElementById("movement");
const category = document.getElementById("category");
const amount = document.getElementById("amount");
const date = document.getElementById("date");

const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const totalSaving = document.getElementById("totalSaving");
const netFlow = document.getElementById("netFlow");

const flowChartCanvas = document.getElementById("flowChart");
const savingChartCanvas = document.getElementById("savingChart");
const netChartCanvas = document.getElementById("netChart");

/* =========================
   STATE
========================= */
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let goals = JSON.parse(localStorage.getItem("savingGoals")) || [];

let flowChart = null;
let savingChart = null;
let netChart = null;
let miniCharts = {};

/* =========================
   GUARDAR TRANSACCIÓN
========================= */
form.addEventListener("submit", e => {
  e.preventDefault();

  if (!movement.value || !category.value || !amount.value || !date.value) {
    alert("Completa todos los campos");
    return;
  }

  transactions.push({
    id: Date.now(),
    type: movement.value,
    category: category.value,
    amount: Number(amount.value),
    date: date.value
  });

  localStorage.setItem("transactions", JSON.stringify(transactions));
  form.reset();
  updateUI();
});

/* =========================
   UI GENERAL
========================= */
function updateUI() {
  let income = 0, expense = 0, saving = 0;

  transactions.forEach(t => {
    if (t.type === "income") income += t.amount;
    if (t.type === "expense") expense += t.amount;
    if (t.type === "saving-in") saving += t.amount;
    if (t.type === "saving-out") saving -= t.amount;
  });

  totalIncome.textContent = `S/ ${income}`;
  totalExpense.textContent = `S/ ${expense}`;
  totalSaving.textContent = `S/ ${saving}`;
  netFlow.textContent = `S/ ${income - expense}`;

  renderTracking();
  renderCharts();
  renderGoals();
}

/* =========================
   SEGUIMIENTO
========================= */
function renderTracking() {
  list.innerHTML = "";

  transactions.forEach(t => {
    const li = document.createElement("li");
    li.className = `track ${t.type}`;
    li.innerHTML = `
      <span>${t.date} | ${t.category} | S/ ${t.amount}</span>
      <div class="actions">
        <span class="edit" onclick="editTx(${t.id})">EDITAR</span>
        <span class="delete" onclick="deleteTx(${t.id})">ELIMINAR</span>
      </div>
    `;
    list.appendChild(li);
  });
}

function deleteTx(id) {
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateUI();
}

function editTx(id) {
  const t = transactions.find(tx => tx.id === id);
  if (!t) return;

  const newAmount = prompt("Nuevo monto", t.amount);
  if (!newAmount || isNaN(newAmount)) return;

  t.amount = Number(newAmount);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateUI();
}

/* =========================
   GRÁFICOS PRINCIPALES
========================= */
function renderCharts() {
  if (!transactions.length) return;

  const map = {};
  transactions.forEach(t => {
    if (!map[t.date]) map[t.date] = { income:0, expense:0, saving:0 };
    if (t.type === "income") map[t.date].income += t.amount;
    if (t.type === "expense") map[t.date].expense += t.amount;
    if (t.type === "saving-in") map[t.date].saving += t.amount;
    if (t.type === "saving-out") map[t.date].saving -= t.amount;
  });

  const dates = Object.keys(map).sort();
  const incomeData = dates.map(d => map[d].income);
  const expenseData = dates.map(d => map[d].expense);
  const savingData = dates.map(d => map[d].saving);
  const netData = dates.map(d => map[d].income - map[d].expense);

  flowChart?.destroy();
  savingChart?.destroy();
  netChart?.destroy();

  flowChart = new Chart(flowChartCanvas, {
    type:"line",
    data:{labels:dates,datasets:[
      makeDataset("Ingresos",incomeData,"#3b82f6"),
      makeDataset("Egresos",expenseData,"#ef4444"),
      makeDataset("Ahorros",savingData,"#facc15")
    ]}
  });

  savingChart = new Chart(savingChartCanvas, {
    type:"line",
    data:{labels:dates,datasets:[
      makeDataset("Ahorros",savingData,"#facc15")
    ]}
  });

  netChart = new Chart(netChartCanvas, {
    type:"line",
    data:{labels:dates,datasets:[
      makeDataset("Flujo Neto",netData,"#00ff65")
    ]}
  });
}

function makeDataset(label,data,color){
  return {
    label,
    data,
    borderColor:color,
    backgroundColor:"transparent",
    tension:0.45,
    pointRadius:4,
    datalabels:{color,align:"top",font:{weight:"bold"}}
  };
}

/* =========================
   METAS DE AHORRO
========================= */
const goalNameInput = document.getElementById("goalName");
const goalTargetInput = document.getElementById("goalTarget");
const goalsList = document.getElementById("goalsList");

document.getElementById("addGoal").onclick = () => {
  const target = Number(goalTargetInput.value);
  if (!target || target <= 0) return alert("Monto inválido");

  goals.push({
    id: Date.now(),
    name: goalNameInput.value || "Meta de ahorro",
    target
  });

  localStorage.setItem("savingGoals", JSON.stringify(goals));
  goalNameInput.value = "";
  goalTargetInput.value = "";
  renderGoals();
};

function renderGoals() {
  goalsList.innerHTML = "";

  Object.values(miniCharts).forEach(c => c.destroy());
  miniCharts = {};

  let savingIn = 0;
  let savingOut = 0;
  const daily = {};

  transactions.forEach(t => {
    if (t.type === "saving-in") {
      savingIn += t.amount;
      daily[t.date] = (daily[t.date] || 0) + t.amount;
    }
    if (t.type === "saving-out") savingOut += t.amount;
  });

  const netSaving = savingIn - savingOut;
  const dailyData = Object.values(daily);

  goals.forEach(goal => {
    const percent = Math.min((netSaving / goal.target) * 100, 100).toFixed(1);

    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML = `
      <div class="goal-info">
        <strong>${goal.name}</strong>
        Objetivo: S/ ${goal.target}<br>
        Ahorro actual: S/ ${netSaving}<br>
        Avance: ${percent}%
        <div class="goal-actions">
          <span class="edit" onclick="editGoal(${goal.id})">EDITAR</span>
          <span class="delete" onclick="deleteGoal(${goal.id})">ELIMINAR</span>
        </div>
      </div>
      <canvas class="goal-mini" id="mini-${goal.id}"></canvas>
    `;
    goalsList.appendChild(card);

    const ctx = document.getElementById(`mini-${goal.id}`);
    miniCharts[goal.id] = new Chart(ctx, {
      type:"line",
      data:{labels:dailyData.map((_,i)=>i+1),datasets:[{
        data:dailyData,
        borderColor:"#facc15",
        tension:0.4,
        pointRadius:0
      }]},
      options:{plugins:{legend:{display:false}},scales:{x:{display:false},y:{display:false}}}
    });
  });
}

function deleteGoal(id) {
  goals = goals.filter(g => g.id !== id);
  localStorage.setItem("savingGoals", JSON.stringify(goals));
  renderGoals();
}

function editGoal(id) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  const newTarget = prompt("Nuevo monto objetivo", goal.target);
  if (!newTarget || isNaN(newTarget)) return;
  goal.target = Number(newTarget);
  localStorage.setItem("savingGoals", JSON.stringify(goals));
  renderGoals();
}

/* =========================
   INTERACCIONES
========================= */
flowChartCanvas.onclick=()=>flowChartCanvas.classList.toggle("full");
savingChartCanvas.onclick=()=>savingChartCanvas.classList.toggle("full");
netChartCanvas.onclick=()=>netChartCanvas.classList.toggle("full");

document.querySelectorAll('input[name="movementRadio"]').forEach(r=>{
  r.onchange=()=>movement.value=r.value;
});

/* =========================
   TEMA
========================= */
const themeToggle=document.getElementById("themeToggle");
if(localStorage.getItem("theme")==="light"){
  document.body.classList.add("light");
  themeToggle.textContent="Modo Oscuro";
}
themeToggle.onclick=()=>{
  document.body.classList.toggle("light");
  const light=document.body.classList.contains("light");
  localStorage.setItem("theme",light?"light":"dark");
  themeToggle.textContent=light?"Modo Oscuro":"Modo Claro";
};

updateUI();
