const $ = s => document.querySelector(s);

// 讀取列表（顯示清楚錯誤碼）
async function fetchGrades(){
  const res = await fetch("/api/grades");
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch(e) {}

  if(!res.ok){
    alert((data && (data.msg || data.error)) ?
          `${data.msg || data.error}（HTTP ${res.status}）` :
          `讀取失敗（HTTP ${res.status}）`);
    console.error("GET /api/grades failed:", res.status, text);
    return;
  }

  const tbody = $("#gradesTable tbody");
  tbody.innerHTML = "";
  for(const r of data){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.student_name}</td>
      <td>${r.student_id}</td>
      <td>${Number(r.score).toFixed(2)}</td>
      <td>${r.created_by || ""}</td>
    `;
    tbody.appendChild(tr);
  }
}

async function addOrUpdate(){
  const student_name = $("#ajax_name").value.trim();
  const student_id   = $("#ajax_id").value.trim();   // 前端也先 TRIM
  const score        = $("#ajax_score").value;
  if(!student_name || !student_id || score === ""){ alert("請完整填寫：姓名、學號、成績"); return; }

  const res = await fetch("/api/grades", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ student_name, student_id, score })
  });
  const out = await res.json();
  if(!res.ok || !out.ok){ alert(out.msg || "新增/更新失敗"); return; }
  $("#ajax_name").value = $("#ajax_id").value = $("#ajax_score").value = "";
  fetchGrades();
}

async function removeById(){
  const student_id = $("#ajax_del_id").value.trim();
  if(!student_id){ alert("請輸入學號"); return; }
  const res = await fetch("/api/grades", {
    method: "DELETE",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ student_id })
  });
  const out = await res.json();
  if(!res.ok || !out.ok){ alert(out.msg || "刪除失敗"); return; }
  $("#ajax_del_id").value = "";
  fetchGrades();
}

document.addEventListener("DOMContentLoaded", ()=>{
  $("#addBtn")?.addEventListener("click", addOrUpdate);
  $("#delBtn")?.addEventListener("click", removeById);
  $("#refreshBtn")?.addEventListener("click", fetchGrades);
  fetchGrades();
});
