let searchData = null;
let currentJobId = null;
let pollInterval = null;
let captchaResolvendo = false;

const ORGAOS_ORDEM = ['Receita Federal', 'TRF1', 'TJDFT'];

/* CPF mask */
document.getElementById('cpf').addEventListener('input', function () {
  const cursor = this.selectionStart;
  const lenBefore = this.value.length;
  const digits = this.value.replace(/\D/g, '').slice(0, 11);
  let formatted = digits;
  if (digits.length > 3) formatted = `${digits.slice(0,3)}.${digits.slice(3)}`;
  if (digits.length > 6) formatted = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
  if (digits.length > 9) formatted = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  this.value = formatted;
  const lenAfter = this.value.length;
  this.setSelectionRange(cursor + (lenAfter - lenBefore), cursor + (lenAfter - lenBefore));
});

document.getElementById('captchaInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') confirmarCaptcha();
});

/* Helpers */
function showError(inputId, errorId) {
  document.getElementById(inputId).classList.add('error');
  document.getElementById(errorId).classList.add('visible');
}

function clearErrors() {
  document.querySelectorAll('.form-group input').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.error-text').forEach(el => el.classList.remove('visible'));
}

function validateForm() {
  clearErrors();
  let valid = true;
  if (!document.getElementById('nome').value.trim()) { showError('nome', 'nomeError'); valid = false; }
  if (document.getElementById('cpf').value.replace(/\D/g, '').length !== 11) { showError('cpf', 'cpfError'); valid = false; }
  if (!document.getElementById('dataNasc').value) { showError('dataNasc', 'dataNascError'); valid = false; }
  if (!document.getElementById('nomeMae').value.trim()) { showError('nomeMae', 'nomeMaeError'); valid = false; }
  const email = document.getElementById('email').value.trim();
  if (!email || !email.includes('@')) { showError('email', 'emailError'); valid = false; }
  return valid;
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* Start search */
async function startSearch() {
  if (!validateForm()) return;

  searchData = {
    nome: document.getElementById('nome').value.trim(),
    cpf: document.getElementById('cpf').value,
    dataNascimento: document.getElementById('dataNasc').value,
    nomeMae: document.getElementById('nomeMae').value.trim(),
    nomePai: document.getElementById('nomePai').value.trim() || undefined,
    email: document.getElementById('email').value.trim(),
  };

  document.getElementById('btnBuscar').disabled = true;
  document.getElementById('btnBuscar').innerHTML = '<span class="spinner"></span> Iniciando...';

  captchaResolvendo = false;
  document.getElementById('captchaContainer').style.display = 'none';

  showSection('sectionProcessing');
  initProcessingUI();

  try {
    const res = await fetch('/api/consultar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchData),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Erro ao iniciar consulta');
      resetApp();
      return;
    }

    const data = await res.json();
    currentJobId = data.jobId;
    startPolling();
  } catch (err) {
    alert('Erro de conexão com o servidor');
    resetApp();
  }
}

/* Processing UI */
function initProcessingUI() {
  const list = document.getElementById('statusList');
  list.innerHTML = '';
  ORGAOS_ORDEM.forEach((nome, i) => {
    const div = document.createElement('div');
    div.className = 'status-item pending';
    div.id = `status-${i}`;
    div.innerHTML = `<div class="status-icon">○</div><span>${nome}</span>`;
    list.appendChild(div);
  });
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('processingSubtext').textContent = 'Iniciando conexões...';
}

function updateProcessingUI(resultados) {
  const total = ORGAOS_ORDEM.length;
  let doneCount = 0;

  ORGAOS_ORDEM.forEach((nome, i) => {
    const item = document.getElementById(`status-${i}`);
    if (!item) return;

    const res = resultados.find(r => r.orgao === nome);
    if (!res) {
      item.className = 'status-item pending';
      item.querySelector('.status-icon').textContent = '○';
      return;
    }

    doneCount++;
    if (res.status === 'success') {
      item.className = 'status-item success';
      item.querySelector('.status-icon').textContent = '✓';
    } else if (res.status === 'captcha_required') {
      item.className = 'status-item running';
      item.querySelector('.status-icon').textContent = '!';
    } else {
      item.className = 'status-item error';
      item.querySelector('.status-icon').textContent = '✕';
    }
  });

  const pct = Math.min((doneCount / total) * 100, 100);
  document.getElementById('progressFill').style.width = `${pct}%`;

  if (!captchaResolvendo && doneCount < total) {
    const nextNome = ORGAOS_ORDEM[doneCount];
    document.getElementById('processingSubtext').textContent = `Consultando ${nextNome}...`;
  } else if (doneCount >= total && !captchaResolvendo) {
    document.getElementById('processingSubtext').textContent = 'Consultas concluídas!';
  }
}

/* Forçar continuar mesmo se CAPTCHA não detectado */
async function forcarContinuar() {
  const btn = document.getElementById('btnJaResolvi');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Forçando...';
  }

  try {
    const res = await fetch(`/api/consultar/${currentJobId}/captcha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chave: document.getElementById('captchaChave').value,
        solution: 'resolved',
      }),
    });

    const data = await res.json();
    if (data.resolved) {
      document.getElementById('captchaContainer').style.display = 'none';
      captchaResolvendo = false;
      document.getElementById('processingSubtext').textContent = 'CAPTCHA resolvido, continuando...';
    } else {
      alert('Não foi possível forçar continuação. Tente resolver o CAPTCHA primeiro.');
    }
  } catch (err) {
    alert('Erro de conexão ao forçar continuação');
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Já resolvi, continuar';
  }
}

/* Retry */
async function retryFalhos() {
  if (!currentJobId) return;

  const btn = document.getElementById('btnRetryFalhos');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Tentando novamente...';

  try {
    const res = await fetch(`/api/consultar/${currentJobId}/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Erro ao tentar novamente');
      btn.disabled = false;
      btn.textContent = 'Tentar novamente órgãos com falha';
      return;
    }

    showSection('sectionProcessing');
    initProcessingUI();
    startPolling();
  } catch (err) {
    alert('Erro de conexão ao tentar novamente');
    btn.disabled = false;
    btn.textContent = 'Tentar novamente órgãos com falha';
  }
}

/* CAPTCHA handler */
function showCaptcha(captchaInfo) {
  captchaResolvendo = true;
  const container = document.getElementById('captchaContainer');
  const img = document.getElementById('captchaImage');
  const desc = document.getElementById('captchaDesc');
  const input = document.getElementById('captchaInput');
  const btn = document.getElementById('btnCaptcha');
  const linkArea = document.getElementById('captchaLinkArea');

  document.getElementById('captchaChave').value = captchaInfo.chave;
  document.getElementById('captchaOrgao').value = captchaInfo.orgao;

  const isInteractive = captchaInfo.tipo === 'hcaptcha' || captchaInfo.tipo === 'recaptcha';

  if (isInteractive) {
    img.style.display = 'none';
    input.style.display = 'none';
    document.getElementById('captchaLabel').style.display = 'none';
    linkArea.style.display = 'block';

    desc.innerHTML = `
      <p>O sistema do(a) <strong>${captchaInfo.orgao}</strong> exige verificação de segurança.</p>
      <p style="margin-top:12px;font-weight:600">✅ Uma janela do navegador foi aberta com o site do ${captchaInfo.orgao}.</p>
      <ol style="text-align:left;margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.8">
        <li><strong>Vá até a janela do navegador que abriu</strong> (pode estar atrás desta janela)</li>
        <li>Resolva o CAPTCHA de segurança que aparecer na tela</li>
        <li>Após resolver, volte para esta janela e clique em <strong>Continuar</strong></li>
      </ol>
    `;

    btn.textContent = 'Continuar';
    btn.disabled = false;
  } else {
    img.style.display = 'block';
    input.style.display = 'block';
    img.src = captchaInfo.captchaUrl + '?t=' + Date.now();
    document.getElementById('captchaLabel').style.display = 'block';
    document.getElementById('captchaLabel').textContent = 'Digite os caracteres';
    input.placeholder = '';
    desc.innerHTML = `<p><strong>${captchaInfo.orgao}</strong> exige verificação de segurança. Uma janela do navegador foi aberta com o site. Se preferir, digite os caracteres exibidos na imagem abaixo.</p>`;
    input.value = '';
    input.focus();
    btn.textContent = 'Confirmar';
    document.getElementById('captchaLinkArea').style.display = 'none';
  }

  document.getElementById('captchaForceRow').style.display = 'flex';

  container.style.display = 'block';
  document.getElementById('processingSubtext').textContent = `Aguardando resolução de CAPTCHA — ${captchaInfo.orgao}`;
}

async function confirmarCaptcha() {
  const btn = document.getElementById('btnCaptcha');
  const input = document.getElementById('captchaInput');
  const solution = input.value.trim() || 'continue';

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Validando...';

  try {
    const res = await fetch(`/api/consultar/${currentJobId}/captcha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave: document.getElementById('captchaChave').value, solution }),
    });

    const data = await res.json();

    if (data.resolved) {
      document.getElementById('captchaContainer').style.display = 'none';
      captchaResolvendo = false;
      document.getElementById('processingSubtext').textContent = 'CAPTCHA resolvido, continuando...';
    } else {
      alert('Erro ao enviar CAPTCHA. Tente novamente.');
    }
  } catch (err) {
    alert('Erro de conexão ao enviar CAPTCHA');
  }

  btn.disabled = false;
  btn.textContent = 'Continuar';
}

/* Polling */
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);

  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/consultar/${currentJobId}`);
      const job = await res.json();

      updateProcessingUI(job.resultados);

      if (job.captchaPendente && job.captchaPendente.length > 0 && !captchaResolvendo) {
        showCaptcha(job.captchaPendente[0]);
      }

      if (job.status === 'complete') {
        clearInterval(pollInterval);
        pollInterval = null;
        document.getElementById('captchaContainer').style.display = 'none';
        showResults(job);
      }
    } catch (e) {
      console.error('Poll error:', e);
    }
  }, 1000);
}

/* Results */
function showResults(job) {
  const list = document.getElementById('resultsList');
  const foundCount = document.getElementById('foundCount');
  const pendingCount = document.getElementById('pendingCount');
  const subtext = document.getElementById('resultsSubtext');

  const nome = job.dados.nome.split(' ')[0];
  list.innerHTML = '';

  const successCount = job.resultados.filter(r => r.status === 'success').length;
  const pendingTotal = job.resultados.filter(r => r.status !== 'success').length;

  job.resultados.forEach(res => {
    const card = document.createElement('div');
    card.className = 'certificate-card';
    card.style.animation = 'fadeIn 0.3s ease';

    let badge, btns, errorHtml = '';

    if (res.status === 'success') {
      badge = '<span class="badge-status badge-success">✓ Emitida</span>';
      btns = `<div class="btn-group">
        <button class="btn btn-secondary" onclick="visualizarDoc('${res.documentoId}')">Visualizar</button>
        <button class="btn btn-primary" onclick="baixarDoc('${res.documentoId}')">Baixar PDF</button>
      </div>`;
    } else if (res.status === 'captcha_required') {
      badge = '<span class="badge-status badge-warning">! CAPTCHA</span>';
      btns = '<p style="font-size:13px;color:var(--text-muted);">CAPTCHA não pôde ser resolvido</p>';
      errorHtml = `<p class="error-detail">${res.error || 'Resolução de CAPTCHA necessária'}</p>`;
    } else {
      badge = '<span class="badge-status badge-error">✕ Indisponível</span>';
      btns = '<p style="font-size:13px;color:var(--text-muted);">Órgão sem resposta no momento</p>';
      errorHtml = `<p class="error-detail">${res.error || 'Erro na conexão com o órgão'}</p>`;
    }

    card.innerHTML = `
      <div class="certificate-card-header">
        <div>
          <h4>${res.orgao}</h4>
          <p class="cert-sub">${res.status === 'success' ? 'Certidão emitida' : 'Consulta não concluída'}</p>
        </div>
        ${badge}
      </div>
      ${btns}
      ${res.protocolo ? `<p class="protocolo-text">Protocolo: ${res.protocolo}</p>` : ''}
      ${errorHtml}
    `;

    list.appendChild(card);
  });

  foundCount.textContent = successCount;
  pendingCount.textContent = pendingTotal;
  subtext.textContent = `${nome}, concluímos as consultas nos órgãos oficiais.`;

  const retryBtn = document.getElementById('btnRetryFalhos');
  const hasFailures = job.resultados.some(r => r.status !== 'success');
  if (retryBtn) {
    retryBtn.style.display = hasFailures ? 'block' : 'none';
  }

  showSection('sectionResults');
}

/* Document actions */
function visualizarDoc(docId) {
  if (!docId) return;
  window.open(`/api/documentos/${docId}`, '_blank');
}

function baixarDoc(docId) {
  if (!docId) return;
  const link = document.createElement('a');
  link.href = `/api/documentos/${docId}`;
  link.download = `${docId}.pdf`;
  link.click();
}

/* Dossier */
async function gerarDossie() {
  if (!currentJobId) return;

  document.getElementById('btnDossie').disabled = true;
  document.getElementById('btnDossie').innerHTML = '<span class="spinner"></span> Gerando dossiê...';

  try {
    const res = await fetch(`/api/consultar/${currentJobId}`);
    const job = await res.json();

    const preview = document.getElementById('dossierPreview');
    const dataNasc = new Date(job.dados.dataNascimento).toLocaleDateString('pt-BR');
    const successCount = job.resultados.filter(r => r.status === 'success').length;

    preview.innerHTML = `
      <h3>Dossiê Consolidado</h3>
      <div class="dossier-field">
        <span class="dossier-field-label">Proprietário</span>
        <span class="dossier-field-value">${job.dados.nome}</span>
      </div>
      <div class="dossier-field">
        <span class="dossier-field-label">CPF</span>
        <span class="dossier-field-value">${job.dados.cpf}</span>
      </div>
      <div class="dossier-field">
        <span class="dossier-field-label">Data de Nascimento</span>
        <span class="dossier-field-value">${dataNasc}</span>
      </div>
      <div class="dossier-field">
        <span class="dossier-field-label">Nome da Mãe</span>
        <span class="dossier-field-value">${job.dados.nomeMae}</span>
      </div>
      <div class="dossier-field">
        <span class="dossier-field-label">E-mail</span>
        <span class="dossier-field-value">${job.dados.email}</span>
      </div>
      <div class="dossier-field">
        <span class="dossier-field-label">Data da Consulta</span>
        <span class="dossier-field-value">${new Date().toLocaleDateString('pt-BR')}</span>
      </div>
      <div class="dossier-certificates">
        <h4>Certidões Inclusas (${successCount} de ${job.resultados.length})</h4>
        ${job.resultados.map(r => {
          const ok = r.status === 'success';
          return `<div class="dossier-cert-item">
            <span class="check ${ok ? 'success' : 'error'}">${ok ? '✓' : '○'}</span>
            <span>${r.orgao} — ${ok ? 'Inclusa' : r.status === 'captcha_required' ? 'CAPTCHA' : 'Indisponível'}</span>
          </div>`;
        }).join('')}
      </div>
    `;

    showSection('sectionDossier');
  } catch (err) {
    alert('Erro ao gerar dossiê');
  }

  document.getElementById('btnDossie').disabled = false;
  document.getElementById('btnDossie').textContent = 'Baixar Dossiê Consolidado';
}

async function baixarDossie() {
  if (!currentJobId) return;
  const link = document.createElement('a');
  link.href = `/api/dossie/${currentJobId}`;
  link.download = `dossie_donnos.pdf`;
  link.click();
}

/* Reset */
function resetApp() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  searchData = null;
  currentJobId = null;
  captchaResolvendo = false;
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('captchaContainer').style.display = 'none';
  document.getElementById('btnBuscar').disabled = false;
  document.getElementById('btnBuscar').innerHTML = 'Gerar Dossiê';
  showSection('sectionForm');
}
