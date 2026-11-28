const model = document.querySelector("#sanborn-model");
const inputs = ["haircut", "cost", "years", "rate"].map(name => model.elements.namedItem(name));
const outputs = ["releasable", "present", "gap"].map(id => document.getElementById(id));
const note = document.getElementById("model-note");
const scenarios = {
  base: [0, 0, 0, 10],
  friction: [0, 10, 2, 10],
  stress: [20, 10, 3, 10]
};

function updateModel() {
  if (inputs.some(input => !input.validity.valid)) {
    for (const output of outputs) output.value = "—";
    note.textContent = "请填完整四项，并使用输入框允许的范围。";
    return;
  }
  const [haircut, cost, years, rate] = inputs.map(input => input.valueAsNumber);
  const releasable = Math.max(65 * (1 - haircut / 100) - cost, 0);
  const present = releasable / ((1 + rate / 100) ** years);
  const gap = present - 45;
  outputs[0].value = releasable.toFixed(2) + " 美元";
  outputs[1].value = present.toFixed(2) + " 美元";
  const roundedGap = Number(gap.toFixed(2));
  outputs[2].value = (roundedGap > 0 ? "+" : "") + roundedGap.toFixed(2) + " 美元";
  note.textContent = "折损后资产扣除税费与留存，最低为零，再按预计兑现时间折现。";
}

model.addEventListener("submit", event => event.preventDefault());
model.addEventListener("input", updateModel);
for (const button of model.querySelectorAll("[data-scenario]")) {
  button.addEventListener("click", () => {
    const values = scenarios[button.dataset.scenario];
    for (const [index, input] of inputs.entries()) input.value = values[index];
    updateModel();
  });
}
document.getElementById("model-controls").disabled = false;
updateModel();
