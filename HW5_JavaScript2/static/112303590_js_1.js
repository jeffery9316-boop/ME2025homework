let answer = Math.floor(Math.random() * 101);   //隨機產生0~100的數字
let attempts = 0;   //猜的次數

let startTime = null;  // 開始時間
let timerId = null;    // setInterval 的 id
let timerRunning = false;   //計時器是否在跑

const inputEl = document.getElementById("input_1");   //輸入框
const hintEl = document.getElementById("hint");   //提示文字區域
const timerEl = document.getElementById("timer");   //計時顯示區域
const recordsEl = document.getElementById("records");   //答題記錄清單

// 把毫秒轉成秒（小數點兩位）
function formatSec(ms) {    
  return (ms / 1000).toFixed(2);
}

// 定義一個函式，用來把「經過時間」更新到畫面上
function updateTimer() {    
  if (!timerRunning || startTime === null) return;  // 若計時器沒在跑( !timerRunning )，或尚未設定開始時間(startTime === null)，就直接結束函式
  const ms = Date.now() - startTime;    // 以毫秒計算經過的時間：現在時間(毫秒)-開始時間(毫秒)
  timerEl.textContent = formatSec(ms);  // 把毫秒轉為「秒數(含小數兩位)」的文字，寫回到畫面上的 #timer 元素
}

// 定義一個函式，只有在「第一次猜」時才啟動計時器
function startTimerIfFirstGuess() { 
  if (!timerRunning && attempts === 1) {    // 條件：目前沒有在計時且猜測次數正好是 1
    startTime = Date.now(); // 記下現在的時間(毫秒)當作起點，後面用「現在 - 起點」算經過時間
    timerId = setInterval(updateTimer, 100);    // 開一個每 100ms 執行一次 updateTimer() 的計時器，並保留它的 id
    timerRunning = true;    // 標記「計時器正在運作」，避免重複啟動多個計時器
    updateTimer();  // 立即更新一次畫面(不用等 100ms)，讓時間立刻從 0.00 跳到當下值
  }
}

// 定義函式：停止目前的計時，並把畫面時間歸零
function stopAndResetTimer() {  
  if (timerId) clearInterval(timerId);  // 如果有開著的 setInterval，用它的 id 把計時器關掉
  timerId = null;   // 將 interval 的識別碼清空，表示現在沒有計時器在跑
  timerRunning = false; // 狀態改為「未運行」，避免之後誤判正在計時
  startTime = null; // 清除開始時間；下次重新開始會再以 Date.now() 設定
  timerEl.textContent = "0.00"; // 將畫面上的時間顯示重設為 0.00 秒
}

// 定義函式 checkGuess()，在按下「猜」按鈕時執行
function checkGuess(event) {    
    event.preventDefault();     // 阻止 <form> 的預設行為（避免頁面重新整理）
    
    const guess = Number(inputEl.value);    // 從輸入框取得字串並轉成數字
    if (Number.isNaN(guess)) return;    // 防呆：如果不是數字就直接結束（HTML 已有 required，這是雙重保險）

    attempts++; // 每按一次「猜」，次數就加 1
    startTimerIfFirstGuess();   // 若是本輪第一次猜，啟動計時器（開始計時）

    // 如果猜的數字等於答案
    if (guess === answer) { 
        const usedMs  = startTime ? (Date.now() - startTime) : 0;   // 計算耗時（毫秒）：現在時間-開始時間；若還沒開始則0
        const usedStr = formatSec(usedMs);  // 轉成「秒」的字串（小數兩位），例如 "7.32"
        alert(`恭喜答對！你好棒!共猜了 ${attempts} 次，耗時 ${usedStr} 秒`);   // 跳出 alert 告知「猜測次數＋耗時」
        
        stopAndResetTimer();    // 停止下方計時並把顯示歸零（下輪會從 0 開始）

        const li = document.createElement("li");    // 建立一個 <li> 作為一筆紀錄
        li.textContent = `猜了 ${attempts} 次，耗時 ${usedStr} 秒，時間：${new Date().toLocaleTimeString()}`; // 寫入「次數、耗時、當下時間(toLocaleTimeString)」
        recordsEl.appendChild(li);  // 把 <li> 加到紀錄清單（appendChild）

        answer = Math.floor(Math.random() * 101);   // 自動換新題（0~100 的隨機數）
        attempts = 0;   // 本輪猜測次數歸零，準備下一輪
        hintEl.textContent = "新的一題開始！";  // 畫面提示：已重新出題
        inputEl.value = ""; // 清空輸入框
        inputEl.focus();    // 聚焦到輸入框，方便使用者繼續作答
        return;
    }
    hintEl.textContent = (guess > answer) ? "太大了，請再試一次。" : "太小了，請再試一次。";    // 需求②：沒猜中時把提示顯示在畫面（不再用 alert）
    inputEl.select();   // 選取輸入框內容，方便直接覆寫
    inputEl.focus();    // 確保游標還在輸入框裡，提升連續作答的體驗

}

