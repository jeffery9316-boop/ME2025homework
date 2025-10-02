let answer = Math.floor(Math.random() * 101);   //隨機產生0~100的數字
let attempts = 0;   //猜的次數

let startTime = null;  // 開始時間
let timerId = null;    // setInterval 的 id
let timerRunning = false;   //計時器是否在跑

const inputEl = document.getElementById("input_1");   //輸入框
const hintEl = document.getElementById("hint");   //提示文字區域
const timerEl = document.getElementById("timer");   //計時顯示區域
const recordsEl = document.getElementById("records");   //答題記錄清單

function formatSec(ms) {    // 把毫秒轉成秒（小數點兩位）
  return (ms / 1000).toFixed(2);
}

function updateTimer() {    // 定義一個函式，用來把「經過時間」更新到畫面上
  if (!timerRunning || startTime === null) return;  // 若計時器沒在跑( !timerRunning )，或尚未設定開始時間(startTime === null)，就直接結束函式
  const ms = Date.now() - startTime;    // 以毫秒計算經過的時間：現在時間(毫秒)-開始時間(毫秒)
  timerEl.textContent = formatSec(ms);  // 把毫秒轉為「秒數(含小數兩位)」的文字，寫回到畫面上的 #timer 元素
}

function startTimerIfFirstGuess() { // 定義一個函式，只有在「第一次猜」時才啟動計時器
  if (!timerRunning && attempts === 1) {    // 條件：目前沒有在計時且猜測次數正好是 1
    startTime = Date.now(); // 記下現在的時間(毫秒)當作起點，後面用「現在 - 起點」算經過時間
    timerId = setInterval(updateTimer, 100);    // 開一個每 100ms 執行一次 updateTimer() 的計時器，並保留它的 id
    timerRunning = true;    // 標記「計時器正在運作」，避免重複啟動多個計時器
    updateTimer();  // 立即更新一次畫面(不用等 100ms)，讓時間立刻從 0.00 跳到當下值
  }
}

function stopAndResetTimer() {  // 定義函式：停止目前的計時，並把畫面時間歸零
  if (timerId) clearInterval(timerId);  // 如果有開著的 setInterval，用它的 id 把計時器關掉
  timerId = null;   // 將 interval 的識別碼清空，表示現在沒有計時器在跑
  timerRunning = false; // 狀態改為「未運行」，避免之後誤判正在計時
  startTime = null; // 清除開始時間；下次重新開始會再以 Date.now() 設定
  timerEl.textContent = "0.00"; // 將畫面上的時間顯示重設為 0.00 秒
}

function checkGuess(event) {    // 定義函式 checkGuess()，在按下「猜」按鈕時執行
    event.preventDefault();     // 阻止 <form> 的預設行為（避免頁面重新整理）
    
    const guess = Number(inputEl.value);    // 從輸入框取得字串並轉成數字
    if (Number.isNaN(guess)) return;    // 防呆：如果不是數字就直接結束（HTML 已有 required，這是雙重保險）

    attempts++; // 每按一次「猜」，次數就加 1

    if (guess === answer) { // 如果猜的數字等於答案
        alert("恭喜答對！你總共猜了 " + attempts + " 次。");    // 跳出提示，顯示總共猜了幾次
        answer = Math.floor(Math.random() * 101);   // 遊戲重置，重新產生新答案
        attempts = 0;   // 把次數歸零，準備下一輪
    } else if (guess > answer){ // 如果猜的數字比答案大
        alert("太大了，再試一次!")
    } else {    // 如果猜的數字比答案小
        alert("太小了，再試一次!")
    }
}

