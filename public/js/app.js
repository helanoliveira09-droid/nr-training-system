/* ===================== API HELPERS ===================== */
const API = '/api';
function authHeaders(extra){
  const h = Object.assign({'Content-Type':'application/json'}, extra || {});
  const tok = sessionStorage.getItem('nrsys_admin_token');
  if(tok) h['x-admin-token'] = tok;
  return h;
}
async function apiGet(path){ const r = await fetch(API + path); if(!r.ok) throw new Error('Falha ao carregar ' + path); return r.json(); }
async function apiPost(path, body){ const r = await fetch(API + path, {method:'POST', headers:authHeaders(), body:JSON.stringify(body)}); if(!r.ok){ const e = await r.json().catch(()=>({})); throw new Error(e.error || 'Falha ao salvar'); } return r.json(); }
async function apiPut(path, body){ const r = await fetch(API + path, {method:'PUT', headers:authHeaders(), body:JSON.stringify(body)}); if(!r.ok){ const e = await r.json().catch(()=>({})); throw new Error(e.error || 'Falha ao salvar'); } return r.json(); }
async function apiDelete(path){ const r = await fetch(API + path, {method:'DELETE', headers:authHeaders()}); if(!r.ok){ const e = await r.json().catch(()=>({})); throw new Error(e.error || 'Falha ao excluir'); } return r.json(); }

/* ===================== CACHES ===================== */
let setoresCache = [];
let nrTypesCache = [];
let treinosCache = [];
let configCache = { empresaNome:'', logoDataUrl:'' };

function normalizeId(obj){ if(obj && obj._id && !obj.id) obj.id = obj._id; return obj; }

async function refreshSetores(){ setoresCache = (await apiGet('/setores')).map(normalizeId); }
async function refreshNRTypes(){ nrTypesCache = (await apiGet('/nrtypes')).map(normalizeId); }
async function refreshTreinos(){ treinosCache = (await apiGet('/treinamentos')).map(normalizeId); }
async function refreshConfig(){ configCache = normalizeId(await apiGet('/config')); }

function getSetores(){ return setoresCache; }
function getTreinos(){ return treinosCache; }
function getNRTypes(){ return nrTypesCache; }

/* ===================== ROLE / LOGIN ===================== */
let currentRole = null;

async function checkServerOnline(){
  try{ await apiGet('/../health'.replace('/../','/')); document.getElementById('login-footer').textContent = 'Servidor conectado ao MongoDB · pronto para uso'; }
  catch(e){ document.getElementById('login-footer').textContent = 'Não foi possível conectar ao servidor. Verifique a implantação.'; }
}

function selectRole(role){
  if(role === 'admin'){ document.getElementById('pw-row').style.display = 'flex'; document.getElementById('pw-input').focus(); }
  else{ enterApp('view'); }
}
async function confirmAdminLogin(){
  const pw = document.getElementById('pw-input').value;
  try{
    const r = await fetch(API + '/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pw})});
    if(r.ok){ sessionStorage.setItem('nrsys_admin_token', pw); enterApp('admin'); }
    else{ document.getElementById('login-error').style.display = 'block'; }
  }catch(e){ document.getElementById('login-error').textContent = 'Erro de conexão com o servidor.'; document.getElementById('login-error').style.display = 'block'; }
}
async function enterApp(role){
  currentRole = role;
  sessionStorage.setItem('nrsys_role', role);
  document.getElementById('screen-login').style.display = 'none';
  document.getElementById('screen-app').style.display = 'flex';
  applyRoleVisibility();
  const badge = document.getElementById('mode-badge');
  if(role === 'admin'){ badge.textContent = 'MODO ADMINISTRADOR'; badge.className = 'mode-badge admin'; }
  else{ badge.textContent = 'MODO CONSULTA'; badge.className = 'mode-badge view'; }
  await initApp();
}
function applyRoleVisibility(){
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = (currentRole === 'admin') ? '' : 'none');
  document.querySelectorAll('.admin-tab').forEach(el => el.style.display = (currentRole === 'admin') ? '' : 'none');
}
function logout(){
  sessionStorage.removeItem('nrsys_role');
  sessionStorage.removeItem('nrsys_admin_token');
  document.getElementById('screen-app').style.display = 'none';
  document.getElementById('screen-login').style.display = 'flex';
  document.getElementById('pw-row').style.display = 'none';
  document.getElementById('pw-input').value = '';
  document.getElementById('login-error').style.display = 'none';
}

/* ===================== TABS ===================== */
function showTab(tab){
  if(currentRole !== 'admin' && tab !== 'dashboard' && tab !== 'banco') tab = 'dashboard';
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + tab).classList.add('active');
  if(tab === 'banco') renderBanco();
  if(tab === 'setores') renderSetores();
  if(tab === 'normas') renderNRGrid();
  if(tab === 'dashboard') renderDashboard();
  if(tab === 'docs') renderConfigForm();
}
function quickFilter(type){
  showTab('banco');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'banco'));
  document.getElementById('f-status').value = (type === 'all') ? '' : type;
  renderBanco();
}
function clearFilters(){
  document.getElementById('f-setor').value = '';
  document.getElementById('f-status').value = '';
  document.getElementById('f-nr').value = '';
  document.getElementById('f-busca').value = '';
  renderBanco();
}

/* ===================== STATUS CALC ===================== */
function daysBetween(dateStr){
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}
function getStatus(dateStr){
  if(!dateStr) return {key:'att', label:'Sem data'};
  const diff = daysBetween(dateStr);
  if(diff < 0) return {key:'exp', label:'Vencido'};
  if(diff <= 60) return {key:'att', label:'Em atenção'};
  return {key:'ok', label:'Em dia'};
}
function getAttentionOrExpired(){
  return getTreinos()
    .filter(t => { const k = getStatus(t.validadeData).key; return k === 'att' || k === 'exp'; })
    .sort((a,b) => (a.validadeData||'').localeCompare(b.validadeData||''));
}

/* ===================== SELECT POPULATION ===================== */
function populateNRSelects(){
  const types = getNRTypes();
  const opts = types.map(t => '<option value="' + t.id + '">' + t.code + ' — ' + t.name + '</option>').join('');
  ['tr-nr','pr-nr'].forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML = opts; });
  const filterOpts = '<option value="">Todas</option>' + types.map(t => '<option value="' + t.id + '">' + t.code + '</option>').join('');
  document.getElementById('f-nr').innerHTML = filterOpts;
}
function populateSetorSelects(){
  const setores = getSetores();
  const opts = setores.map(s => '<option value="' + s.id + '">' + s.nome + '</option>').join('');
  const trSel = document.getElementById('tr-setor'); if(trSel) trSel.innerHTML = opts;
  const filterOpts = '<option value="">Todos</option>' + opts;
  document.getElementById('f-setor').innerHTML = filterOpts;
}
function nrLabel(nrId){ const t = getNRTypes().find(x => x.id === nrId); return t ? t.code : '—'; }
function nrFullLabel(nrId){ const t = getNRTypes().find(x => x.id === nrId); return t ? (t.code + ' - ' + t.name) : '—'; }
function nrObj(nrId){ return getNRTypes().find(x => x.id === nrId); }
function setorNome(setorId){ const s = getSetores().find(x => x.id === setorId); return s ? s.nome : '—'; }
function fmtDate(d){ if(!d) return '—'; const [y,m,day] = d.split('-'); return day + '/' + m + '/' + y; }
function esc(s){ return (s === undefined || s === null) ? '' : String(s).replace(/"/g,'&quot;'); }

/* ===================== INSTRUTOR ROWS (nome / registro / conteudo / data) ===================== */
function instrutorRowHtml(inst){
  inst = inst || {};
  return '<div class="instrutor-row" data-row>' +
    '<input type="text" placeholder="Nome do instrutor" class="i-nome" value="' + esc(inst.nome) + '">' +
    '<input type="text" placeholder="Nº de registro" class="i-registro" value="' + esc(inst.registro) + '">' +
    '<input type="text" placeholder="Conteúdo ministrado" class="i-conteudo" value="' + esc(inst.conteudo) + '">' +
    '<input type="date" class="i-data" value="' + esc(inst.data) + '">' +
    '<input type="text" placeholder="Carga hor. ministrada" class="i-carga" value="' + esc(inst.carga) + '">' +
    '<button type="button" class="rm-row" title="Remover" onclick="this.closest(\'[data-row]\').remove()">&times;</button>' +
  '</div>';
}
function renderInstrutorRows(containerId, list){
  const c = document.getElementById(containerId);
  if(!c) return;
  const items = (list && list.length) ? list : [{}];
  c.innerHTML = items.map(instrutorRowHtml).join('');
}
function addInstrutorRow(containerId){
  document.getElementById(containerId).insertAdjacentHTML('beforeend', instrutorRowHtml());
}
function collectInstrutorRows(containerId){
  return Array.from(document.querySelectorAll('#' + containerId + ' [data-row]')).map(row => ({
    nome: row.querySelector('.i-nome').value.trim(),
    registro: row.querySelector('.i-registro').value.trim(),
    conteudo: row.querySelector('.i-conteudo').value.trim(),
    data: row.querySelector('.i-data').value,
    carga: row.querySelector('.i-carga') ? row.querySelector('.i-carga').value.trim() : ''
  })).filter(i => i.nome);
}
function instrutoresSummary(list){
  if(!list || !list.length) return '';
  return list.map(i => i.nome).filter(Boolean).join(', ');
}

/* ===================== DASHBOARD ===================== */
function renderDashboard(){
  const treinos = getTreinos();
  let ok=0, att=0, exp=0;
  treinos.forEach(t => { const s = getStatus(t.validadeData).key; if(s==='ok') ok++; else if(s==='att') att++; else exp++; });
  document.getElementById('st-total').textContent = treinos.length;
  document.getElementById('st-ok').textContent = ok;
  document.getElementById('st-att').textContent = att;
  document.getElementById('st-exp').textContent = exp;

  const upcoming = treinos.filter(t => t.validadeData).map(t => ({...t, diff: daysBetween(t.validadeData)})).filter(t => t.diff <= 60).sort((a,b) => a.diff - b.diff).slice(0, 8);
  const wrap = document.getElementById('dash-upcoming');
  if(upcoming.length === 0){ wrap.innerHTML = '<div class="empty"><b>Nenhum vencimento próximo</b>Todos os treinamentos estão em dia (mais de 60 dias de validade).</div>'; return; }
  wrap.innerHTML = '<table style="width:100%; border-collapse:collapse; font-size:13px;"><thead><tr>' +
    '<th style="text-align:left; padding:8px; border-bottom:2px solid var(--line); font-size:11px; color:var(--muted); text-transform:uppercase;">Funcionário</th>' +
    '<th style="text-align:left; padding:8px; border-bottom:2px solid var(--line); font-size:11px; color:var(--muted); text-transform:uppercase;">Setor</th>' +
    '<th style="text-align:left; padding:8px; border-bottom:2px solid var(--line); font-size:11px; color:var(--muted); text-transform:uppercase;">NR</th>' +
    '<th style="text-align:left; padding:8px; border-bottom:2px solid var(--line); font-size:11px; color:var(--muted); text-transform:uppercase;">Vencimento</th>' +
    '<th style="text-align:left; padding:8px; border-bottom:2px solid var(--line); font-size:11px; color:var(--muted); text-transform:uppercase;">Status</th></tr></thead><tbody>' +
    upcoming.map(t => { const st = getStatus(t.validadeData); return '<tr><td style="padding:8px; border-bottom:1px solid var(--line);">' + t.nome + '</td><td style="padding:8px; border-bottom:1px solid var(--line);">' + setorNome(t.setorId) + '</td><td style="padding:8px; border-bottom:1px solid var(--line);"><span class="nr-chip">' + nrLabel(t.nrId) + '</span></td><td style="padding:8px; border-bottom:1px solid var(--line);">' + fmtDate(t.validadeData) + '</td><td style="padding:8px; border-bottom:1px solid var(--line);"><span class="status-pill ' + st.key + '">' + st.label + '</span></td></tr>'; }).join('') + '</tbody></table>';
}

/* ===================== BANCO DE TREINAMENTOS (CARDS) ===================== */
function renderBanco(){
  const setorF = document.getElementById('f-setor').value;
  const statusF = document.getElementById('f-status').value;
  const nrF = document.getElementById('f-nr').value;
  const buscaF = document.getElementById('f-busca').value.trim().toLowerCase();

  let treinos = getTreinos();
  if(setorF) treinos = treinos.filter(t => t.setorId === setorF);
  if(nrF) treinos = treinos.filter(t => t.nrId === nrF);
  if(buscaF) treinos = treinos.filter(t => t.nome.toLowerCase().includes(buscaF));
  if(statusF) treinos = treinos.filter(t => getStatus(t.validadeData).key === statusF);
  treinos.sort((a,b) => (a.validadeData||'').localeCompare(b.validadeData||''));

  const grid = document.getElementById('banco-grid');
  const empty = document.getElementById('banco-empty');
  if(treinos.length === 0){ grid.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display = 'none';

  grid.innerHTML = treinos.map(t => {
    const st = getStatus(t.validadeData);
    const certBtn = t.certFile && t.certFile.dataUrl ? '<button class="icon-btn" title="Ver certificado" onclick="viewCert(\'' + t.id + '\')">📄</button>' : '';
    const actions = '<div class="treino-card-actions admin-only">' +
      '<button class="icon-btn" title="Editar" onclick="editTreino(\'' + t.id + '\')">✎</button>' +
      '<button class="icon-btn" title="Excluir" onclick="deleteTreino(\'' + t.id + '\')">🗑</button>' + certBtn + '</div>';
    const viewOnlyCert = (currentRole !== 'admin' && certBtn) ? ('<div class="treino-card-actions">' + certBtn + '</div>') : '';
    const respSummary = instrutoresSummary(t.instrutores);
    const resp = respSummary ? ('<div class="treino-resp"><b>Resp. técnico(s):</b> ' + respSummary + '</div>') : '';
    return '<div class="treino-card st-' + st.key + '">' +
      '<div class="treino-card-top"><h4>' + t.nome + '</h4><span class="status-pill ' + st.key + '">' + st.label + '</span></div>' +
      '<div class="treino-sub">' + setorNome(t.setorId) + (t.funcao ? ' · ' + t.funcao : '') + '</div>' +
      '<div class="treino-meta-row"><span class="nr-chip">' + nrLabel(t.nrId) + '</span><span class="hint">' + t.carga + 'h</span></div>' +
      '<div class="treino-dates"><span><b>Treinamento:</b> ' + fmtDate(t.dataTreinamento) + '</span><span><b>Vencimento:</b> ' + fmtDate(t.validadeData) + '</span></div>' +
      resp + actions + viewOnlyCert + '</div>';
  }).join('');
  applyRoleVisibility();
}

/* ===================== NORMAS (NR) ===================== */
function renderNRGrid(){
  const types = getNRTypes();
  const grid = document.getElementById('nr-grid');
  grid.innerHTML = types.map(t => {
    const actions = currentRole === 'admin'
      ? '<div style="margin-top:10px; display:flex; gap:6px;"><button class="icon-btn" onclick="editNR(\'' + t.id + '\')">✎</button><button class="icon-btn" onclick="deleteNR(\'' + t.id + '\')">🗑</button></div>'
      : '';
    const respSummary = instrutoresSummary(t.instrutores);
    return '<div class="nr-card"><h4>' + t.code + '</h4><div class="treino-sub">' + t.name + '</div>' +
      '<div class="content-preview">' + (t.conteudo || 'Sem conteúdo programático cadastrado.') + '</div>' +
      '<div class="instrutor-line"><b>Responsáveis técnicos:</b> ' + (respSummary || 'não definidos') + '</div>' +
      actions + '</div>';
  }).join('');
}
function openNRModal(id){
  document.getElementById('nr-id').value = id || '';
  document.getElementById('nr-modal-title').textContent = id ? 'Editar NR' : 'Nova NR';
  if(id){
    const t = getNRTypes().find(x => x.id === id);
    document.getElementById('nr-code').value = t.code;
    document.getElementById('nr-name').value = t.name;
    document.getElementById('nr-conteudo').value = t.conteudo || '';
    renderInstrutorRows('nr-instrutores-rows', t.instrutores);
  } else {
    ['nr-code','nr-name','nr-conteudo'].forEach(id2 => document.getElementById(id2).value = '');
    renderInstrutorRows('nr-instrutores-rows', []);
  }
  openModal('modal-nr');
}
function editNR(id){ openNRModal(id); }
async function saveNR(){
  const id = document.getElementById('nr-id').value;
  const code = document.getElementById('nr-code').value.trim();
  const name = document.getElementById('nr-name').value.trim();
  const conteudo = document.getElementById('nr-conteudo').value.trim();
  const instrutores = collectInstrutorRows('nr-instrutores-rows');
  if(!code || !name){ alert('Informe o código e o nome da norma.'); return; }
  try{
    const payload = {code, name, conteudo, instrutores};
    if(id){ await apiPut('/nrtypes/' + id, payload); } else { await apiPost('/nrtypes', payload); }
    await refreshNRTypes();
    closeModal('modal-nr');
    populateNRSelects(); renderNRGrid(); renderBanco();
  }catch(e){ alert('Erro ao salvar NR: ' + e.message); }
}
async function deleteNR(id){
  if(!confirm('Excluir esta norma do banco de conteúdos?')) return;
  try{ await apiDelete('/nrtypes/' + id); await refreshNRTypes(); populateNRSelects(); renderNRGrid(); }
  catch(e){ alert('Erro ao excluir: ' + e.message); }
}

/* ===================== SETORES ===================== */
function renderSetores(){
  const setores = getSetores();
  const treinos = getTreinos();
  const grid = document.getElementById('setores-grid');
  if(setores.length === 0){ grid.innerHTML = '<div class="empty"><b>Nenhum setor cadastrado</b>Cadastre o primeiro setor.</div>'; return; }
  grid.innerHTML = setores.map(s => {
    const count = treinos.filter(t => t.setorId === s.id).length;
    const actions = currentRole === 'admin'
      ? '<div style="display:flex; gap:6px;"><button class="icon-btn" onclick="editSetor(\'' + s.id + '\')">✎</button><button class="icon-btn" onclick="deleteSetor(\'' + s.id + '\')">🗑</button></div>'
      : '';
    return '<div class="setor-card"><h4>' + s.nome + '</h4><div class="resp">Responsável: <b>' + (s.responsavel || '—') + '</b></div>' +
      '<div class="hint">' + count + ' treinamento(s) registrado(s)</div><div style="margin-top:10px;">' + actions + '</div></div>';
  }).join('');
}
function openSetorModal(id){
  document.getElementById('setor-id').value = id || '';
  document.getElementById('setor-modal-title').textContent = id ? 'Editar setor' : 'Novo setor';
  if(id){ const s = getSetores().find(x => x.id === id); document.getElementById('setor-nome').value = s.nome; document.getElementById('setor-resp').value = s.responsavel; }
  else{ document.getElementById('setor-nome').value = ''; document.getElementById('setor-resp').value = ''; }
  openModal('modal-setor');
}
function editSetor(id){ openSetorModal(id); }
async function saveSetor(){
  const id = document.getElementById('setor-id').value;
  const nome = document.getElementById('setor-nome').value.trim();
  const responsavel = document.getElementById('setor-resp').value.trim();
  if(!nome){ alert('Informe o nome do setor.'); return; }
  try{
    if(id){ await apiPut('/setores/' + id, {nome, responsavel}); } else { await apiPost('/setores', {nome, responsavel}); }
    await refreshSetores();
    closeModal('modal-setor');
    populateSetorSelects(); renderSetores(); renderBanco();
  }catch(e){ alert('Erro ao salvar setor: ' + e.message); }
}
async function deleteSetor(id){
  if(!confirm('Excluir este setor? Treinamentos vinculados manterão o registro mas sem setor associado.')) return;
  try{ await apiDelete('/setores/' + id); await refreshSetores(); populateSetorSelects(); renderSetores(); renderBanco(); }
  catch(e){ alert('Erro ao excluir: ' + e.message); }
}

/* ===================== TREINAMENTOS ===================== */
let tempCertFile = null;
function openTreinoModal(id){
  document.getElementById('treino-id').value = id || '';
  document.getElementById('treino-modal-title').textContent = id ? 'Editar treinamento' : 'Novo treinamento';
  tempCertFile = null;
  populateNRSelects(); populateSetorSelects();
  document.getElementById('file-status').textContent = 'Nenhum arquivo importado';
  document.getElementById('file-status').className = 'file-row';
  document.getElementById('tr-file').value = '';

  if(id){
    const t = getTreinos().find(x => x.id === id);
    document.getElementById('tr-nome').value = t.nome;
    document.getElementById('tr-setor').value = t.setorId || '';
    document.getElementById('tr-funcao').value = t.funcao || '';
    document.getElementById('tr-nr').value = t.nrId;
    document.getElementById('tr-data').value = t.dataTreinamento;
    const cargaSel = document.getElementById('tr-carga');
    const standard = ['2','4','6','8','16','20','40'];
    if(standard.includes(String(t.carga))){ cargaSel.value = String(t.carga); document.getElementById('carga-custom-wrap').style.display='none'; }
    else { cargaSel.value = 'custom'; document.getElementById('carga-custom-wrap').style.display='block'; document.getElementById('tr-carga-custom').value = t.carga; }
    document.getElementById('tr-validade-tipo').value = t.validadeTipo;
    document.getElementById('tr-validade-data').value = t.validadeData;
    document.getElementById('tr-local').value = t.local || '';
    document.getElementById('tr-dias').value = t.dias || '';
    document.getElementById('tr-conteudo').value = t.conteudo || '';
    document.getElementById('tr-obs').value = t.obs || '';
    renderInstrutorRows('tr-instrutores-rows', t.instrutores);
    if(t.certFile && t.certFile.dataUrl){ tempCertFile = t.certFile; document.getElementById('file-status').textContent = '✓ ' + t.certFile.name; document.getElementById('file-status').className = 'file-row has-file'; }
  } else {
    ['tr-nome','tr-funcao','tr-obs','tr-local','tr-dias','tr-conteudo'].forEach(id2 => document.getElementById(id2).value = '');
    document.getElementById('tr-data').value = '';
    document.getElementById('tr-validade-data').value = '';
    document.getElementById('tr-carga').value = '8';
    document.getElementById('carga-custom-wrap').style.display='none';
    document.getElementById('tr-validade-tipo').value = '1';
    renderInstrutorRows('tr-instrutores-rows', []);
    if(document.getElementById('tr-nr').value) onTreinoNRChange();
  }
  updateStatusPreview();
  openModal('modal-treino');
}
function editTreino(id){ openTreinoModal(id); }
function toggleCargaCustom(){ document.getElementById('carga-custom-wrap').style.display = (document.getElementById('tr-carga').value === 'custom') ? 'block' : 'none'; }
function onTreinoNRChange(){
  const nr = nrObj(document.getElementById('tr-nr').value);
  if(!nr) return;
  document.getElementById('tr-conteudo').value = nr.conteudo || '';
  renderInstrutorRows('tr-instrutores-rows', nr.instrutores);
}
function autoCalcValidade(){
  const data = document.getElementById('tr-data').value;
  const tipo = document.getElementById('tr-validade-tipo').value;
  if(!data || tipo === '0') { updateStatusPreview(); return; }
  const d = new Date(data + 'T00:00:00');
  d.setFullYear(d.getFullYear() + parseInt(tipo));
  document.getElementById('tr-validade-data').value = d.toISOString().slice(0,10);
  updateStatusPreview();
}
document.addEventListener('input', function(e){ if(e.target && e.target.id === 'tr-validade-data') updateStatusPreview(); });
function updateStatusPreview(){
  const val = document.getElementById('tr-validade-data').value;
  const st = getStatus(val);
  const box = document.getElementById('status-preview');
  const txt = document.getElementById('status-preview-text');
  box.className = 'status-preview ' + st.key;
  if(!val) txt.textContent = 'Informe a data de vencimento para calcular o status.';
  else if(st.key === 'ok') txt.textContent = 'Em dia — vencimento em ' + fmtDate(val) + '.';
  else if(st.key === 'att') txt.textContent = 'Em atenção — vence em ' + daysBetween(val) + ' dia(s), em ' + fmtDate(val) + '.';
  else txt.textContent = 'Vencido em ' + fmtDate(val) + '. Treinamento precisa ser refeito.';
}
function handleFile(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    tempCertFile = {name: file.name, dataUrl: ev.target.result};
    document.getElementById('file-status').textContent = '✓ ' + file.name;
    document.getElementById('file-status').className = 'file-row has-file';
  };
  reader.readAsDataURL(file);
}
async function saveTreino(){
  const nome = document.getElementById('tr-nome').value.trim();
  const setorId = document.getElementById('tr-setor').value;
  const funcao = document.getElementById('tr-funcao').value.trim();
  const nrId = document.getElementById('tr-nr').value;
  const dataTreinamento = document.getElementById('tr-data').value;
  const cargaSel = document.getElementById('tr-carga').value;
  const carga = cargaSel === 'custom' ? (document.getElementById('tr-carga-custom').value || '0') : cargaSel;
  const validadeTipo = document.getElementById('tr-validade-tipo').value;
  const validadeData = document.getElementById('tr-validade-data').value;
  const local = document.getElementById('tr-local').value.trim();
  const dias = document.getElementById('tr-dias').value.trim();
  const conteudo = document.getElementById('tr-conteudo').value.trim();
  const instrutores = collectInstrutorRows('tr-instrutores-rows');
  const obs = document.getElementById('tr-obs').value.trim();

  if(!nome || !nrId || !dataTreinamento || !validadeData){ alert('Preencha nome, NR, data do treinamento e data de vencimento.'); return; }
  const id = document.getElementById('treino-id').value;
  const payload = {nome, setorId, funcao, nrId, dataTreinamento, carga, validadeTipo, validadeData, local, dias, conteudo, instrutores, obs, certFile: tempCertFile || {name:'', dataUrl:''}};
  try{
    if(id){ await apiPut('/treinamentos/' + id, payload); } else { await apiPost('/treinamentos', payload); }
    await refreshTreinos();
    closeModal('modal-treino');
    renderBanco(); renderDashboard();
  }catch(e){ alert('Erro ao salvar treinamento: ' + e.message); }
}
async function deleteTreino(id){
  if(!confirm('Excluir este registro de treinamento?')) return;
  try{ await apiDelete('/treinamentos/' + id); await refreshTreinos(); renderBanco(); renderDashboard(); }
  catch(e){ alert('Erro ao excluir: ' + e.message); }
}
function viewCert(id){
  const t = getTreinos().find(x => x.id === id);
  if(!t || !t.certFile || !t.certFile.dataUrl) return;
  document.getElementById('cert-frame').src = t.certFile.dataUrl;
  openModal('modal-viewcert');
}

/* ===================== MODAL HELPERS ===================== */
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

/* ===================== CONFIG / LOGOMARCA ===================== */
function renderConfigForm(){
  document.getElementById('cfg-empresa').value = configCache.empresaNome || '';
  const wrap = document.getElementById('logo-preview-wrap');
  const img = document.getElementById('logo-preview-img');
  if(configCache.logoDataUrl){ wrap.style.display = 'block'; img.src = configCache.logoDataUrl; }
  else{ wrap.style.display = 'none'; }
  applyBrandLogo();
}
function applyBrandLogo(){
  const wrap = document.getElementById('brand-logo-wrap');
  if(configCache.logoDataUrl){ wrap.innerHTML = '<img src="' + configCache.logoDataUrl + '" alt="Logo">'; }
  else{ wrap.innerHTML = '<div class="brand-mark">NR</div>'; }
}
let tempLogoDataUrl = null;
function handleLogoUpload(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    tempLogoDataUrl = ev.target.result;
    document.getElementById('logo-preview-wrap').style.display = 'block';
    document.getElementById('logo-preview-img').src = tempLogoDataUrl;
  };
  reader.readAsDataURL(file);
}
function removeLogo(){ tempLogoDataUrl = ''; document.getElementById('logo-preview-wrap').style.display = 'none'; document.getElementById('cfg-logo').value=''; }
async function saveConfig(){
  const empresaNome = document.getElementById('cfg-empresa').value.trim();
  const payload = {empresaNome};
  if(tempLogoDataUrl !== null) payload.logoDataUrl = tempLogoDataUrl;
  try{
    await apiPut('/config', payload);
    await refreshConfig();
    renderConfigForm();
    tempLogoDataUrl = null;
    alert('Identidade visual salva com sucesso.');
  }catch(e){ alert('Erro ao salvar: ' + e.message); }
}

/* ===================== LISTA DE PRESENÇA ===================== */
let presencaRowCount = 0;
function openPresencaModal(){
  populateNRSelects();
  document.getElementById('pr-data').value = '';
  document.getElementById('pr-carga').value = '';
  document.getElementById('pr-local').value = '';
  document.getElementById('pr-conteudo').value = '';
  renderInstrutorRows('pr-instrutores-rows', []);
  document.getElementById('presenca-rows').innerHTML = '';
  presencaRowCount = 0;
  openModal('modal-presenca');
  if(document.getElementById('pr-nr').value) onPresencaNRChange();
}
function onPresencaNRChange(){
  const nrId = document.getElementById('pr-nr').value;
  const nr = nrObj(nrId);
  if(nr){
    document.getElementById('pr-conteudo').value = nr.conteudo || '';
    renderInstrutorRows('pr-instrutores-rows', nr.instrutores);
  }
  const matches = getAttentionOrExpired().filter(t => t.nrId === nrId);
  document.getElementById('presenca-rows').innerHTML = '';
  presencaRowCount = 0;
  matches.forEach(t => addPresencaRow(t.nome, t.funcao, setorNome(t.setorId), t.id));
  const info = document.getElementById('presenca-auto-info');
  if(matches.length > 0){
    info.innerHTML = '↻ <span><b>' + matches.length + ' colaborador(es)</b> com treinamento vencido ou em atenção para ' + nrLabel(nrId) + ' foram listados automaticamente. Ao gerar os documentos, comprovantes e certificados serão criados para todos.</span>';
  } else {
    info.innerHTML = 'Nenhum colaborador em atenção ou vencido para ' + nrLabel(nrId) + ' no momento. Adicione linhas manualmente se necessário.';
    addPresencaRow();
  }
}
function addPresencaRow(nome, funcao, setor, treinoId){
  presencaRowCount++;
  const tbody = document.getElementById('presenca-rows');
  const tr = document.createElement('tr');
  tr.dataset.treinoId = treinoId || '';
  tr.innerHTML = '<td>' + presencaRowCount + '</td>' +
    '<td><input type="text" placeholder="Nome" value="' + esc(nome) + '"></td>' +
    '<td><input type="text" placeholder="Função" value="' + esc(funcao) + '"></td>' +
    '<td><input type="text" placeholder="Setor" value="' + esc(setor) + '"></td>' +
    '<td></td>' +
    '<td><button class="rm-row" onclick="this.closest(\'tr\').remove()">&times;</button></td>';
  tbody.appendChild(tr);
}
function collectPresencaParticipants(){
  return Array.from(document.querySelectorAll('#presenca-rows tr')).map(tr => {
    const inputs = tr.querySelectorAll('input');
    return { nome: inputs[0].value.trim(), funcao: inputs[1].value.trim(), setor: inputs[2].value.trim() };
  }).filter(p => p.nome);
}
function printPresenca(){
  const html = buildPresencaHtml();
  openPrintWindow(html);
}
function buildPresencaHtml(){
  const nr = nrFullLabel(document.getElementById('pr-nr').value);
  const data = fmtDate(document.getElementById('pr-data').value);
  const carga = document.getElementById('pr-carga').value;
  const local = document.getElementById('pr-local').value;
  const conteudo = document.getElementById('pr-conteudo').value;
  const instrutores = collectInstrutorRows('pr-instrutores-rows');
  const participants = collectPresencaParticipants();
  const rows = participants.map((p,i) => '<tr><td>'+(i+1)+'</td><td>'+p.nome+'</td><td>'+p.funcao+'</td><td>'+p.setor+'</td><td class="sig-cell"></td></tr>').join('');
  const respLine = instrutores.length
    ? instrutores.map(i => i.nome + (i.registro ? ' (Reg. ' + i.registro + ')' : '') + (i.conteudo ? ' — ' + i.conteudo : '')).join('<br>')
    : '—';
  return docPage([
    logoHeader(),
    '<h1>Lista de Presença</h1>',
    '<div class="doc-meta"><div><b>Norma:</b> ' + nr + '</div><div><b>Data:</b> ' + data + '</div><div><b>Carga horária:</b> ' + (carga||'—') + '</div><div><b>Local:</b> ' + (local||'—') + '</div></div>',
    '<p class="doc-p"><b>Responsável(is) técnico(s) pelo treinamento:</b><br>' + respLine + '</p>',
    conteudo ? '<p class="doc-p"><b>Conteúdo programático:</b> ' + conteudo + '</p>' : '',
    '<table class="print-table"><thead><tr><th>#</th><th>Nome</th><th>Função</th><th>Setor</th><th>Assinatura</th></tr></thead><tbody>' + rows + '</tbody></table>'
  ]);
}

/* ---- Geração automática de comprovantes + certificados a partir da lista de presença ---- */
function gerarDocumentosCompletos(){
  const nrId = document.getElementById('pr-nr').value;
  const nr = nrObj(nrId);
  const data = document.getElementById('pr-data').value;
  const carga = document.getElementById('pr-carga').value;
  const local = document.getElementById('pr-local').value;
  const dias = data ? '1 dia (' + fmtDate(data) + ')' : '—';
  const conteudo = document.getElementById('pr-conteudo').value;
  const instrutores = collectInstrutorRows('pr-instrutores-rows');
  const participants = collectPresencaParticipants();

  if(!nrId || participants.length === 0){ alert('Selecione a NR e garanta que há ao menos um participante na lista.'); return; }

  const pages = [];
  pages.push(presencaPageHtml(nr, data, carga, local, conteudo, instrutores, participants));

  participants.forEach(p => {
    pages.push(certificadoFrontHtml({
      empresa: configCache.empresaNome || 'Empresa', nome: p.nome, nr: nrFullLabel(nrId),
      carga: carga ? carga + ' horas' : '—', data: fmtDate(data), local: local || '—', dias
    }, instrutores));
    pages.push(certificadoBackHtml(conteudo, instrutores));
  });

  pages.push(comprovanteListaHtml(nrFullLabel(nrId), fmtDate(new Date().toISOString().slice(0,10)), participants));

  const html = docShell('Documentos de Treinamento — ' + (nr ? nr.code : ''), pages.join('<div class="page-break"></div>'));
  openPrintWindow(html);
}

/* ===================== COMPROVANTE DE ENTREGA (individual) ===================== */
function openComprovanteModal(){
  const sel = document.getElementById('cp-select');
  const list = getAttentionOrExpired();
  sel.innerHTML = '<option value="">-- selecione --</option>' +
    list.map(t => { const st = getStatus(t.validadeData); return '<option value="' + t.id + '">' + t.nome + ' — ' + nrLabel(t.nrId) + ' (' + st.label + ')</option>'; }).join('');
  ['cp-nome','cp-nr','cp-resp'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('cp-data').value = new Date().toISOString().slice(0,10);
  openModal('modal-comprovante');
}
function fillComprovante(){
  const id = document.getElementById('cp-select').value;
  if(!id) return;
  const t = getTreinos().find(x => x.id === id);
  document.getElementById('cp-nome').value = t.nome;
  document.getElementById('cp-nr').value = nrFullLabel(t.nrId);
}
function printComprovante(){
  const nome = document.getElementById('cp-nome').value;
  const nr = document.getElementById('cp-nr').value;
  const data = fmtDate(document.getElementById('cp-data').value);
  const resp = document.getElementById('cp-resp').value;
  const html = docShell('Comprovante de Entrega', comprovantePageHtml(nome, nr, data, resp));
  openPrintWindow(html);
}

/* ===================== MODELO DE CERTIFICADO (individual) ===================== */
function openCertificadoModal(){
  const sel = document.getElementById('ce-select');
  const list = getAttentionOrExpired();
  sel.innerHTML = '<option value="">-- selecione --</option>' +
    list.map(t => { const st = getStatus(t.validadeData); return '<option value="' + t.id + '">' + t.nome + ' — ' + nrLabel(t.nrId) + ' (' + st.label + ')</option>'; }).join('');
  ['ce-empresa','ce-nome','ce-nr','ce-carga','ce-local','ce-dias','ce-conteudo'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ce-data').value = '';
  document.getElementById('ce-empresa').value = configCache.empresaNome || '';
  renderInstrutorRows('ce-instrutores-rows', []);
  openModal('modal-certificado');
}
function fillCertificado(){
  const id = document.getElementById('ce-select').value;
  if(!id) return;
  const t = getTreinos().find(x => x.id === id);
  document.getElementById('ce-nome').value = t.nome;
  document.getElementById('ce-nr').value = nrFullLabel(t.nrId);
  document.getElementById('ce-carga').value = t.carga + ' horas';
  document.getElementById('ce-data').value = t.dataTreinamento;
  document.getElementById('ce-local').value = t.local || '';
  document.getElementById('ce-dias').value = t.dias || '';
  document.getElementById('ce-conteudo').value = t.conteudo || '';
  renderInstrutorRows('ce-instrutores-rows', t.instrutores);
}
function printCertificado(){
  const info = {
    empresa: document.getElementById('ce-empresa').value || 'Empresa',
    nome: document.getElementById('ce-nome').value || '________________________',
    nr: document.getElementById('ce-nr').value || '________________________',
    carga: document.getElementById('ce-carga').value || '—',
    data: fmtDate(document.getElementById('ce-data').value),
    local: document.getElementById('ce-local').value || '—',
    dias: document.getElementById('ce-dias').value || '—'
  };
  const conteudo = document.getElementById('ce-conteudo').value || '—';
  const instrutores = collectInstrutorRows('ce-instrutores-rows');
  const html = docShell('Certificado', certificadoFrontHtml(info, instrutores) + '<div class="page-break"></div>' + certificadoBackHtml(conteudo, instrutores));
  openPrintWindow(html);
}

/* ===================== BLOCOS HTML REUTILIZÁVEIS (impressão) ===================== */
function logoHeader(){
  if(!configCache.logoDataUrl) return '';
  return '<div class="doc-logo"><img src="' + configCache.logoDataUrl + '" alt="Logo"></div>';
}
function presencaPageHtml(nr, data, carga, local, conteudo, instrutores, participants){
  const rows = participants.map((p,i) => '<tr><td>'+(i+1)+'</td><td>'+p.nome+'</td><td>'+p.funcao+'</td><td>'+p.setor+'</td><td class="sig-cell"></td></tr>').join('');
  const respLine = instrutores.length
    ? instrutores.map(i => i.nome + (i.registro ? ' (Reg. ' + i.registro + ')' : '') + (i.conteudo ? ' — ' + i.conteudo : '')).join('<br>')
    : '—';
  return '<div class="doc-page">' + logoHeader() +
    '<h1>Lista de Presença</h1>' +
    '<div class="doc-meta"><div><b>Norma:</b> ' + nrFullLabel(document.getElementById('pr-nr').value) + '</div><div><b>Data:</b> ' + fmtDate(data) + '</div><div><b>Carga horária:</b> ' + (carga||'—') + '</div><div><b>Local:</b> ' + (local||'—') + '</div></div>' +
    '<p class="doc-p"><b>Responsável(is) técnico(s) pelo treinamento:</b><br>' + respLine + '</p>' +
    (conteudo ? '<p class="doc-p"><b>Conteúdo programático:</b> ' + conteudo + '</p>' : '') +
    '<table class="print-table"><thead><tr><th>#</th><th>Nome</th><th>Função</th><th>Setor</th><th>Assinatura</th></tr></thead><tbody>' + rows + '</tbody></table>' +
  '</div>';
}
function comprovanteListaHtml(nr, data, participants){
  const rows = participants.map((p,i) => '<tr><td>'+(i+1)+'</td><td>'+p.nome+'</td><td class="sig-cell"></td></tr>').join('');
  return '<div class="doc-page">' + logoHeader() +
    '<h1>Comprovante de Entrega de Certificado</h1>' +
    '<p class="doc-p">Declaramos, para os devidos fins, que os colaboradores relacionados abaixo receberam nesta data o certificado referente ao treinamento da norma regulamentadora indicada, confirmando o recebimento com a assinatura correspondente.</p>' +
    '<div class="doc-meta"><div><b>Norma:</b> ' + (nr||'—') + '</div><div><b>Data de entrega:</b> ' + (data||'—') + '</div></div>' +
    '<table class="print-table"><thead><tr><th style="width:36px;">#</th><th>Nome do colaborador</th><th>Assinatura</th></tr></thead><tbody>' + rows + '</tbody></table>' +
  '</div>';
}
function comprovantePageHtml(nome, nr, data, resp){
  return '<div class="doc-page">' + logoHeader() +
    '<h1>Comprovante de Entrega de Certificado</h1>' +
    '<p class="doc-p">Declaro, para os devidos fins, que recebi nesta data o certificado referente ao treinamento da norma regulamentadora abaixo indicada.</p>' +
    '<div class="doc-meta col"><div><b>Funcionário:</b> ' + (nome||'—') + '</div><div><b>Norma:</b> ' + (nr||'—') + '</div><div><b>Data de entrega:</b> ' + (data||'—') + '</div><div><b>Entregue por:</b> ' + (resp||'—') + '</div></div>' +
    '<div class="sig-block"><div class="sig-line"></div><div>Assinatura do funcionário</div></div>' +
    '<div class="sig-block"><div class="sig-line"></div><div>Assinatura do responsável pela entrega</div></div>' +
  '</div>';
}
function certificadoFrontHtml(info, instrutores){
  return '<div class="cert-page">' +
    '<div class="cert-border">' +
    logoHeader() +
    '<div class="eyebrow">Certificado de Conclusão</div>' +
    '<h1 class="cert-empresa">' + info.empresa + '</h1>' +
    '<p class="cert-p">Certificamos que</p>' +
    '<div class="cert-name">' + info.nome + '</div>' +
    '<p class="cert-p">concluiu com aproveitamento o treinamento referente à <b>' + info.nr + '</b>, em conformidade com as Normas Regulamentadoras do Ministério do Trabalho e Emprego.</p>' +
    '<div class="cert-info-grid">' +
      '<div><b>Carga horária:</b> ' + info.carga + '</div>' +
      '<div><b>Data de realização:</b> ' + info.data + '</div>' +
      '<div><b>Local:</b> ' + info.local + '</div>' +
      '<div><b>Dias de treinamento:</b> ' + info.dias + '</div>' +
    '</div>' +
    '<div class="cert-sigs single"><div class="cert-sig">' + info.nome + '<br><span class="cert-sig-label">Assinatura do Participante</span></div></div>' +
    '<p class="cert-verso-note">Ver detalhamento do conteúdo programático e dos instrutores no verso.</p>' +
    '</div></div>';
}
function certificadoBackHtml(conteudo, instrutores){
  const blocks = (instrutores && instrutores.length)
    ? instrutores.map(i =>
        '<div class="cert-instrutor-block">' +
          '<div class="cert-instrutor-info">' +
            '<div><b>Instrutor:</b> ' + (i.nome||'—') + '</div>' +
            '<div><b>Registro:</b> ' + (i.registro||'—') + '</div>' +
            '<div class="full"><b>Conteúdo ministrado:</b> ' + (i.conteudo||'—') + '</div>' +
            '<div><b>Data:</b> ' + (i.data ? fmtDate(i.data) : '—') + '</div>' +
            '<div><b>Carga horária ministrada:</b> ' + (i.carga||'—') + '</div>' +
          '</div>' +
          '<div class="cert-instrutor-sig"><div class="cert-sig-line"></div><span>Assinatura do responsável técnico</span></div>' +
        '</div>'
      ).join('')
    : '<p class="doc-p">Nenhum instrutor detalhado para este treinamento.</p>';
  return '<div class="cert-page">' +
    '<div class="cert-border cert-back">' +
    '<div class="eyebrow">Verso do Certificado</div>' +
    '<h1 class="cert-back-title">Conteúdo Programático</h1>' +
    '<div class="cert-content-box">' + (conteudo || 'Conteúdo programático não informado.') + '</div>' +
    '<h2 class="cert-back-subtitle">Instrutores responsáveis, conteúdo, carga horária e assinatura</h2>' +
    blocks +
    '</div></div>';
}
function docPage(parts){ return docShell('Documento', parts.join('')); }
function docShell(title, innerHtml){
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title><style>' + printCss() + '</style></head><body>' + innerHtml + '<script>window.onload=()=>window.print();<\/script></body></html>';
}
function printCss(){
  return 'body{font-family:Arial,sans-serif; color:#16202B; margin:0;}' +
  '.doc-page{padding:36px;}' +
  '.doc-logo img{max-height:52px; max-width:180px; object-fit:contain; margin-bottom:10px;}' +
  'h1{font-size:22px; border-bottom:3px solid #0F2A47; padding-bottom:10px; color:#0F2A47;}' +
  '.doc-meta{display:flex; gap:24px; flex-wrap:wrap; margin:18px 0; font-size:13px;}' +
  '.doc-meta.col{flex-direction:column; gap:10px;}' +
  '.doc-p{font-size:13.5px; line-height:1.7; margin:16px 0;}' +
  '.print-table{width:100%; border-collapse:collapse; margin-top:16px; font-size:12.5px;}' +
  '.print-table th, .print-table td{border:1px solid #999; padding:8px; text-align:left;}' +
  '.sig-cell{min-width:140px;}' +
  '.sig-block{margin-top:50px;}' +
  '.sig-line{border-top:1px solid #16202B; width:280px; margin-bottom:6px;}' +
  '.page-break{page-break-before:always;}' +
  '.cert-page{padding:40px; font-family:Georgia,serif; text-align:center;}' +
  '.cert-border{border:6px double #0F2A47; padding:40px 36px;}' +
  '.cert-border.cert-back{border-style:double; text-align:left;}' +
  '.eyebrow{letter-spacing:4px; font-size:12px; color:#E8622C; font-weight:bold; text-transform:uppercase;}' +
  '.cert-empresa{font-size:30px; margin:10px 0 20px; color:#0F2A47;}' +
  '.cert-p{font-size:14px; line-height:1.7; max-width:640px; margin:8px auto;}' +
  '.cert-name{font-size:25px; margin:16px 0; border-bottom:2px solid #0F2A47; display:inline-block; padding-bottom:6px;}' +
  '.cert-info-grid{display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:560px; margin:18px auto; text-align:left; font-size:12.5px;}' +
  '.cert-sigs{display:flex; justify-content:space-around; margin-top:50px;}' +
  '.cert-sigs.single{justify-content:center;}' +
  '.cert-sig{width:280px; border-top:1px solid #16202B; padding-top:8px; font-size:12.5px; line-height:1.5;}' +
  '.cert-sig-label{display:block; margin-top:6px; font-size:10.5px; color:#5B6B7A; font-family:Arial,sans-serif; text-transform:uppercase; letter-spacing:.4px;}' +
  '.cert-verso-note{margin-top:20px; font-size:10.5px; color:#5B6B7A; font-family:Arial,sans-serif;}' +
  '.cert-back-title{font-size:24px; margin:10px 0 16px; color:#0F2A47;}' +
  '.cert-back-subtitle{font-size:16px; margin:24px 0 8px; color:#0F2A47; font-family:Arial,sans-serif;}' +
  '.cert-content-box{font-family:Arial,sans-serif; font-size:13px; line-height:1.7; background:#F5F6F4; border-radius:4px; padding:16px 18px;}' +
  '.cert-instrutor-block{font-family:Arial,sans-serif; text-align:left; border:1px solid #DCE2E6; border-radius:5px; padding:14px 16px; margin-top:14px;}' +
  '.cert-instrutor-info{display:grid; grid-template-columns:1fr 1fr; gap:6px 16px; font-size:12.5px;}' +
  '.cert-instrutor-info .full{grid-column:1/-1;}' +
  '.cert-instrutor-sig{text-align:center; margin-top:22px;}' +
  '.cert-sig-line{border-top:1px solid #16202B; width:260px; margin:0 auto 6px;}' +
  '.cert-instrutor-sig span{font-size:11px; color:#5B6B7A;}' +
  '@media print{ .doc-page, .cert-page{padding:18px;} }';
}
function openPrintWindow(html){ const w = window.open('', '_blank'); w.document.open(); w.document.write(html); w.document.close(); }

/* ===================== INIT ===================== */
async function initApp(){
  try{
    await Promise.all([refreshSetores(), refreshNRTypes(), refreshTreinos(), refreshConfig()]);
  }catch(e){ alert('Erro ao carregar dados do servidor: ' + e.message); }
  populateNRSelects();
  populateSetorSelects();
  applyRoleVisibility();
  applyBrandLogo();
  renderDashboard(); renderBanco(); renderSetores(); renderNRGrid();
}

(async function boot(){
  checkServerOnline();
  try{ await refreshConfig(); applyBrandLogo(); }catch(e){ /* servidor ainda indisponível no login */ }
  const savedRole = sessionStorage.getItem('nrsys_role');
  if(savedRole){ await enterApp(savedRole); }
})();
