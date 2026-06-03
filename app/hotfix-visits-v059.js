(()=>{
  if(window.__visitsCompactV059)return;
  window.__visitsCompactV059=1;
  const V='v0.5.9';
  const TYPES=['Consulta','Vacunacion','Desparasitacion','Control','Emergencia','Cirugia','Certificado'];
  const FIELDS=[
    ['temperature','Temperatura','Ej. 39.8 C'],
    ['hydration','Hidratacion','Ej. Deshidratada 6%'],
    ['skin','Piel','Ej. lesion, icterica, reseca'],
    ['bodyCondition','Estado fisico','Ej. flaco, obeso, caquectico'],
    ['respiratory','F. respiratoria','Ej. aumentada, disnea'],
    ['pulse','Pulso','Ej. debil, fuerte, irregular'],
    ['frequency','Frecuencia','Ej. normal, aumentada'],
    ['quality','Calidad','Ej. mala, regular'],
    ['activity','Actividad fisica','Ej. disminuida'],
    ['behavior','Comportamiento','Ej. deprimido, agresivo'],
    ['sickTime','Tiempo enfermo','Ej. 3 dias'],
    ['premedication','PreMedicacion','Tratamiento previo'],
    ['other','Otros','Otro hallazgo importante']
  ];
  const q=id=>document.getElementById(id);
  const esc=v=>typeof escapeHtml==='function'?escapeHtml(v):String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const dt=v=>typeof formatDateTime==='function'?formatDateTime(v):String(v||'');
  const localDate=v=>typeof toLocalDateTimeInput==='function'?toLocalDateTimeInput(v):new Date(v).toISOString().slice(0,16);
  function setVersion(){const b=q('appVersion');if(b)b.textContent=V;}
  function baseData(){return{schema:'case-v1',visitType:'Consulta',explorationNormal:true,findings:[],followups:[],prescriptions:[]};}
  function caseData(v){
    const d=baseData();
    if(!v||!v.observations)return d;
    try{
      const p=JSON.parse(v.observations);
      if(p&&p.schema==='case-v1')return {...d,...p,findings:Array.isArray(p.findings)?p.findings:[],followups:Array.isArray(p.followups)?p.followups:[],prescriptions:Array.isArray(p.prescriptions)?p.prescriptions:[]};
    }catch(_){
      if(v.observations)d.followups=[{id:'legacy-'+(v.id||Date.now()),date:v.visitDate||new Date().toISOString(),notes:v.observations}];
    }
    return d;
  }
  function selectedVisit(){return state.visits.find(v=>v.id===state.selectedVisitId)||null;}
  function petVisits(){return state.visits.filter(v=>v.petId===state.selectedPetId).sort((a,b)=>new Date(b.visitDate||0)-new Date(a.visitDate||0));}
  function setMessage(text,type='info'){
    const el=q('visitSaveMessage');
    if(el){el.textContent=text||'';el.className=`form-message ${type}`;}
  }
  function findingsSummary(d){
    return d.findings.length?d.findings.map(x=>`${x.label}: ${x.value}`).join('; '):(d.explorationNormal?'Exploracion general normal':'');
  }
  function getFindings(){
    return FIELDS.map(([key,label])=>{
      const value=(q('finding-'+key)?.value||'').trim();
      return value?{key,label,value}:null;
    }).filter(Boolean);
  }
  function fillFindings(findings){
    FIELDS.forEach(([key])=>{
      const el=q('finding-'+key);
      const item=(findings||[]).find(x=>x.key===key);
      if(el)el.value=item?.value||'';
    });
  }
  function install(force=false){
    const tab=q('tab-visitas');
    if(!tab)return false;
    if(!force&&tab.dataset.visitLayout==='v059')return true;
    tab.dataset.visitLayout='v059';
    tab.innerHTML=`<div class="clinical-board"><section class="clinical-main"><form id="visitDraftForm"><input id="visitId" type="hidden"><div class="clinical-record-strip"><span id="visitModeLabel">Caso clinico</span><div class="clinical-actions"><button class="secondary-button" id="newCaseButton" type="button">Nuevo caso</button><button class="save-button" id="saveVisitDraft" type="submit">Guardar caso clinico</button></div></div><div class="clinical-top-grid"><div class="field"><label for="visitDate">FechaVisita</label><input id="visitDate" type="datetime-local"></div><div class="field"><label for="visitType">TipoVisita</label><select id="visitType">${TYPES.map(x=>`<option value="${x}">${x}</option>`).join('')}</select></div><div class="field"><label for="visitPetName">Paciente</label><input id="visitPetName" type="text" readonly></div><div class="field clinical-signs-panel"><label for="symptoms">Signos y sintomas</label><textarea id="symptoms" rows="7" placeholder="Anorexia, diarrea, dolor abdominal..."></textarea></div><div class="field clinical-complaint"><label for="ownerComplaint">Antecedentes de la visita</label><textarea id="ownerComplaint" rows="4" placeholder="Queja del propietario y antecedentes importantes"></textarea></div><div class="field"><label for="prognosis">Pronostico</label><input id="prognosis" type="text" placeholder="Ninguno, favorable, reservado..."></div><div class="field clinical-diagnosis"><label for="diagnosis">Diagnostico</label><textarea id="diagnosis" rows="2" placeholder="Pancreatitis, gastroenteritis..."></textarea></div></div><p class="form-message" id="visitSaveMessage" aria-live="polite"></p><div class="clinical-tabs" role="tablist"><button class="case-tab is-active" data-case-tab="exploration" type="button">Exploracion</button><button class="case-tab" data-case-tab="detail" type="button">Detalle de la visita</button><button class="case-tab" data-case-tab="prescriptions" type="button">Prescripciones</button><button class="case-tab" data-case-tab="history" type="button">Historia clinica</button></div><div class="clinical-tab-panels"><section class="clinical-tab-panel" id="caseTab-exploration"><div class="exploration-header"><div><h3>Exploracion</h3><p>Lo normal no se guarda campo por campo. Solo escribe los hallazgos anormales.</p></div><label class="inline-check"><input id="explorationNormal" type="checkbox" checked> Exploracion general normal</label></div><div class="finding-grid">${FIELDS.map(([k,l,p])=>`<div class="field"><label for="finding-${k}">${l}</label><input id="finding-${k}" type="text" placeholder="${p}"></div>`).join('')}</div></section><section class="clinical-tab-panel" id="caseTab-detail" hidden><div class="tab-title"><h3>Detalle de la visita / servicios</h3><p>Agrega servicios para recibo, certificado o nota.</p></div><p id="receiptVisitLabel">Selecciona o guarda un caso para capturar servicios.</p><form id="receiptForm" class="compact-form"><div class="field span-2"><label for="receiptDescription">Concepto</label><input id="receiptDescription" type="text" list="serviceItemsList" placeholder="Consulta, vacuna rabia, desparasitacion..."></div><div class="field"><label for="receiptQuantity">Cantidad</label><input id="receiptQuantity" type="number" min="0.01" step="0.01" value="1"></div><div class="field"><label for="receiptUnitPrice">Precio unitario</label><input id="receiptUnitPrice" type="number" min="0" step="0.01" value="0"></div><div class="field"><label>Total</label><output id="receiptTotal">$0.00</output></div><div class="actions"><button class="save-button" id="saveReceiptButton" type="submit">Guardar servicio</button></div></form><div class="timeline" id="receiptList"></div></section><section class="clinical-tab-panel" id="caseTab-prescriptions" hidden><div id="prescriptionPanel"></div></section><section class="clinical-tab-panel" id="caseTab-history" hidden><div id="historyPanel"></div></section></div></form></section><section class="clinical-records"><div class="clinical-footer-strip"><span>Registros de visitas del paciente</span><span id="visitCounter">0 de 0</span></div><div class="clinical-record-list" id="visitList"></div></section></div>`;
    wireBase();
    return true;
  }
  function switchTab(name){
    document.querySelectorAll('[data-case-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.caseTab===name));
    ['exploration','detail','prescriptions','history'].forEach(x=>{const p=q('caseTab-'+x);if(p)p.hidden=x!==name;});
  }
  function wireBase(){
    q('visitDraftForm')?.addEventListener('submit',saveVisitCompact);
    q('newCaseButton')?.addEventListener('click',()=>{state.selectedVisitId=null;renderVisitsCompact();setMessage('');});
    document.querySelectorAll('[data-case-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.caseTab)));
    q('receiptForm')?.addEventListener('submit',saveReceipt);
    q('receiptDescription')?.addEventListener('change',()=>typeof fillReceiptPriceFromCatalog==='function'&&fillReceiptPriceFromCatalog());
    q('receiptQuantity')?.addEventListener('input',()=>typeof updateReceiptTotal==='function'&&updateReceiptTotal());
    q('receiptUnitPrice')?.addEventListener('input',()=>typeof updateReceiptTotal==='function'&&updateReceiptTotal());
  }
  function renderForm(){
    const pet=state.pets.find(x=>x.id===state.selectedPetId);
    const v=selectedVisit();
    const d=caseData(v);
    if(q('visitModeLabel'))q('visitModeLabel').textContent=v?'Editando visita seleccionada':'Capturando visita nueva';
    if(q('visitPetName'))q('visitPetName').value=pet?pet.name:'Selecciona una mascota';
    if(q('visitId'))q('visitId').value=v?.id||'';
    if(q('visitDate'))q('visitDate').value=v?.visitDate||localDate(new Date());
    if(q('visitType'))q('visitType').value=d.visitType||'Consulta';
    if(q('ownerComplaint'))q('ownerComplaint').value=v?.ownerComplaint||'';
    if(q('symptoms'))q('symptoms').value=v?.symptoms||'';
    if(q('prognosis'))q('prognosis').value=v?.prognosis||'';
    if(q('diagnosis'))q('diagnosis').value=v?.diagnosis||'';
    if(q('explorationNormal'))q('explorationNormal').checked=d.explorationNormal!==false;
    fillFindings(d.findings);
    if(q('saveVisitDraft'))q('saveVisitDraft').textContent=v?'Actualizar caso clinico':'Guardar caso clinico';
  }
  function renderRecords(){
    const list=q('visitList');
    if(!list)return;
    const items=petVisits();
    if(!state.selectedVisitId&&items.length)state.selectedVisitId=items[0].id;
    if(state.selectedVisitId&&!items.some(v=>v.id===state.selectedVisitId))state.selectedVisitId=items[0]?.id||null;
    const idx=items.findIndex(v=>v.id===state.selectedVisitId);
    if(q('visitCounter'))q('visitCounter').textContent=items.length?`${idx+1} de ${items.length}`:'0 de 0';
    list.innerHTML=items.length?items.map((v,i)=>{const d=caseData(v);return`<button class="clinical-record-button ${v.id===state.selectedVisitId?'is-active':''}" data-visit="${esc(v.id)}" type="button"><div class="record-title"><span>${i+1}. ${esc(d.visitType||'Consulta')}</span><span>${esc(dt(v.visitDate))}</span></div><div class="record-meta"><span>${esc(v.diagnosis||v.ownerComplaint||'Sin diagnostico')}</span><span>${esc(v.prognosis||'')}</span></div></button>`}).join(''):'<div class="empty-state">Las visitas de esta mascota apareceran aqui.</div>';
    document.querySelectorAll('[data-visit]').forEach(b=>b.addEventListener('click',()=>selectVisitCompact(b.dataset.visit)));
  }
  function renderPrescriptionPanel(){
    const box=q('prescriptionPanel');
    if(!box)return;
    const v=selectedVisit();
    if(!v){box.innerHTML='<div class="empty-state">Guarda primero la visita para agregar recetas.</div>';return;}
    const d=caseData(v);
    box.innerHTML=`<div class="tab-title"><h3>Prescripciones</h3><p>Puedes agregar varias recetas dentro de la misma visita.</p></div><form id="prescriptionForm" class="compact-form"><div class="field"><label for="prescriptionDate">Fecha</label><input id="prescriptionDate" type="datetime-local" value="${localDate(new Date())}"></div><div class="field span-2"><label for="prescriptionMedication">Medicamento</label><input id="prescriptionMedication" type="text" placeholder="AMOXIL suspension 250 mg"></div><div class="field span-3"><label for="prescriptionInstructions">Indicaciones</label><textarea id="prescriptionInstructions" rows="3" placeholder="1 ml cada 12 horas VO por 5 dias"></textarea></div><div class="actions span-3"><button class="save-button" type="submit">Agregar receta</button></div></form><div class="case-list">${d.prescriptions.length?d.prescriptions.map(x=>`<article class="case-note"><div class="row-title"><span>${esc(dt(x.date))}</span><span>${esc(x.medication||'')}</span></div><div class="row-meta">${esc(x.instructions||'')}</div></article>`).join(''):'<div class="empty-state">Sin recetas capturadas.</div>'}</div>`;
    q('prescriptionForm')?.addEventListener('submit',addPrescription);
  }
  function renderHistoryPanel(){
    const box=q('historyPanel');
    if(!box)return;
    const v=selectedVisit();
    if(!v){box.innerHTML='<div class="empty-state">Guarda primero la visita para agregar seguimiento.</div>';return;}
    const d=caseData(v);
    box.innerHTML=`<div class="tab-title"><h3>Historia clinica</h3><p>Seguimientos del mismo caso en dias posteriores.</p></div><form id="followupForm" class="compact-form"><div class="field"><label for="followupDate">Fecha</label><input id="followupDate" type="datetime-local" value="${localDate(new Date())}"></div><div class="field"><label for="followupTemperature">Temperatura</label><input id="followupTemperature" type="text" placeholder="Ej. 38.7 C"></div><div class="field"><label for="followupHydration">Hidratacion</label><input id="followupHydration" type="text" placeholder="Normal, 4%, mejoro..."></div><div class="field span-3"><label for="followupNotes">Observaciones</label><textarea id="followupNotes" rows="4" placeholder="Evolucion, respuesta al tratamiento, cambios relevantes"></textarea></div><div class="actions span-3"><button class="save-button" type="submit">Agregar seguimiento</button></div></form><div class="case-list">${d.followups.length?d.followups.map(x=>`<article class="case-note"><div class="row-title"><span>${esc(dt(x.date))}</span><span>${esc([x.temperature,x.hydration].filter(Boolean).join(' / '))}</span></div><div class="row-meta">${esc(x.notes||'')}</div></article>`).join(''):'<div class="empty-state">Sin seguimientos capturados.</div>'}</div>`;
    q('followupForm')?.addEventListener('submit',addFollowup);
  }
  function renderVisitsCompact(){
    if(!install())return;
    setVersion();
    renderRecords();
    renderForm();
    renderPrescriptionPanel();
    renderHistoryPanel();
    if(typeof renderReceiptArea==='function')renderReceiptArea();
  }
  async function persistVisit(v){
    if(state.storageMode==='supabase')await saveRemoteVisit(v);else await put('visits',v);
  }
  async function saveVisitCompact(ev){
    ev?.preventDefault();
    if(!state.selectedPetId){setMessage('Selecciona una mascota antes de guardar la visita.','error');return;}
    const current=selectedVisit();
    const data={...caseData(current),schema:'case-v1',visitType:q('visitType')?.value||'Consulta',explorationNormal:q('explorationNormal')?.checked!==false,findings:getFindings()};
    const id=q('visitId')?.value||crypto.randomUUID();
    const visit={id,petId:state.selectedPetId,visitDate:q('visitDate')?.value||localDate(new Date()),ownerComplaint:(q('ownerComplaint')?.value||'').trim(),physiologicalConstants:findingsSummary(data),symptoms:(q('symptoms')?.value||'').trim(),prognosis:(q('prognosis')?.value||'').trim(),diagnosis:(q('diagnosis')?.value||'').trim(),observations:JSON.stringify(data),updatedAt:new Date().toISOString()};
    setMessage('Guardando visita...');
    try{
      await persistVisit(visit);
      state.selectedVisitId=id;
      await loadState();
      renderVisitsCompact();
      setMessage('Visita guardada.','success');
      if(typeof flashStatus==='function')flashStatus('Visita guardada');
    }catch(err){
      setMessage(err.message||'No se pudo guardar la visita.','error');
      if(typeof flashStatus==='function')flashStatus('No se pudo guardar la visita');
    }
  }
  async function updateCase(mutator,ok){
    const v=selectedVisit();
    if(!v){setMessage('Guarda primero la visita.','error');return;}
    const d=caseData(v);
    mutator(d);
    const updated={...v,physiologicalConstants:findingsSummary(d),observations:JSON.stringify(d),updatedAt:new Date().toISOString()};
    setMessage('Guardando en la visita...');
    try{
      await persistVisit(updated);
      await loadState();
      renderVisitsCompact();
      setMessage(ok,'success');
      if(typeof flashStatus==='function')flashStatus(ok);
    }catch(err){
      setMessage(err.message||'No se pudo guardar.','error');
    }
  }
  async function addFollowup(ev){
    ev.preventDefault();
    const notes=(q('followupNotes')?.value||'').trim();
    const temperature=(q('followupTemperature')?.value||'').trim();
    const hydration=(q('followupHydration')?.value||'').trim();
    if(!notes&&!temperature&&!hydration){setMessage('Captura al menos una observacion, temperatura o hidratacion.','error');return;}
    await updateCase(d=>d.followups.push({id:crypto.randomUUID(),date:q('followupDate')?.value||localDate(new Date()),temperature,hydration,notes}),'Seguimiento agregado.');
  }
  async function addPrescription(ev){
    ev.preventDefault();
    const medication=(q('prescriptionMedication')?.value||'').trim();
    const instructions=(q('prescriptionInstructions')?.value||'').trim();
    if(!medication&&!instructions){setMessage('Captura medicamento o indicaciones.','error');return;}
    await updateCase(d=>d.prescriptions.push({id:crypto.randomUUID(),date:q('prescriptionDate')?.value||localDate(new Date()),medication,instructions}),'Receta agregada.');
  }
  function selectVisitCompact(id){state.selectedVisitId=id;renderVisitsCompact();setMessage('');}
  function patch(){
    if(typeof supabaseClient!=='undefined'){
      saveRemoteVisit=async visit=>{
        const {error}=await supabaseClient.from('visits').upsert({id:visit.id,pet_id:visit.petId,visit_date:new Date(visit.visitDate).toISOString(),owner_complaint:visit.ownerComplaint||null,physiological_constants:visit.physiologicalConstants||null,symptoms:visit.symptoms||null,prognosis:visit.prognosis||null,diagnosis:visit.diagnosis||null,observations:visit.observations||null,updated_at:visit.updatedAt},{onConflict:'id'});
        if(typeof throwIfSupabaseError==='function')throwIfSupabaseError(error);else if(error)throw error;
      };
    }
    renderVisits=renderVisitsCompact;
    saveVisit=saveVisitCompact;
    selectVisit=selectVisitCompact;
  }
  function boot(){
    if(typeof state==='undefined'||typeof renderVisits==='undefined'){setTimeout(boot,120);return;}
    patch();
    install(true);
    renderVisitsCompact();
    [700,1800,4200,7000].forEach(t=>setTimeout(()=>{patch();install(true);renderVisitsCompact();},t));
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,450)):setTimeout(boot,450);
})();
