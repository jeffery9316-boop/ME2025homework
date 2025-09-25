// === 1. 外層容器 ===
document.write("<div style='max-width:300px;margin:20px auto;font-family:Arial;'>");

// 標題
document.write("<h1>牛逼計算機</h1>");

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