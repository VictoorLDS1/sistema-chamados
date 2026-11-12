const API = '';
const STATUS = ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'FECHADO'];
const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
let paginaAtual = 0;
let totalPaginas = 0;
let chamadosCache = [];
let clientesCache = [];
let categoriasCache = [];
let tecnicosCache = [];

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('pt-BR');
}
function statusLabel(value) {
  return ({ABERTO:'Aberto', EM_ATENDIMENTO:'Em atendimento', AGUARDANDO_CLIENTE:'Aguardando cliente', FECHADO:'Fechado'})[value] || value || '—';
}
function badgeClass(value) {
  return ({ABERTO:'b-orange', EM_ATENDIMENTO:'b-blue', AGUARDANDO_CLIENTE:'b-gray', FECHADO:'b-green'})[value] || 'b-gray';
}
function priorityClass(value) {
  return ({BAIXA:'p-low', MEDIA:'p-medium', ALTA:'p-high', CRITICA:'p-high'})[value] || '';
}
async function api(path, options = {}) {
  const config = { ...options, headers: { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {}) } };
  let response;
  try { response = await fetch(`${API}${path}`, config); }
  catch { throw new Error('Não foi possível conectar à API. Verifique se o Spring Boot está iniciado.'); }
  if (response.status === 204) return null;
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) {
    const details = data?.detalhes?.length ? `\n${data.detalhes.join('\n')}` : '';
    throw new Error((data?.erro || data?.message || `Erro HTTP ${response.status}`) + details);
  }
  return data;
}
function notify(message, type = 'success') {
  let box = $('#app-toast');
  if (!box) { box = document.createElement('div'); box.id = 'app-toast'; document.body.appendChild(box); }
  box.className = `app-toast ${type}`;
  box.textContent = message;
  box.style.display = 'block';
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { box.style.display = 'none'; }, 4500);
}
function showError(error) { console.error(error); notify(error.message || 'Ocorreu um erro inesperado.', 'error'); }
function emptyRow(cols, message) { return `<tr><td colspan="${cols}" class="muted">${escapeHtml(message)}</td></tr>`; }

async function loadDashboard() {
  try {
    const [page, abertos, atendimento, fechados, clientes, categorias, tecnicos] = await Promise.all([
      api('/chamados?page=0&size=5&sort=dataAbertura,desc'),
      api('/chamados?status=ABERTO&page=0&size=1'),
      api('/chamados?status=EM_ATENDIMENTO&page=0&size=1'),
      api('/chamados?status=FECHADO&page=0&size=1'),
      api('/clientes'), api('/categorias'), api('/tecnicos')
    ]);
    const chamados = page.content || [];
    const nums = $$('.stat-number');
    if (nums[0]) nums[0].textContent = page.totalElements ?? 0;
    if (nums[1]) nums[1].textContent = abertos.totalElements ?? 0;
    if (nums[2]) nums[2].textContent = atendimento.totalElements ?? 0;
    if (nums[3]) nums[3].textContent = fechados.totalElements ?? 0;
    const tbody = $('#dashboard-chamados');
    if (tbody) tbody.innerHTML = chamados.slice(0,5).map(c => `<tr>
      <td class="ticket-id">#${c.id}</td><td>${escapeHtml(c.titulo)}</td>
      <td><span class="badge ${badgeClass(c.status)}">${statusLabel(c.status)}</span></td>
      <td class="priority ${priorityClass(c.prioridade)}">${escapeHtml(c.prioridade)}</td></tr>`).join('') || emptyRow(4,'Nenhum chamado cadastrado.');
    const notes = $$('.stat-note');
    if (notes[0]) notes[0].textContent = `${clientes.length} clientes · ${categorias.length} categorias · ${tecnicos.length} técnicos`;
  } catch (e) { showError(e); }
}
async function loadChamados() {
  const tbody = $('#chamados-tbody');
  if (!tbody) return;
  try {
    const params = new URLSearchParams({page:String(paginaAtual), size:'10', sort:'dataAbertura,desc'});
    const status = $('#filtro-status')?.value;
    const prioridade = $('#filtro-prioridade')?.value;
    const clienteId = $('#filtro-cliente')?.value;
    if (status) params.set('status', status);
    if (prioridade) params.set('prioridade', prioridade);
    if (clienteId) params.set('clienteId', clienteId);
    const data = await api(`/chamados?${params}`);
    chamadosCache = data.content || [];
    const busca = ($('#filtro-busca')?.value || '').trim().toLocaleLowerCase('pt-BR');
    const visiveis = chamadosCache.filter(c => !busca || `${c.titulo} ${c.descricao}`.toLocaleLowerCase('pt-BR').includes(busca));
    tbody.innerHTML = visiveis.map(c => `<tr>
      <td class="ticket-id">#${c.id}</td><td>${escapeHtml(c.titulo)}</td><td>${escapeHtml(c.clienteNome)}</td>
      <td>${escapeHtml(c.categoriaNome)}</td><td>${escapeHtml(c.tecnicoNome || '—')}</td>
      <td class="priority ${priorityClass(c.prioridade)}">${escapeHtml(c.prioridade)}</td>
      <td><span class="badge ${badgeClass(c.status)}">${statusLabel(c.status)}</span></td>
      <td>${formatDate(c.dataAbertura)}</td><td><a class="ticket-id" href="chamado-detalhe.html?id=${c.id}">Ver →</a></td></tr>`).join('') || emptyRow(9,'Nenhum chamado encontrado.');
    totalPaginas = data.totalPages || 0;
    const info = $('#paginacao-info');
    if (info) info.textContent = `Página ${totalPaginas ? paginaAtual + 1 : 0} de ${totalPaginas} · ${data.totalElements || 0} chamados`;
    const prev = $('#pagina-anterior'), next = $('#pagina-proxima');
    if (prev) prev.disabled = paginaAtual <= 0;
    if (next) next.disabled = paginaAtual >= totalPaginas - 1;
  } catch (e) { tbody.innerHTML = emptyRow(9,'Não foi possível carregar os chamados.'); showError(e); }
}
async function loadSelects() {
  const [clientes, categorias, tecnicos] = await Promise.all([api('/clientes'), api('/categorias'), api('/tecnicos')]);
  clientesCache = clientes; categoriasCache = categorias; tecnicosCache = tecnicos;
  const fill = (selector, items, label, placeholder) => {
    const el = $(selector); if (!el) return;
    const current = el.value;
    el.innerHTML = `<option value="">${placeholder}</option>` + items.map(x => `<option value="${x.id}">${escapeHtml(x[label])} (ID ${x.id})</option>`).join('');
    if (current) el.value = current;
  };
  fill('#cliente', clientes, 'nome', 'Selecione um cliente');
  fill('#categoria', categorias, 'nome', 'Selecione uma categoria');
  fill('#tecnico', tecnicos, 'nome', 'Selecione um técnico');
  fill('#acao-tecnico', tecnicos, 'nome', 'Selecione um técnico');
}
async function initChamadoForm() {
  const form = $('#form-chamado'); if (!form) return;
  try { await loadSelects(); } catch (e) { showError(e); }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = {
      titulo: $('#titulo').value.trim(), descricao: $('#descricao').value.trim(),
      clienteId: Number($('#cliente').value), categoriaId: Number($('#categoria').value),
      tecnicoId: Number($('#tecnico').value), prioridade: $('#prioridade').value
    };
    if (!payload.clienteId || !payload.categoriaId || !payload.tecnicoId) return notify('Selecione cliente, categoria e técnico.', 'error');
    try { const created = await api('/chamados',{method:'POST',body:JSON.stringify(payload)}); notify(`Chamado #${created.id} criado com sucesso!`); location.href=`chamado-detalhe.html?id=${created.id}`; }
    catch (e) { showError(e); }
  });
}
async function initDetalhe() {
  const title = $('#detalhe-titulo'); if (!title) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { title.textContent = 'Chamado não informado'; return notify('Abra o detalhe a partir da lista de chamados.','error'); }
  try {
    const [c, comments, tecnicos] = await Promise.all([api(`/chamados/${id}`), api(`/chamados/${id}/comentarios`), api('/tecnicos')]);
    title.textContent = `#${c.id} · ${c.titulo}`;
    $('#detalhe-data').textContent = `Aberto em ${formatDate(c.dataAbertura)}`;
    const badge = $('#detalhe-status'); badge.textContent = statusLabel(c.status); badge.className = `badge ${badgeClass(c.status)}`;
    $('#detalhe-descricao').textContent = c.descricao;
    $('#detalhe-cliente').textContent = c.clienteNome;
    $('#detalhe-categoria').textContent = c.categoriaNome;
    $('#detalhe-prioridade').textContent = c.prioridade;
    $('#detalhe-prioridade').className = `priority ${priorityClass(c.prioridade)}`;
    $('#detalhe-tecnico').textContent = c.tecnicoNome || '—';
    const timeline = $('#comentarios-lista');
    timeline.innerHTML = comments.map(x => `<div class="event"><small>${formatDate(x.data)} · ${escapeHtml(x.autor)}</small><p>${escapeHtml(x.texto)}</p></div>`).join('') || '<p class="muted">Nenhum comentário registrado.</p>';
    $('#acao-status').value = c.status;
    $('#acao-status').disabled = c.status === 'FECHADO';
    const tech = $('#acao-tecnico');
    tech.innerHTML = tecnicos.map(t => `<option value="${t.id}" ${t.id===c.tecnicoId?'selected':''}>${escapeHtml(t.nome)}</option>`).join('');
    tech.disabled = c.status === 'FECHADO';
    $('#salvar-acoes').disabled = c.status === 'FECHADO';
    $('#salvar-acoes').addEventListener('click', async () => {
      try {
        if (Number(tech.value) !== c.tecnicoId) await api(`/chamados/${id}/atribuir`,{method:'PATCH',body:JSON.stringify({tecnicoId:Number(tech.value)})});
        if ($('#acao-status').value !== c.status) await api(`/chamados/${id}/status`,{method:'PATCH',body:JSON.stringify({status:$('#acao-status').value})});
        notify('Chamado atualizado com sucesso.'); location.reload();
      } catch (e) { showError(e); }
    });
    $('#enviar-comentario').addEventListener('click', async () => {
      const texto = $('#comentario-texto').value.trim();
      if (!texto) return notify('Digite um comentário antes de enviar.','error');
      const autor = prompt('Informe o nome do autor do comentário:');
      if (!autor?.trim()) return;
      try { await api(`/chamados/${id}/comentarios`,{method:'POST',body:JSON.stringify({texto,autor:autor.trim()})}); notify('Comentário registrado.'); location.reload(); }
      catch (e) { showError(e); }
    });
  } catch (e) { title.textContent = 'Não foi possível carregar o chamado'; showError(e); }
}
async function loadClientes() {
  const tbody=$('#clientes-tbody'); if(!tbody)return;
  try { clientesCache=await api('/clientes'); renderClientes(); } catch(e){showError(e);}
}
function renderClientes(){
  const tbody=$('#clientes-tbody'); if(!tbody)return;
  const q=($('#busca-cliente')?.value||'').toLowerCase();
  const rows=clientesCache.filter(c=>`${c.nome} ${c.email}`.toLowerCase().includes(q));
  tbody.innerHTML=rows.map(c=>`<tr><td><strong>${escapeHtml(c.nome)}</strong></td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.telefone||'—')}</td><td>—</td><td><button class="link-button" data-edit="${c.id}">Editar</button> · <button class="link-button danger" data-delete="${c.id}">Excluir</button></td></tr>`).join('')||emptyRow(5,'Nenhum cliente cadastrado.');
}
async function initClientes(){
  if(!$('#form-cliente'))return;
  await loadClientes(); $('#busca-cliente')?.addEventListener('input',renderClientes);
  $('#form-cliente').addEventListener('submit',async e=>{e.preventDefault();const payload={nome:$('#cliente-nome').value.trim(),email:$('#cliente-email').value.trim(),telefone:$('#cliente-telefone').value.trim()};try{await api('/clientes',{method:'POST',body:JSON.stringify(payload)});notify('Cliente cadastrado.');e.target.reset();loadClientes();}catch(err){showError(err);}});
  $('#clientes-tbody').addEventListener('click',async e=>{const del=e.target.closest('[data-delete]');const edit=e.target.closest('[data-edit]');if(del){if(!confirm('Deseja excluir este cliente?'))return;try{await api(`/clientes/${del.dataset.delete}`,{method:'DELETE'});notify('Cliente excluído.');loadClientes();}catch(err){showError(err);}}if(edit){const c=clientesCache.find(x=>x.id===Number(edit.dataset.edit));if(!c)return;const nome=prompt('Nome:',c.nome);if(nome===null)return;const email=prompt('E-mail:',c.email);if(email===null)return;const telefone=prompt('Telefone:',c.telefone||'');try{await api(`/clientes/${c.id}`,{method:'PUT',body:JSON.stringify({nome,email,telefone})});notify('Cliente atualizado.');loadClientes();}catch(err){showError(err);}}});
}
async function loadCategorias(){const tbody=$('#categorias-tbody');if(!tbody)return;try{categoriasCache=await api('/categorias');renderCategorias();}catch(e){showError(e);}}
function renderCategorias(){const tbody=$('#categorias-tbody');if(!tbody)return;tbody.innerHTML=categoriasCache.map(c=>`<tr><td><strong>${escapeHtml(c.nome)}</strong></td><td>${escapeHtml(c.descricao||'—')}</td><td>—</td><td><button class="link-button" data-edit="${c.id}">Editar</button> · <button class="link-button danger" data-delete="${c.id}">Excluir</button></td></tr>`).join('')||emptyRow(4,'Nenhuma categoria cadastrada.');}
async function initCategorias(){if(!$('#form-categoria'))return;await loadCategorias();$('#form-categoria').addEventListener('submit',async e=>{e.preventDefault();try{await api('/categorias',{method:'POST',body:JSON.stringify({nome:$('#categoria-nome').value.trim(),descricao:$('#categoria-descricao').value.trim()})});notify('Categoria cadastrada.');e.target.reset();loadCategorias();}catch(err){showError(err);}});$('#categorias-tbody').addEventListener('click',async e=>{const del=e.target.closest('[data-delete]'),edit=e.target.closest('[data-edit]');if(del){if(!confirm('Deseja excluir esta categoria?'))return;try{await api(`/categorias/${del.dataset.delete}`,{method:'DELETE'});notify('Categoria excluída.');loadCategorias();}catch(err){showError(err);}}if(edit){const c=categoriasCache.find(x=>x.id===Number(edit.dataset.edit));const nome=prompt('Nome:',c.nome);if(nome===null)return;const descricao=prompt('Descrição:',c.descricao||'');if(descricao===null)return;try{await api(`/categorias/${c.id}`,{method:'PUT',body:JSON.stringify({nome,descricao})});notify('Categoria atualizada.');loadCategorias();}catch(err){showError(err);}}});}
async function loadTecnicos(){const tbody=$('#tecnicos-tbody');if(!tbody)return;try{tecnicosCache=await api('/tecnicos');renderTecnicos();}catch(e){showError(e);}}
function renderTecnicos(){const tbody=$('#tecnicos-tbody');if(!tbody)return;tbody.innerHTML=tecnicosCache.map(t=>`<tr><td><strong>${escapeHtml(t.nome)}</strong></td><td>${escapeHtml(t.email)}</td><td><span class="badge ${t.perfil==='ADMIN'?'b-green':'b-blue'}">${t.perfil}</span></td><td>—</td><td><button class="link-button" data-edit="${t.id}">Editar</button> · <button class="link-button danger" data-delete="${t.id}">Excluir</button></td></tr>`).join('')||emptyRow(5,'Nenhum técnico cadastrado.');}
async function initTecnicos(){if(!$('#form-tecnico'))return;await loadTecnicos();$('#form-tecnico').addEventListener('submit',async e=>{e.preventDefault();try{await api('/tecnicos',{method:'POST',body:JSON.stringify({nome:$('#tecnico-nome').value.trim(),email:$('#tecnico-email').value.trim(),perfil:$('#tecnico-perfil').value})});notify('Técnico cadastrado.');e.target.reset();loadTecnicos();}catch(err){showError(err);}});$('#tecnicos-tbody').addEventListener('click',async e=>{const del=e.target.closest('[data-delete]'),edit=e.target.closest('[data-edit]');if(del){if(!confirm('Deseja excluir este técnico?'))return;try{await api(`/tecnicos/${del.dataset.delete}`,{method:'DELETE'});notify('Técnico excluído.');loadTecnicos();}catch(err){showError(err);}}if(edit){const t=tecnicosCache.find(x=>x.id===Number(edit.dataset.edit));const nome=prompt('Nome:',t.nome);if(nome===null)return;const email=prompt('E-mail:',t.email);if(email===null)return;const perfil=prompt('Perfil (ADMIN ou TECNICO):',t.perfil);if(perfil===null)return;try{await api(`/tecnicos/${t.id}`,{method:'PUT',body:JSON.stringify({nome,email,perfil:perfil.toUpperCase()})});notify('Técnico atualizado.');loadTecnicos();}catch(err){showError(err);}}});}

document.addEventListener('DOMContentLoaded',()=>{
  const path=location.pathname;
  if(path.endsWith('/index.html')||path.endsWith('/')) loadDashboard();
  if(path.endsWith('/chamados.html')) {
    loadChamados();
    ['#filtro-status','#filtro-prioridade','#filtro-cliente'].forEach(s=>$(s)?.addEventListener('change',()=>{paginaAtual=0;loadChamados();}));
    $('#filtro-busca')?.addEventListener('input',loadChamados);
    $('#pagina-anterior')?.addEventListener('click',()=>{if(paginaAtual>0){paginaAtual--;loadChamados();}});
    $('#pagina-proxima')?.addEventListener('click',()=>{if(paginaAtual<totalPaginas-1){paginaAtual++;loadChamados();}});
  }
  initChamadoForm(); initDetalhe(); initClientes(); initCategorias(); initTecnicos();
});
