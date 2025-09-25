let answer = Math.floor(Math.random() * 101);   //隨機產生0~100的數字
let attempts = 0;   //猜的次數

function checkGuess(event) {    // 定義函式 checkGuess()，在按下「猜」按鈕時執行
    event.preventDefault();     // 阻止 <form> 的預設行為（避免頁面重新整理）
    
    let guess = document.getElementById("input_1").value;   // 取得輸入框 (id="input_1") 輸入的值
    guess = Number(guess);  // 把輸入的內容轉換成數字 (避免字串比較錯誤)

    attempts++; // 每按一次「猜」，次數就加 1

    if (guess === answer) { // 如果猜的數字等於答案
        alert("恭喜答對！你總共猜了 " + attempts + " 次。");    // 跳出提示，顯示總共猜了幾次
    }
}