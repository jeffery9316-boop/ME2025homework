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

function checkGuess(event) {    // 定義函式 checkGuess()，在按下「猜」按鈕時執行
    event.preventDefault();     // 阻止 <form> 的預設行為（避免頁面重新整理）
    
    let guess = document.getElementById("input_1").value;   // 取得輸入框 (id="input_1") 輸入的值
    guess = Number(guess);  // 把輸入的內容轉換成數字 (避免字串比較錯誤)

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