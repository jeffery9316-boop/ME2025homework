// === 1. 外層容器 ===
document.write("<div style='max-width:500px;margin:20px auto;font-family:Arial;'>");

// 標題
document.write("<h1>是不會用自己的計算機喔</h1>");

// 螢幕輸入框
document.write("<input type='text' id='screen' style='width:100%;font-size:20px;margin-bottom:10px;'><br>");

// appendToScreen(txt)：把按下的按鈕文字加到輸入框後面
function appendToScreen(txt){
    document.getElementById("screen").value += txt;
}

// clearScreen()：清空輸入框內容
function clearScreen(){
    document.getElementById("screen").value = "";
}

// evaluateScreen()：計算輸入框裡的算式
function evaluateScreen(){
    let expr = document.getElementById("screen").value; // 讀取輸入框的字串
    try{
        let ans = eval(expr);   // 用 eval() 計算算式
        alert(expr + " = " + ans);  // 顯示算式與答案
        document.getElementById("screen").value = ans;  // 把輸入框換成答案
    }catch(e){
        alert("算式錯誤!"); // 如果算式格式錯誤，顯示提示訊息
    }
}

// 建立一個陣列 [0,1,2,3,4,5,6,7,8,9]
let nums = [0,1,2,3,4,5,6,7,8,9];

// 用 for 迴圈把 0–9 的按鈕依序寫出來
for (let i=0; i<nums.length; i++){
    if (i % 5 === 0) document.write("<br>");    // 每 3 個數字換行（i=0,3,6 時會先寫一個 <br>）
    
    //建立數字按鈕
    document.write(
    "<button onclick='appendToScreen(" + nums[i] + ")' style='width:60px;height:40px;margin:2px;'>" 
    + nums[i] + "</button>"
  );
}

// onclick 呼叫 clearScreen()，清空輸入框
document.write(`
    <button onclick='clearScreen()' style='width:120px;height:40px;margin:2px;'>
    Clear
    </button>
    <br>
    `);

// 建立一個運算子陣列，加、減、乘、除、左括號、右括號
let ops = ["+","-","*","/","(",")"];

// 用 for 迴圈把運算子按鈕依序寫出來
for (let i=0; i<ops.length; i++){
  // 每個按鈕的 onclick：呼叫 appendToScreen("符號")
  // 注意：字串要加跳脫字元 \" 才能正確顯示
  document.write(
    "<button onclick='appendToScreen(\"" + ops[i] + "\")' style='width:60px;height:40px;margin:2px;'>"
    + ops[i] + "</button>"
  );
}

// 等號按鈕
document.write(`
    <button onclick='evaluateScreen()' style='width:60px;height:40px;margin:2px;'>
    =
    </button>
    `);


// === 5. 收尾關閉容器 ===
document.write("</div>");
