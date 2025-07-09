const EQUATIONS = [
  {
    name: "$f(x) = x^2 - 2$",
    f: (x) => x * x - 2,
    f_prime: (x) => 2 * x,
    rangeX: [-3, 3],
    rangeY: [-5, 5],
    bisectionDefaults: {
      a: 0,
      b: 2,
      tolerance: 0.0001,
      maxIterations: 100,
    },
    newtonDefaults: { x0: 1.5, tolerance: 0.0001, maxIterations: 100 },
  },
  {
    name: "$f(x) = x^3 - 2x + 2$", // 変更
    f: (x) => x * x * x - 2 * x + 2, // 変更
    f_prime: (x) => 3 * x * x - 2, // 変更
    rangeX: [-2, 2],
    rangeY: [-5, 5],
    bisectionDefaults: {
      a: -2,
      b: -1,
      tolerance: 0.0001,
      maxIterations: 100,
    }, // 変更
    newtonDefaults: { x0: -1.5, tolerance: 0.0001, maxIterations: 100 }, // 変更
  },
  {
    name: "$f(x) = \\cos(x) - x$",
    f: (x) => Math.cos(x) - x,
    f_prime: (x) => -Math.sin(x) - 1,
    rangeX: [-2, 2],
    rangeY: [-3, 3],
    bisectionDefaults: {
      a: 0,
      b: 1,
      tolerance: 0.0001,
      maxIterations: 100,
    },
    newtonDefaults: { x0: 0.5, tolerance: 0.0001, maxIterations: 100 },
  },
  {
    name: "$f(x) = e^x - 3x$",
    f: (x) => Math.exp(x) - 3 * x,
    f_prime: (x) => Math.exp(x) - 3,
    rangeX: [-1, 3],
    rangeY: [-2, 5],
    bisectionDefaults: {
      a: 0,
      b: 1,
      tolerance: 0.0001,
      maxIterations: 100,
    },
    newtonDefaults: { x0: 0.5, tolerance: 0.0001, maxIterations: 100 },
  },
];

const CANVAS_SETTINGS = {
  FONT: "10px sans-serif",
  AXIS_COLOR: "#999",
  FUNCTION_COLOR: "#3498db",
  HIGHLIGHT_POINT_COLOR: "#e74c3c",
  BISECTION_INTERVAL_COLOR: "#27ae60",
  NEWTON_LINE_COLOR: "#8e44ad",
  LINE_WIDTH_NORMAL: 1,
  LINE_WIDTH_THICK: 2,
  LINE_WIDTH_THICKER: 3,
  POINT_RADIUS_LARGE: 5,
  POINT_RADIUS_SMALL: 4,
  DASH_PATTERN: [5, 5],
  DERIVATIVE_ZERO_THRESHOLD: 1e-9,
};

const equationSelect = document.getElementById("equation-select");
const equationCanvas = document.getElementById("equation-canvas");
const ctx = equationCanvas.getContext("2d");
const equationDisplay = document.getElementById("equation-display");

const bisectionA = document.getElementById("bisection-a");
const bisectionB = document.getElementById("bisection-b");
const bisectionTolerance = document.getElementById("bisection-tolerance");
const bisectionMaxIterations = document.getElementById(
  "bisection-max-iterations"
);
const runBisectionBtn = document.getElementById("run-bisection-btn");
const stepBisectionBtn = document.getElementById("step-bisection-btn");
const bisectionResultsTableBody = document.querySelector(
  "#bisection-results-table tbody"
);
const bisectionMessage = document.getElementById("bisection-message");

const newtonX0 = document.getElementById("newton-x0");
const newtonTolerance = document.getElementById("newton-tolerance");
const newtonMaxIterations = document.getElementById("newton-max-iterations");
const runNewtonBtn = document.getElementById("run-newton-btn");
const stepNewtonBtn = document.getElementById("step-newton-btn");
const newtonResultsTableBody = document.querySelector(
  "#newton-results-table tbody"
);
const newtonMessage = document.getElementById("newton-message");

const resetGraphBtn = document.getElementById("reset-graph-btn");

let currentScaleX, currentScaleY, currentOriginX, currentOriginY;

function clearCanvas() {
  ctx.clearRect(0, 0, equationCanvas.width, equationCanvas.height);
}

function toCanvasCoords(x, y) {
  return {
    canvasX: currentOriginX + x * currentScaleX,
    canvasY: currentOriginY - y * currentScaleY,
  };
}

function drawAxes() {
  ctx.strokeStyle = CANVAS_SETTINGS.AXIS_COLOR;
  ctx.lineWidth = CANVAS_SETTINGS.LINE_WIDTH_NORMAL;

  ctx.beginPath();
  ctx.moveTo(0, currentOriginY);
  ctx.lineTo(equationCanvas.width, currentOriginY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(currentOriginX, 0);
  ctx.lineTo(currentOriginX, equationCanvas.height);
  ctx.stroke();

  ctx.fillStyle = CANVAS_SETTINGS.AXIS_COLOR;
  ctx.font = CANVAS_SETTINGS.FONT;
  const tickSize = 5;

  for (
    let x = simulationManager.selectedEquation.rangeX[0];
    x <= simulationManager.selectedEquation.rangeX[1];
    x += 1
  ) {
    if (x === 0) continue;
    const { canvasX } = toCanvasCoords(x, 0);
    ctx.beginPath();
    ctx.moveTo(canvasX, currentOriginY - tickSize / 2);
    ctx.lineTo(canvasX, currentOriginY + tickSize / 2);
    ctx.stroke();
    ctx.fillText(x.toString(), canvasX - 5, currentOriginY + 15);
  }

  for (
    let y = simulationManager.selectedEquation.rangeY[0];
    y <= simulationManager.selectedEquation.rangeY[1];
    y += 1
  ) {
    if (y === 0) continue;
    const { canvasY } = toCanvasCoords(0, y);
    ctx.beginPath();
    ctx.moveTo(currentOriginX - tickSize / 2, canvasY);
    ctx.lineTo(currentOriginX + tickSize / 2, canvasY);
    ctx.stroke();
    ctx.fillText(y.toString(), currentOriginX + 10, canvasY + 5);
  }
  ctx.fillText("0", currentOriginX - 10, currentOriginY + 15);
}

function plotFunction(f) {
  ctx.strokeStyle = CANVAS_SETTINGS.FUNCTION_COLOR;
  ctx.lineWidth = CANVAS_SETTINGS.LINE_WIDTH_THICK;
  ctx.beginPath();

  const step =
    (simulationManager.selectedEquation.rangeX[1] -
      simulationManager.selectedEquation.rangeX[0]) /
    (equationCanvas.width / 2);

  for (let i = 0; i <= equationCanvas.width; i++) {
    const x = (i - currentOriginX) / currentScaleX;
    const y = f(x);
    const { canvasX, canvasY } = toCanvasCoords(x, y);

    if (i === 0) {
      ctx.moveTo(canvasX, canvasY);
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }
  ctx.stroke();
}

function drawBisectionStep(a, b, m, f_m) {
  ctx.strokeStyle = CANVAS_SETTINGS.BISECTION_INTERVAL_COLOR;
  ctx.lineWidth = CANVAS_SETTINGS.LINE_WIDTH_THICKER;
  ctx.beginPath();
  const { canvasX: canvasA } = toCanvasCoords(a, 0);
  const { canvasX: canvasB } = toCanvasCoords(b, 0);
  ctx.moveTo(canvasA, currentOriginY);
  ctx.lineTo(canvasB, currentOriginY);
  ctx.stroke();

  ctx.fillStyle = CANVAS_SETTINGS.HIGHLIGHT_POINT_COLOR;
  const { canvasX: canvasM, canvasY: canvasFm } = toCanvasCoords(m, f_m);
  ctx.beginPath();
  ctx.arc(
    canvasM,
    canvasFm,
    CANVAS_SETTINGS.POINT_RADIUS_LARGE,
    0,
    2 * Math.PI
  );
  ctx.fill();

  ctx.beginPath();
  ctx.arc(
    canvasM,
    currentOriginY,
    CANVAS_SETTINGS.POINT_RADIUS_SMALL,
    0,
    2 * Math.PI
  );
  ctx.fill();

  ctx.strokeStyle = CANVAS_SETTINGS.HIGHLIGHT_POINT_COLOR;
  ctx.lineWidth = CANVAS_SETTINGS.LINE_WIDTH_NORMAL;
  ctx.setLineDash(CANVAS_SETTINGS.DASH_PATTERN);
  ctx.beginPath();
  ctx.moveTo(canvasM, currentOriginY);
  ctx.lineTo(canvasM, canvasFm);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawNewtonStep(x_k, f_x_k, f_prime_x_k, next_x) {
  ctx.fillStyle = CANVAS_SETTINGS.NEWTON_LINE_COLOR;
  const { canvasX: canvasXk, canvasY: canvasFxk } = toCanvasCoords(x_k, f_x_k);
  ctx.beginPath();
  ctx.arc(
    canvasXk,
    canvasFxk,
    CANVAS_SETTINGS.POINT_RADIUS_LARGE,
    0,
    2 * Math.PI
  );
  ctx.fill();

  ctx.beginPath();
  ctx.arc(
    canvasXk,
    currentOriginY,
    CANVAS_SETTINGS.POINT_RADIUS_SMALL,
    0,
    2 * Math.PI
  );
  ctx.fill();

  ctx.strokeStyle = CANVAS_SETTINGS.NEWTON_LINE_COLOR;
  ctx.lineWidth = CANVAS_SETTINGS.LINE_WIDTH_THICK;
  ctx.beginPath();
  const plotRangeX =
    simulationManager.selectedEquation.rangeX[1] -
    simulationManager.selectedEquation.rangeX[0];
  const x1 = x_k - plotRangeX * 2;
  const y1 = f_x_k + f_prime_x_k * (x1 - x_k);
  const x2 = x_k + plotRangeX * 2;
  const y2 = f_x_k + f_prime_x_k * (x2 - x_k);

  const { canvasX: cX1, canvasY: cY1 } = toCanvasCoords(x1, y1);
  const { canvasX: cX2, canvasY: cY2 } = toCanvasCoords(x2, y2);
  ctx.moveTo(cX1, cY1);
  ctx.lineTo(cX2, cY2);
  ctx.stroke();

  if (isFinite(next_x)) {
    ctx.fillStyle = CANVAS_SETTINGS.HIGHLIGHT_POINT_COLOR;
    const { canvasX: canvasNextX } = toCanvasCoords(next_x, 0);
    ctx.beginPath();
    ctx.arc(
      canvasNextX,
      currentOriginY,
      CANVAS_SETTINGS.POINT_RADIUS_LARGE,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }

  ctx.strokeStyle = CANVAS_SETTINGS.NEWTON_LINE_COLOR;
  ctx.lineWidth = CANVAS_SETTINGS.LINE_WIDTH_NORMAL;
  ctx.setLineDash(CANVAS_SETTINGS.DASH_PATTERN);
  ctx.beginPath();
  ctx.moveTo(canvasXk, currentOriginY);
  ctx.lineTo(canvasXk, canvasFxk);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGraph(
  selectedEquation,
  bisectionAllSteps,
  currentBisectionStepIndex,
  newtonAllSteps,
  currentNewtonStepIndex
) {
  clearCanvas();

  const width = equationCanvas.width;
  const height = equationCanvas.height;

  const rangeX = selectedEquation.rangeX[1] - selectedEquation.rangeX[0];
  const rangeY = selectedEquation.rangeY[1] - selectedEquation.rangeY[0];

  currentScaleX = width / rangeX;
  currentScaleY = height / rangeY;

  currentOriginX = -selectedEquation.rangeX[0] * currentScaleX;
  currentOriginY = selectedEquation.rangeY[1] * currentScaleY;

  drawAxes();
  plotFunction(selectedEquation.f);

  if (
    currentBisectionStepIndex !== -1 &&
    currentBisectionStepIndex < bisectionAllSteps.length
  ) {
    const step = bisectionAllSteps[currentBisectionStepIndex];
    drawBisectionStep(step.a, step.b, step.m, step.fm);
  } else if (
    currentNewtonStepIndex !== -1 &&
    currentNewtonStepIndex < newtonAllSteps.length
  ) {
    const step = newtonAllSteps[currentNewtonStepIndex];
    drawNewtonStep(step.xk, step.fxk, step.f_prime_xk, step.next_x);
  }
}

function calculateAllBisectionSteps(f, a, b, tolerance, maxIterations) {
  const steps = [];
  let success = false;
  // 初期区間の問題があるかどうかを事前に判断
  let initialIntervalProblem = f(a) * f(b) >= 0;

  let iteration = 0;
  let currentA = a;
  let currentB = b;
  let m = (currentA + currentB) / 2; // mを初期化して、ループが実行されない場合でも値を持つようにする
  let fm = f(m);

  while (iteration < maxIterations) {
    m = (currentA + currentB) / 2;
    fm = f(m);

    steps.push({
      iteration: iteration + 1,
      a: currentA,
      b: currentB,
      m: m,
      fm: fm,
      diff: Math.abs(currentB - currentA),
    });

    // 初期区間に問題がない場合のみ収束条件をチェック
    if (
      !initialIntervalProblem &&
      (Math.abs(fm) < tolerance || Math.abs(currentB - currentA) < tolerance)
    ) {
      success = true;
      break;
    }

    // 二分法の区間更新ロジック
    if (f(currentA) * fm < 0) {
      currentB = m;
    } else {
      currentA = m;
    }
    iteration++;
  }

  let message;
  // 最後の計算されたmの値を取得（ステップが生成されていない場合は'N/A'）
  const finalM = steps.length > 0 ? steps[steps.length - 1].m : "N/A";

  if (success) {
    message = `二分法: ${iteration} ステップで解が収束しました。近似解は ${finalM.toFixed(
      6
    )} です。`;
  } else {
    if (initialIntervalProblem) {
      message = `二分法: 初期区間 [a, b] で f(a) と f(b) の符号が異なります。最大繰り返し回数 (${maxIterations}) に達しましたが、収束しませんでした。現在の近似値は ${
        finalM !== "N/A" ? finalM.toFixed(6) : "N/A"
      } です。`;
    } else {
      message = `二分法: 最大繰り返し回数 (${maxIterations}) に達しました。収束しませんでした。現在の近似値は ${
        finalM !== "N/A" ? finalM.toFixed(6) : "N/A"
      } です。`;
    }
  }

  return { steps, message, success, initialIntervalProblem };
}

function addBisectionStepToTable(step) {
  const row = bisectionResultsTableBody.insertRow();
  row.insertCell().textContent = step.iteration;
  row.insertCell().textContent = step.a.toFixed(6);
  row.insertCell().textContent = step.b.toFixed(6);
  row.insertCell().textContent = step.m.toFixed(6);
  row.insertCell().textContent = step.fm.toExponential(3);
  row.insertCell().textContent = step.diff.toFixed(6);
  bisectionResultsTableBody.scrollTop = bisectionResultsTableBody.scrollHeight;
}

function calculateAllNewtonSteps(f, f_prime, x0, tolerance, maxIterations) {
  const steps = [];
  let message = "";
  let success = false;

  let iteration = 0;
  let xk = x0;
  let fxk, f_prime_xk, next_x;

  while (iteration < maxIterations) {
    fxk = f(xk);
    f_prime_xk = f_prime(xk);

    if (Math.abs(f_prime_xk) < CANVAS_SETTINGS.DERIVATIVE_ZERO_THRESHOLD) {
      message = `エラー: ニュートン法で導関数が0に近くなりました (f'(${xk.toFixed(
        6
      )}) = ${f_prime_xk.toExponential(3)})。これ以上計算を続行できません。`;
      steps.push({
        iteration: iteration + 1,
        xk: xk,
        fxk: fxk,
        f_prime_xk: f_prime_xk,
        next_x: f_prime_xk === 0 ? NaN : xk - fxk / f_prime_xk,
      });
      return { steps, message, success: false };
    }

    next_x = xk - fxk / f_prime_xk;

    steps.push({
      iteration: iteration + 1,
      xk: xk,
      fxk: fxk,
      f_prime_xk: f_prime_xk,
      next_x: next_x,
    });

    if (Math.abs(f(next_x)) < tolerance || Math.abs(next_x - xk) < tolerance) {
      message = `ニュートン法: ${
        iteration + 1
      } ステップで解が収束しました。近似解は ${next_x.toFixed(6)} です。`;
      success = true;
      break;
    }

    xk = next_x;
    iteration++;
  }

  if (!success) {
    message = `ニュートン法: 最大繰り返し回数 (${maxIterations}) に達しました。現在の近似解は ${xk.toFixed(
      6
    )} です。`;
  }

  return { steps, message, success };
}

function addNewtonStepToTable(step) {
  const row = newtonResultsTableBody.insertRow();
  row.insertCell().textContent = step.iteration;
  row.insertCell().textContent = step.xk.toFixed(6);
  row.insertCell().textContent = step.fxk.toExponential(3);
  row.insertCell().textContent = step.f_prime_xk.toExponential(3);
  row.insertCell().textContent = isFinite(step.next_x)
    ? step.next_x.toFixed(6)
    : "N/A";
  newtonResultsTableBody.scrollTop = newtonResultsTableBody.scrollHeight;
}

class SimulationManager {
  constructor() {
    this.selectedEquation = EQUATIONS[0];
    this.bisectionAllSteps = [];
    this.newtonAllSteps = [];
    this.currentBisectionStepIndex = -1;
    this.currentNewtonStepIndex = -1;
    this.bisectionInitialProblem = false; // 二分法の初期区間問題フラグ
  }

  initialize() {
    this.initializeEquationSelect();
    this.drawGraph();
  }

  initializeEquationSelect() {
    if (!equationSelect) {
      console.error("DOM element 'equation-select' not found.");
      return;
    }

    equationSelect.innerHTML = "";
    EQUATIONS.forEach((eq, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = eq.name;
      equationSelect.appendChild(option);
    });

    if (equationSelect.options.length > 0) {
      equationSelect.value = 0;
      this.updateSelectedEquation(0);
    } else {
      console.warn("No equations loaded or dropdown not populated.");
    }
  }

  updateSelectedEquation(index) {
    this.selectedEquation = EQUATIONS[index];
    equationDisplay.textContent = this.selectedEquation.name;

    bisectionA.value = this.selectedEquation.bisectionDefaults.a;
    bisectionB.value = this.selectedEquation.bisectionDefaults.b;
    bisectionTolerance.value =
      this.selectedEquation.bisectionDefaults.tolerance;
    bisectionMaxIterations.value =
      this.selectedEquation.bisectionDefaults.maxIterations;

    newtonX0.value = this.selectedEquation.newtonDefaults.x0;
    newtonTolerance.value = this.selectedEquation.newtonDefaults.tolerance;
    newtonMaxIterations.value =
      this.selectedEquation.newtonDefaults.maxIterations;

    this.resetSimulationState();
    this.drawGraph();
  }

  resetSimulationState() {
    bisectionResultsTableBody.innerHTML = "";
    newtonResultsTableBody.innerHTML = "";
    bisectionMessage.classList.add("hidden");
    newtonMessage.classList.add("hidden");
    bisectionMessage.classList.remove("success", "error");
    newtonMessage.classList.remove("success", "error");

    this.bisectionAllSteps = [];
    this.newtonAllSteps = [];
    this.currentBisectionStepIndex = -1;
    this.currentNewtonStepIndex = -1;
    this.bisectionInitialProblem = false; // リセット時にもフラグをクリア

    stepBisectionBtn.disabled = false;
    stepNewtonBtn.disabled = false;
  }

  drawGraph() {
    drawGraph(
      this.selectedEquation,
      this.bisectionAllSteps,
      this.currentBisectionStepIndex,
      this.newtonAllSteps,
      this.currentNewtonStepIndex
    );
  }

  runBisectionFull(a, b, tolerance, maxIterations) {
    this.resetSimulationState();
    const { steps, message, success, initialIntervalProblem } =
      calculateAllBisectionSteps(
        this.selectedEquation.f,
        a,
        b,
        tolerance,
        maxIterations
      );
    this.bisectionAllSteps = steps;
    this.bisectionInitialProblem = initialIntervalProblem; // フラグを保存

    this.bisectionAllSteps.forEach((step) => addBisectionStepToTable(step));

    bisectionMessage.textContent = message;
    bisectionMessage.classList.remove("hidden");
    // 初期区間問題がある場合、または成功しなかった場合はエラー表示
    bisectionMessage.classList.add(success ? "success" : "error");
    this.currentBisectionStepIndex =
      this.bisectionAllSteps.length > 0
        ? this.bisectionAllSteps.length - 1
        : -1;
    this.drawGraph();
  }

  runBisectionStep(a, b, tolerance, maxIterations) {
    // ニュートン法の状態をリセット
    newtonResultsTableBody.innerHTML = "";
    newtonMessage.classList.add("hidden");
    newtonMessage.classList.remove("success", "error");
    this.newtonAllSteps = [];
    this.currentNewtonStepIndex = -1;
    stepNewtonBtn.disabled = false;

    if (this.currentBisectionStepIndex === -1) {
      // 初回ステップ実行時：全ステップを計算し、初期区間問題をチェック
      bisectionResultsTableBody.innerHTML = "";
      bisectionMessage.classList.add("hidden");
      bisectionMessage.classList.remove("success", "error");

      const { steps, message, success, initialIntervalProblem } =
        calculateAllBisectionSteps(
          this.selectedEquation.f,
          a,
          b,
          tolerance,
          maxIterations
        );
      this.bisectionAllSteps = steps;
      this.bisectionInitialProblem = initialIntervalProblem; // 初期区間問題フラグを保存

      if (steps.length === 0) {
        // ステップが全く生成されなかった場合（例：不正な入力）
        bisectionMessage.textContent = message;
        bisectionMessage.classList.remove("hidden");
        bisectionMessage.classList.add("error");
        stepBisectionBtn.disabled = true; // ステップ実行を無効化
        return;
      }
      this.currentBisectionStepIndex = 0; // 最初のステップから開始
    } else {
      this.currentBisectionStepIndex++; // 次のステップへ
    }

    if (this.currentBisectionStepIndex < this.bisectionAllSteps.length) {
      const step = this.bisectionAllSteps[this.currentBisectionStepIndex];
      addBisectionStepToTable(step); // 現在のステップをテーブルに追加
      this.drawGraph(); // グラフを更新
    } else {
      // 全ステップ完了後の最終メッセージ表示
      // 最終的なメッセージと成功/失敗の状態を再計算して表示
      const { message, success } = calculateAllBisectionSteps(
        // 再度計算して最終メッセージを取得
        this.selectedEquation.f,
        a,
        b,
        tolerance,
        maxIterations
      );

      bisectionMessage.textContent = message;
      bisectionMessage.classList.remove("hidden");
      // 初期区間問題がある場合、または成功しなかった場合はエラー表示
      bisectionMessage.classList.add(success ? "success" : "error");
      stepBisectionBtn.disabled = true; // 全ステップ完了でボタンを無効化
    }
  }

  runNewtonFull(x0, tolerance, maxIterations) {
    this.resetSimulationState();
    const { steps, message, success } = calculateAllNewtonSteps(
      this.selectedEquation.f,
      this.selectedEquation.f_prime,
      x0,
      tolerance,
      maxIterations
    );
    this.newtonAllSteps = steps;

    this.newtonAllSteps.forEach((step) => addNewtonStepToTable(step));

    newtonMessage.textContent = message;
    newtonMessage.classList.remove("hidden");
    newtonMessage.classList.add(success ? "success" : "error");

    this.currentNewtonStepIndex =
      this.newtonAllSteps.length > 0 ? this.newtonAllSteps.length - 1 : -1;
    this.drawGraph();
  }

  runNewtonStep(x0, tolerance, maxIterations) {
    // 二分法の状態をリセット
    bisectionResultsTableBody.innerHTML = "";
    bisectionMessage.classList.add("hidden");
    bisectionMessage.classList.remove("success", "error");
    this.bisectionAllSteps = [];
    this.currentBisectionStepIndex = -1;
    stepBisectionBtn.disabled = false;

    if (this.currentNewtonStepIndex === -1) {
      // 初回ステップ実行時
      newtonResultsTableBody.innerHTML = "";
      newtonMessage.classList.add("hidden");
      newtonMessage.classList.remove("success", "error");

      const { steps, message, success } = calculateAllNewtonSteps(
        this.selectedEquation.f,
        this.selectedEquation.f_prime,
        x0,
        tolerance,
        maxIterations
      );
      this.newtonAllSteps = steps;

      if (!success && steps.length === 0) {
        // エラーで計算が開始できなかった場合
        newtonMessage.textContent = message;
        newtonMessage.classList.remove("hidden");
        newtonMessage.classList.add("error");
        stepNewtonBtn.disabled = true;
        return;
      }
      this.currentNewtonStepIndex = 0; // 最初のステップから開始
    } else {
      this.currentNewtonStepIndex++; // 次のステップへ
    }

    if (this.currentNewtonStepIndex < this.newtonAllSteps.length) {
      const step = this.newtonAllSteps[this.currentNewtonStepIndex];
      addNewtonStepToTable(step); // 現在のステップをテーブルに追加
      this.drawGraph(); // グラフを更新
    } else {
      // 全ステップ完了後の最終メッセージ表示
      const finalStep = this.newtonAllSteps[this.newtonAllSteps.length - 1];
      const finalMessage = `ニュートン法: 全ステップが完了しました。近似解は ${
        isFinite(finalStep.next_x) ? finalStep.next_x.toFixed(6) : "N/A"
      } です。`;
      newtonMessage.textContent = finalMessage;
      newtonMessage.classList.remove("hidden");
      newtonMessage.classList.add("success");
      stepNewtonBtn.disabled = true; // 全ステップ完了でボタンを無効化
    }
  }
}

const simulationManager = new SimulationManager();

function setupEventListeners() {
  equationSelect.addEventListener("change", (event) => {
    simulationManager.updateSelectedEquation(parseInt(event.target.value));
  });

  runBisectionBtn.addEventListener("click", () => {
    const a = parseFloat(bisectionA.value);
    const b = parseFloat(bisectionB.value);
    const tolerance = parseFloat(bisectionTolerance.value);
    const maxIterations = parseInt(bisectionMaxIterations.value);
    simulationManager.runBisectionFull(a, b, tolerance, maxIterations);
  });

  stepBisectionBtn.addEventListener("click", () => {
    const a = parseFloat(bisectionA.value);
    const b = parseFloat(bisectionB.value);
    const tolerance = parseFloat(bisectionTolerance.value);
    const maxIterations = parseInt(bisectionMaxIterations.value);
    simulationManager.runBisectionStep(a, b, tolerance, maxIterations);
  });

  runNewtonBtn.addEventListener("click", () => {
    const x0 = parseFloat(newtonX0.value);
    const tolerance = parseFloat(newtonTolerance.value);
    const maxIterations = parseInt(newtonMaxIterations.value);
    simulationManager.runNewtonFull(x0, tolerance, maxIterations);
  });

  stepNewtonBtn.addEventListener("click", () => {
    const x0 = parseFloat(newtonX0.value);
    const tolerance = parseFloat(newtonTolerance.value);
    const maxIterations = parseInt(newtonMaxIterations.value);
    simulationManager.runNewtonStep(x0, tolerance, maxIterations);
  });

  resetGraphBtn.addEventListener("click", () => {
    simulationManager.resetSimulationState();
    simulationManager.drawGraph();
  });

  window.addEventListener("resize", () => {
    const parentWidth = equationCanvas.parentElement.clientWidth;
    // グラフの最大幅を800pxに設定し、親要素の幅からパディングを引いた値との小さい方を選択
    const desiredWidth = Math.min(800, parentWidth - 30);
    equationCanvas.width = desiredWidth;
    equationCanvas.height = desiredWidth * (2 / 3); // グラフのアスペクト比を維持
    simulationManager.drawGraph();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  simulationManager.initialize();
  window.dispatchEvent(new Event("resize"));
});
