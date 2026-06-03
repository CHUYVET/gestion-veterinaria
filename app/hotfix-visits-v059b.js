(()=>{
  if(window.__visitsCompactV059b)return;
  window.__visitsCompactV059b=1;
  const q=id=>document.getElementById(id);
  function detailHtml(){
    return `<div class="tab-title"><h3>Detalle de la visita / servicios</h3><p>Agrega servicios para recibo, certificado o nota.</p></div><p id="receiptVisitLabel">Selecciona o guarda un caso para capturar servicios.</p><form id="receiptForm" class="compact-form"><div class="field span-2"><label for="receiptDescription">Concepto</label><input id="receiptDescription" type="text" list="serviceItemsList" placeholder="Consulta, vacuna rabia, desparasitacion..."></div><div class="field"><label for="receiptQuantity">Cantidad</label><input id="receiptQuantity" type="number" min="0.01" step="0.01" value="1"></div><div class="field"><label for="receiptUnitPrice">Precio unitario</label><input id="receiptUnitPrice" type="number" min="0" step="0.01" value="0"></div><div class="field"><label>Total</label><output id="receiptTotal">$0.00</output></div><div class="actions"><button class="save-button" id="saveReceiptButton" type="submit">Guardar servicio</button></div></form><div class="timeline" id="receiptList"></div>`;
  }
  function wireReceipt(){
    q('receiptForm')?.addEventListener('submit',ev=>typeof saveReceipt==='function'&&saveReceipt(ev));
    q('receiptDescription')?.addEventListener('change',()=>typeof fillReceiptPriceFromCatalog==='function'&&fillReceiptPriceFromCatalog());
    q('receiptQuantity')?.addEventListener('input',()=>typeof updateReceiptTotal==='function'&&updateReceiptTotal());
    q('receiptUnitPrice')?.addEventListener('input',()=>typeof updateReceiptTotal==='function'&&updateReceiptTotal());
  }
  function repair(){
    const panel=q('caseTab-detail');
    if(!panel)return;
    if(!q('receiptForm')||!q('receiptList')){
      panel.innerHTML=detailHtml();
      wireReceipt();
    }
    if(typeof renderReceiptArea==='function')renderReceiptArea();
  }
  function patch(){
    if(typeof renderVisits==='function'&&!renderVisits.__receiptRepairV059b){
      const previous=renderVisits;
      renderVisits=function(){const out=previous.apply(this,arguments);setTimeout(repair,0);return out;};
      renderVisits.__receiptRepairV059b=1;
    }
  }
  function boot(){patch();repair();}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,900)):setTimeout(boot,900);
  [1400,2400,4600,7600,11000].forEach(t=>setTimeout(boot,t));
})();
