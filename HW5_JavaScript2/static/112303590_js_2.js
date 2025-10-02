document.addEventListener("DOMContentLoaded", () => {

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const moneyToNumber = (s) => parseInt(String(s).replace(/\$|,/g, ""), 10) || 0;
  const numberToMoney = (n) => `$${(n || 0).toLocaleString()}`;

  // 你的表頭順序：勾選 / 名稱 / 圖片 / 庫存 / 單價 / 數量 / 小計
  const getStockEl = (row) => row.querySelector("td:nth-child(4) h4, td:nth-child(4)");
  const getStock = (row) => parseInt(getStockEl(row)?.innerText || "0", 10) || 0;
  const setStock = (row, v) => { const el = getStockEl(row); if (el) el.innerText = v; };

  // 將 qty 限制在 [1, stock]（一般情況）；若 allowZero=true 則允許 0（結帳後）
  function clampQtyByStock(qty, stock, allowZero = false) {
    let v = parseInt(qty, 10);
    if (Number.isNaN(v)) v = 1;            // 非數字 → 1
    if (!allowZero && v < 1) v = 1;        // <1 → 1
    if (allowZero && v < 0) v = 0;         // 允許 0 的場合
    if (v > stock) v = stock;              // 超過庫存 → 庫存
    return v;
  }

  // 總價(僅計算已勾選)
  function updateTotal() {
    let total = 0;
    $$("#cart tbody tr, tbody tr").forEach(row => {
      const cb = $('input[type="checkbox"]', row);
      if (!cb?.checked) return;
      const subEl = $(".subtotal", row);
      if (subEl) total += moneyToNumber(subEl.textContent);
    });
    const totalEl = $("#total");
    if (totalEl) totalEl.innerHTML = `<h4>${numberToMoney(total)}</h4>`;
    return total;
  }

  // 全選功能
  const masterCheck = $("#check-all");
  const getItemCheckboxes = () => $$('#cart tbody input[type="checkbox"], tbody input[type="checkbox"]');

  function syncMasterFromItems() {
    if (!masterCheck) return;
    const items = getItemCheckboxes();
    const total = items.length;
    const checked = items.filter(cb => cb.checked).length;
    masterCheck.checked = (checked === total && total > 0);
    masterCheck.indeterminate = (checked > 0 && checked < total);
  }

  if (masterCheck) {
    masterCheck.addEventListener("change", () => {
      getItemCheckboxes().forEach(cb => cb.checked = masterCheck.checked);
      updateTotal();
      syncMasterFromItems();
    });
  }

  // ===================== 綁定每一列（數量 / 小計 / blur驗證） =====================
  $$(".quantity").forEach(qtyBox => {
    const row = qtyBox.closest("tr");
    const minusBtn = $(".btn-minus", qtyBox);
    const plusBtn  = $(".btn-plus",  qtyBox);
    const input    = $(".qty-input",  qtyBox);
    const price    = parseInt($(".price", row)?.dataset.price || "0", 10);
    const subCell  = $(".subtotal", row);

    function updateSubtotal() {
      const qty = parseInt(input.value, 10) || 0;     // 允許 0（結帳後可被設 0）
      const sub = price * qty;
      if (subCell) subCell.innerHTML = `<h4>${numberToMoney(sub)}</h4>`;
      updateTotal();
    }

    // 減號：不少於 1，不超過庫存
    minusBtn.addEventListener("click", () => {
      const stock = getStock(row);
      let val = parseInt(input.value, 10) || 1;
      val = clampQtyByStock(val - 1, stock, false);
      input.value = val;
      updateSubtotal();
    });

    // 加號：不超過庫存
    plusBtn.addEventListener("click", () => {
      const stock = getStock(row);
      let val = parseInt(input.value, 10) || 0;
      val = clampQtyByStock(val + 1, stock, false);
      input.value = val;
      updateSubtotal();
    });

    // 直接輸入：blur 規則（>庫存→庫存；非數字或<1→1；並重算）
    input.addEventListener("blur", () => {
      const stock = getStock(row);
      input.value = clampQtyByStock(input.value, stock, false);
      updateSubtotal();
    });

    // 每列的 checkbox 變動：更新總價與 master 狀態
    const rowCb = $('input[type="checkbox"]', row);
    if (rowCb) {
      rowCb.addEventListener("change", () => {
        updateTotal();
        syncMasterFromItems();
      });
    }

    // 初始化：把初值矯正一次再算小計
    input.value = clampQtyByStock(input.value, getStock(row), false);
    updateSubtotal();
  });

  // ===================== 結帳 =====================
  const checkoutBtn = $("#btn-checkout");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const total = updateTotal();
      if (total <= 0) return; // 沒選東西就不動作

      // 蒐集明細（僅勾選列）
      const details = [];
      $$("#cart tbody tr, tbody tr").forEach(row => {
        const cb = $('input[type="checkbox"]', row);
        if (!cb?.checked) return;

        const name = (row.querySelector("td:nth-child(2)")?.innerText || "").trim();
        const price = parseInt($(".price", row)?.dataset.price || "0", 10);
        const qty = parseInt($(".qty-input", row)?.value || "0", 10);
        if (qty > 0) details.push(`${name} x ${qty} = ${numberToMoney(price * qty)}`);
      });

      alert(`結帳明細：\n\n${details.join("\n")}\n\n總計：${numberToMoney(total)}`);

      // 結帳後：取消勾選、扣庫存、數量回 1 或 0、更新小計
      $$("#cart tbody tr, tbody tr").forEach(row => {
        const cb = $('input[type="checkbox"]', row);
        if (!cb?.checked) return;

        const qtyInput = $(".qty-input", row);
        const buyQty   = parseInt(qtyInput?.value || "0", 10);
        const stock    = getStock(row);
        const newStock = Math.max(0, stock - buyQty);

        setStock(row, newStock);                    // 扣庫存
        if (qtyInput) qtyInput.value = newStock > 0 ? 1 : 0;  // 有庫存→1；無庫存→0
        cb.checked = false;                         // 取消勾選

        // 更新小計
        const price = parseInt($(".price", row)?.dataset.price || "0", 10);
        const newQty = parseInt(qtyInput?.value || "0", 10);
        const sub = price * newQty;
        const subCell = $(".subtotal", row);
        if (subCell) subCell.innerHTML = `<h4>${numberToMoney(sub)}</h4>`;
      });

      // 結尾：更新總價與全選狀態
      updateTotal();
      syncMasterFromItems();
    });
  }

  // ===================== 初始化 =====================
  updateTotal();
  syncMasterFromItems();
});
