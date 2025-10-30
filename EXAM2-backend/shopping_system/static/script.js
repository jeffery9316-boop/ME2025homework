// === 產品資料（保留你的資料；會在渲染時自動規整 image_url 路徑） ===
const products = [
  { name:'T-Shirt',       price:25, gender:'男裝', category:'上衣',   image_url:'.../static/img/T-Shirt.png' },
  { name:'Blouse',        price:30, gender:'女裝', category:'上衣',   image_url:'.../static/img/Blouse.png' },
  { name:'Jeans',         price:50, gender:'通用', category:'褲/裙子', image_url:'.../static/img/Jeans.png' },
  { name:'Skirt',         price:40, gender:'女裝', category:'褲/裙子', image_url:'.../static/img/Skirt.png' },
  { name:'Sneakers',      price:60, gender:'通用', category:'鞋子',   image_url:'.../static/img/Sneakers.png' },
  { name:'Leather Shoes', price:80, gender:'男裝', category:'鞋子',   image_url:'.../static//img/LeatherShoes.png' },
  { name:'Baseball Cap',  price:20, gender:'通用', category:'帽子',   image_url:'.../static/img/BaseballCap.png' },
  { name:'Sun Hat',       price:25, gender:'女裝', category:'帽子',   image_url:'.../static/img/SunHat.png' },
  { name:'Running Shoes', price:85, gender:'通用', category:'鞋子',   image_url:'.../static/img/RunningShoes.png' },
  { name:'Dress',         price:75, gender:'女裝', category:'上衣',   image_url:'.../static/img/Dress.png' }
];

/* 工具 */
const rowState = new Map();
const money = (n) => Number(n).toLocaleString();
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const normalizeImg = (url='') => url.replace(/\/{2,}/g,'/').replace('.../static','../static').replace('../static','../static');

/* JS-1：左上顯示目前登入者 */
(async function showUser(){
  const el = $('#current-user'); if(!el) return;
  try{
    const r = await fetch('/api/session-user');
    if(r.ok){ const {username} = await r.json(); if(username){ el.textContent=username; localStorage.setItem('username',username); return; } }
  }catch(_){}
  el.textContent = localStorage.getItem('username') || '';
})();

/* 生成固定下單區 */
(function ensureOrderBar(){
  if($('#place-order')) return;
  const box=document.createElement('div');
  Object.assign(box.style,{position:'fixed',left:'12px',bottom:'12px',background:'#fff',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'10px 12px',boxShadow:'0 6px 18px rgba(0,0,0,.06)',zIndex:20});
  const btn=document.createElement('button');
  btn.id='place-order'; btn.textContent='下單'; btn.disabled=true;
  Object.assign(btn.style,{background:'#2563eb',color:'#fff',border:'none',padding:'8px 14px',borderRadius:'6px',cursor:'not-allowed',opacity:.5});
  const sum=document.createElement('span'); sum.id='cart-summary'; sum.style.marginLeft='10px';
  box.append(btn,sum); document.body.appendChild(box);
})();

/* 渲染商品表格 */
function display_products(list){
  const tbody = $('#products tbody'); if(!tbody) return;
  tbody.innerHTML='';
  list.forEach((p,i)=>{
    const key=`${p.name}-${i}`;
    if(!rowState.has(key)) rowState.set(key,{checked:false,qty:0});
    const st=rowState.get(key);
    const tr=document.createElement('tr'); tr.dataset.key=key;
    tr.innerHTML = `
      <td><input type="checkbox" class="row-check" ${st.checked?'checked':''}></td>
      <td><img src="${normalizeImg(p.image_url)}" style="width:56px;height:56px;object-fit:cover;border:1px solid #e5e7eb;border-radius:6px;"></td>
      <td>${p.name}</td>
      <td data-price="${p.price}">${p.price}</td>
      <td>${p.gender}</td>
      <td>${p.category}</td>
      <td>
        <button class="btn-dec">-</button>
        <input type="number" class="qty-input" min="0" value="${st.qty}" style="width:64px">
        <button class="btn-inc">+</button>
      </td>
      <td class="row-total">${money(p.price * st.qty)}</td>
    `;
    tbody.appendChild(tr);
    applyEnableRules(tr, st); // JS-2：未勾選時 0 且 ± 反白
  });
  refreshSummary();
}

/* 篩選 */
function apply_filter(arr){
  const maxPrice=Number($('#max_price')?.value||'');
  const minPrice=Number($('#min_price')?.value||'');
  const gender=$('#gender')?.value||'All';
  const cats=[]; if($('#shirts')?.checked)cats.push('上衣'); if($('#pants')?.checked)cats.push('褲/裙子'); if($('#shoes')?.checked)cats.push('鞋子'); if($('#cap')?.checked)cats.push('帽子');

  const result=[];
  for(const it of arr){
    const byMin=isNaN(minPrice)||it.price>=minPrice;
    const byMax=isNaN(maxPrice)||it.price<=maxPrice;
    let byGender=true;
    if(gender==='Male') byGender=(it.gender==='男裝'||it.gender==='通用');
    if(gender==='Female') byGender=(it.gender==='女裝'||it.gender==='通用');
    const byCat=(cats.length===0)||cats.includes(it.category);
    if(byMin&&byMax&&byGender&&byCat) result.push(it);
  }
  rowState.clear();
  display_products(result);
}

/* JS-2/3/4：啟用規則 */
function applyEnableRules(tr, st){
  const dec=$('.btn-dec',tr), inc=$('.btn-inc',tr), inp=$('.qty-input',tr);
  if(!st.checked){ inp.value=0; inp.disabled=true; dec.disabled=true; inc.disabled=true; }
  else{ inp.disabled=false; inc.disabled=false; dec.disabled=(Number(inp.value)<=1); }
}

/* 表格事件 */
(function bindTableEvents(){
  const tbody=$('#products tbody'); if(!tbody) return;
  tbody.addEventListener('click',(e)=>{
    const tr=e.target.closest('tr'); if(!tr) return;
    const key=tr.dataset.key; const st=rowState.get(key)||{checked:false,qty:0};

    if(e.target.classList.contains('row-check')){
      st.checked=e.target.checked; st.qty=st.checked?1:0; $('.qty-input',tr).value=st.qty;
      rowState.set(key,st); updateRowTotal(tr); applyEnableRules(tr,st); refreshSummary(); return;
    }
    if(e.target.classList.contains('btn-dec')){
      if(!st.checked) return; const inp=$('.qty-input',tr); const v=Math.max(1,Number(inp.value||1)-1);
      inp.value=v; st.qty=v; rowState.set(key,st); updateRowTotal(tr); applyEnableRules(tr,st); refreshSummary(); return;
    }
    if(e.target.classList.contains('btn-inc')){
      if(!st.checked) return; const inp=$('.qty-input',tr); const v=Math.max(1,Number(inp.value||0)+1);
      inp.value=v; st.qty=v; rowState.set(key,st); updateRowTotal(tr); applyEnableRules(tr,st); refreshSummary(); return;
    }
  });
  tbody.addEventListener('input',(e)=>{
    if(!e.target.classList.contains('qty-input')) return;
    const tr=e.target.closest('tr'); const key=tr.dataset.key; const st=rowState.get(key)||{checked:false,qty:0};
    if(!st.checked){ e.target.value=0; applyEnableRules(tr,st); refreshSummary(); return; }
    let v=Math.max(1,Math.floor(Number(e.target.value||1))); e.target.value=v; st.qty=v; rowState.set(key,st);
    updateRowTotal(tr); applyEnableRules(tr,st); refreshSummary();
  });
})();

function updateRowTotal(tr){
  const price=Number($('[data-price]',tr).dataset.price);
  const qty=Number($('.qty-input',tr).value||0);
  $('.row-total',tr).textContent=money(price*qty);
}

/* JS-4/5：合計與下單鈕反白 */
function refreshSummary(){
  let selected=0,totalQty=0,totalPrice=0;
  $$('#products tbody tr').forEach(tr=>{
    const chk=$('.row-check',tr)?.checked; const qty=Number($('.qty-input',tr)?.value||0); const price=Number($('[data-price]',tr)?.dataset?.price||0);
    if(chk&&qty>0){ selected++; totalQty+=qty; totalPrice+=price*qty; }
  });
  const btn=$('#place-order'); const can=(selected>0&&totalQty>0);
  if(btn){ btn.disabled=!can; btn.style.opacity=can?1:.5; btn.style.cursor=can?'pointer':'not-allowed'; }
  const sum=$('#cart-summary'); if(sum) sum.textContent=`已選 ${selected} 項、總數量 ${totalQty}、總金額 $${money(totalPrice)}`;
}

/* 下單（寫 DB + 題目格式 alert；後端失敗仍會 alert，以利驗收） */
(function bindOrder(){
  const btn=$('#place-order'); if(!btn) return;
  btn.addEventListener('click', async ()=>{
    if(btn.disabled) return;
    const items=[];
    $$('#products tbody tr').forEach(tr=>{
      const chk=$('.row-check',tr)?.checked; const qty=Number($('.qty-input',tr)?.value||0);
      if(!chk||qty<=0) return;
      const name=tr.children[2].textContent.trim(); const price=Number($('[data-price]',tr)?.dataset?.price||0);
      items.push({name,price,qty,total:price*qty});
    });
    if(!items.length) return;

    let dateStr,timeStr;
    try{
      const r=await fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});
      const data=await r.json(); if(!r.ok||data.status!=='success') throw new Error(data.message||`HTTP ${r.status}`);
      dateStr=data.date; timeStr=data.time;
    }catch(err){
      const now=new Date(),pad=n=>String(n).padStart(2,'0');
      dateStr=`${now.getFullYear()}/${pad(now.getMonth()+1)}/${pad(now.getDate())}`;
      timeStr=`${pad(now.getHours())}:${pad(now.getMinutes())}`;
      console.warn('[order] 後端失敗，使用本地時間顯示：',err);
    }

    const head=`${dateStr} ${timeStr}，已成功下單：`; let totalAll=0; const lines=[head,''];
    for(const it of items){ totalAll+=it.total; lines.push(`    ${it.name}： ${it.price} NT/件 x${it.qty}  共 ${it.total} NT`); }
    lines.push('',`此單花費總金額：${money(totalAll)} NT`); alert(lines.join('\n'));
  });
})();

/* 首次渲染 */
display_products(products);
