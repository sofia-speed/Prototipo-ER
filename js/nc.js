var ncs = [];
var acs = [];
var contador = 1;
var contadorAC = 1;
var ncSelecionada = null;

window.onload = function () {
    carregarStorage();
    mostrarNCs();

    var dateControl = document.getElementById('ncData');
    if (dateControl) dateControl.valueAsDate = new Date();

    // --- SEGURANÇA VISUAL ---
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    var btnNovaNC = document.querySelector('button[data-bs-target="#modalNovaNC"]');

    if (utilizadorLogado) {
        if (utilizadorLogado.tipo === 'Utilizador Básico' || utilizadorLogado.tipo === 'Auditor Interno') {
            if (btnNovaNC) btnNovaNC.style.display = 'none';
        }
    }

    configurarModalNovaNC();
    configurarModalNovaAC();
};

function configurarModalNovaNC() {
    var modal = document.getElementById('modalNovaNC');
    var selectArea = document.getElementById('ncArea');
    var selectResp = document.getElementById('ncResponsavel');

    if (!modal) return;

    modal.addEventListener('show.bs.modal', function () {
        var user = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
        document.getElementById('formNovaNC').reset();
        document.getElementById('ncData').valueAsDate = new Date();

        var isAdminOrQuality = (user.tipo === 'AdminWeb' || user.tipo === 'Gestão da Qualidade');

        if (isAdminOrQuality) {
            selectArea.disabled = false;
            selectArea.value = "";
            selectResp.innerHTML = '<option value="">Selecione a Área primeiro...</option>';
            selectArea.onchange = function () {
                atualizarSelectResponsavelPorArea(this.value);
            };
        } else {
            selectArea.value = user.departamento;
            selectArea.disabled = true;
            atualizarSelectResponsavelPorArea(user.departamento);
        }
    });
}

function configurarModalNovaAC() {
    var modalAC = document.getElementById('modalNovaAC');
    if (!modalAC) return;

    modalAC.addEventListener('show.bs.modal', function () {
        var ncId = document.getElementById('ac_ncId').value;
        var ncOrigem = ncs.find(n => n.id === ncId);
        if (ncOrigem) {
            atualizarSelectResponsavelPorArea(ncOrigem.area, 'ac_responsavel');
        }
    });
}

function carregarStorage() {
    var dados_ncs = localStorage.getItem('ncs');
    var dados_acs = localStorage.getItem('acs');
    if (dados_ncs) {
        ncs = JSON.parse(dados_ncs);
        var cont = localStorage.getItem('contador');
        if (cont) contador = parseInt(cont);
    } else {
        ncs = [];
        contador = 1;
    }
    if (dados_acs) {
        acs = JSON.parse(dados_acs);
        var contAC = localStorage.getItem('contadorAC');
        if (contAC) contadorAC = parseInt(contAC);
    } else {
        acs = [];
        contadorAC = 1;
    }
    guardarStorage();
}

function guardarStorage() {
    localStorage.setItem('ncs', JSON.stringify(ncs));
    localStorage.setItem('acs', JSON.stringify(acs));
    localStorage.setItem('contador', contador);
    localStorage.setItem('contadorAC', contadorAC);
}

function atualizarSelectResponsavelPorArea(area, selectId) {
    var idDoCampo = selectId || 'ncResponsavel';
    var select = document.getElementById(idDoCampo);

    if (!select) return;

    select.innerHTML = '<option value="">Selecione...</option>';
    if (!area) return;

    var users = JSON.parse(localStorage.getItem('utilizadores')) || [];
    var responsaveisFiltrados = users.filter(u =>
        u.tipo === 'Responsável de Área' && u.departamento === area
    );

    if (responsaveisFiltrados.length === 0) {
        var opt = document.createElement('option');
        opt.text = "(Nenhum responsável encontrado nesta área)";
        opt.disabled = true;
        select.appendChild(opt);
    } else {
        responsaveisFiltrados.forEach(u => {
            var opt = document.createElement('option');
            opt.value = u.nome;
            opt.text = u.nome;
            select.appendChild(opt);
        });
    }
}

function mostrarNCs() {
    var tbody = document.getElementById("tabelaNCs");
    tbody.innerHTML = '';

    var filtroEstado = document.getElementById("filtroEstado").value;
    var filtroPesquisa = document.getElementById("filtroPesquisa").value.toLowerCase();

    for (var i = 0; i < ncs.length; i++) {
        var nc = ncs[i];

        if (!temPermissaoDeVisualizar(nc.area)) continue;

        if (filtroEstado && nc.estado != filtroEstado) continue;
        if (filtroPesquisa && !nc.titulo.toLowerCase().includes(filtroPesquisa)) continue;

        var tr = document.createElement('tr');
        var textoEstado = nc.estado == 'aberta' ? 'Aberta' : (nc.estado == 'analise' ? 'Em Análise' : 'Encerrada');

        tr.innerHTML = '<td><strong>' + nc.id + '</strong></td>' +
            '<td>' + nc.titulo + '</td>' +
            '<td>' + nc.area + '</td>' +
            '<td>' + nc.responsavel + '</td>' +
            '<td>' + nc.data.split('-').reverse().join('/') + '</td>' +
            '<td><span>' + textoEstado + '</span></td>' +
            '<td><button class="btn btn-sm btn-primary" onclick="verDetalhes(' + i + ')"><i class="bi bi-eye"></i></button></td>';
        tbody.appendChild(tr);
    }
}

document.getElementById('btnGuardarNC').onclick = function () {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    var selectArea = document.getElementById('ncArea');
    var area = selectArea.value;

    if (utilizadorLogado.tipo === 'Auditor Interno') { alert("Auditores não podem criar NCs."); return; }
    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado."); return;
    }

    var titulo = document.getElementById('ncTitulo').value;
    var desc = document.getElementById('ncDescricao').value;
    var resp = document.getElementById('ncResponsavel').value;
    var prio = document.getElementById('ncPrioridade').value;
    var data = document.getElementById('ncData').value;

    if (!titulo || !desc || !area || !resp || !data) {
        alert('Preencha todos os campos obrigatórios.'); return;
    }

    var id = 'NC' + ('000' + contador).slice(-4);
    var novaNC = {
        id: id, titulo: titulo, descricao: desc, area: area, responsavel: resp,
        responsavelId: utilizadorLogado.id, prioridade: prio, data: data, estado: 'aberta',
        historico: [id + ' : Aberta em ' + new Date().toLocaleDateString('pt-PT')]
    };

    ncs.push(novaNC);
    contador++;
    guardarStorage();
    mostrarNCs();

    bootstrap.Modal.getInstance(document.getElementById('modalNovaNC')).hide();
};

document.getElementById('btnGuardarAC').onclick = function () {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo === 'Auditor Interno') { alert("Auditores não podem criar ACs."); return; }
    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado."); return;
    }

    var ncId = document.getElementById('ac_ncId').value;
    var ncOrigem = ncs.find(n => n.id === ncId);

    if (ncOrigem) {
        var temAcessoTotal = (utilizadorLogado.tipo === 'AdminWeb' || utilizadorLogado.tipo === 'Gestão da Qualidade');
        var temAcessoArea = (utilizadorLogado.tipo === 'Responsável de Área' && utilizadorLogado.departamento === ncOrigem.area);

        if (!temAcessoTotal && !temAcessoArea) {
            alert("Acesso Negado."); return;
        }
    } else {
        alert("Erro: NC não encontrada."); return;
    }

    var descricao = document.getElementById('ac_descricao').value;
    var responsavel = document.getElementById('ac_responsavel').value;
    var prazo = document.getElementById('ac_prazo').value;
    var estado = document.getElementById('ac_estado').value;
    var eficaciaAuditada = document.getElementById('ac_eficacia').value;

    if (!ncId || !descricao || !responsavel || !prazo) { alert('Preencha os campos obrigatórios.'); return; }

    var id = 'AC' + ('000' + contadorAC).slice(-4);
    var novaAC = {
        id: id, ncId: ncId, descricao: descricao, responsavel: responsavel,
        data_inicio: new Date().toLocaleDateString('pt-PT'), prazo: prazo, estado: estado,
        eficacia_auditada: eficaciaAuditada,
        historico: [id + ' : Criada em ' + new Date().toLocaleDateString('pt-PT')]
    };

    acs.push(novaAC);
    contadorAC++;
    guardarStorage();
    document.getElementById('formNovaAC').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalNovaAC')).hide();
    alert('Ação Corretiva criada com sucesso!');
    if (ncSelecionada !== null) verDetalhes(ncSelecionada);
};

// --- FUNÇÃO DETALHES (TABELA DE AÇÕES) ---
function verDetalhes(index) {
    ncSelecionada = index;
    var nc = ncs[index];
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    document.getElementById('detalheId').textContent = nc.id;
    document.getElementById('detalheTitulo').textContent = nc.titulo;
    document.getElementById('detalheDescricao').textContent = nc.descricao;
    document.getElementById('detalheArea').textContent = nc.area;
    document.getElementById('detalheResponsavel').textContent = nc.responsavel;
    document.getElementById('detalhePrioridade').textContent = nc.prioridade;
    document.getElementById('detalheData').textContent = nc.data.split('-').reverse().join('/');
    document.getElementById('detalheEstado').value = nc.estado;

    var historico = '';
    for (var i = 0; i < nc.historico.length; i++) {
        historico += '<li class="list-group-item">' + nc.historico[i] + '</li>';
    }
    document.getElementById('detalheHistorico').innerHTML = historico;
    document.getElementById('ac_ncId').value = nc.id;

    // --- CONTROLO DE BOTÕES DENTRO DO MODAL ---
    var btnAtualizarEstado = document.getElementById('btnAtualizarEstado');
    var btnCriarAC = document.querySelector('button[data-bs-target="#modalNovaAC"]');
    var selectEstado = document.getElementById('detalheEstado');

    if (utilizadorLogado.tipo === 'Auditor Interno') {
        if (btnAtualizarEstado) btnAtualizarEstado.style.display = 'none';
        if (btnCriarAC) btnCriarAC.style.display = 'none';
        if (selectEstado) selectEstado.disabled = true;
    } else {
        if (btnAtualizarEstado) btnAtualizarEstado.style.display = 'block';
        if (btnCriarAC) btnCriarAC.style.display = 'block';
        if (selectEstado) selectEstado.disabled = false;
    }

    var tabelaAcoes = document.getElementById('tabelaAcoes');
    tabelaAcoes.innerHTML = '';

    var acs_associadas = acs.filter(ac => ac.ncId == nc.id);

    if (acs_associadas.length > 0) {
        acs_associadas.forEach(ac => {
            var tr = document.createElement('tr');
            var botaoAcao = '-';

            // 1. ESTADO: EM EXECUÇÃO ou REABERTA
            // Quem pode concluir: Admin, Qualidade, ou Responsável da Área
            if (ac.estado === 'em_execucao' || ac.estado === 'reaberta') {
                if (utilizadorLogado.tipo === 'AdminWeb' ||
                    utilizadorLogado.tipo === 'Gestão da Qualidade' ||
                    (utilizadorLogado.tipo === 'Responsável de Área' && utilizadorLogado.departamento === nc.area)) {

                    botaoAcao = '<button class="btn btn-sm btn-success" onclick="finalizarAC(\'' + ac.id + '\')">Concluir</button>';
                } else {
                    botaoAcao = '<span class="text-muted">Em curso</span>';
                }
            }
            // 2. ESTADO: CONCLUÍDA
            // Quem pode auditar: Auditores e Qualidade
            // SÓ aparece se ainda não foi auditada (eficacia = pendente)
            else if (ac.estado === 'concluida') {
                if (ac.eficacia_auditada === 'pendente') {
                    if (utilizadorLogado.tipo === 'Auditor Interno' || utilizadorLogado.tipo === 'Auditor Externo' || utilizadorLogado.tipo === 'Gestão da Qualidade') {
                        botaoAcao = '<button class="btn btn-sm btn-warning" onclick="auditarAC(\'' + ac.id + '\')">Auditar</button>';
                    } else {
                        botaoAcao = '<span class="badge bg-success">Aguardando Auditoria</span>';
                    }
                } else {
                    // Se já foi auditada e está Concluída, significa que foi Eficaz.
                    // Não mostra botão nenhum, apenas o estado.
                    botaoAcao = '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Fechada (Eficaz)</span>';
                }
            }

            // Converter estado para texto legível
            var estadoTexto = ac.estado;
            if (ac.estado === 'em_execucao') estadoTexto = 'Em Execução';
            if (ac.estado === 'reaberta') estadoTexto = 'Reaberta (Ineficaz)';
            if (ac.estado === 'concluida') estadoTexto = 'Concluída';

            tr.innerHTML =
                '<td><strong>' + ac.id + '</strong></td>' +
                '<td>' + ac.descricao + '</td>' +
                '<td>' + ac.responsavel + '</td>' +
                '<td>' + ac.prazo.split('-').reverse().join('/') + '</td>' +
                '<td>' + estadoTexto + '</td>' +
                '<td>' + botaoAcao + '</td>';
            tabelaAcoes.appendChild(tr);
        });

        // Histórico Visual
        acs_associadas.forEach(ac => {
            if (ac.historico && ac.historico.length > 0) {
                ac.historico.forEach(h => {
                    var li = document.createElement('li');
                    li.className = 'list-group-item list-group-item-light';
                    li.innerHTML = '<small>' + h + '</small>'; // O h já traz o ID formatado
                    document.getElementById('detalheHistorico').appendChild(li);
                });
            }
        });

    } else {
        tabelaAcoes.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma ação corretiva associada.</td></tr>';
    }

    var modalEl = document.getElementById('modalDetalhesNC');
    if (!modalEl.classList.contains('show')) {
        new bootstrap.Modal(modalEl).show();
    }
}

document.getElementById('btnAtualizarEstado').onclick = function () {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    if (utilizadorLogado.tipo === 'Auditor Interno') return;

    var modal = document.getElementById("modalDetalhesNC");
    var bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (ncSelecionada == null) return;
    var novoEstado = document.getElementById("detalheEstado").value;
    var nc = ncs[ncSelecionada];
    if (nc.estado == novoEstado) return;
    if (!confirm("Confirmar alteração do estado?")) return;
    nc.estado = novoEstado;
    var texto = nc.estado == 'aberta' ? 'Aberta' : (nc.estado == 'analise' ? 'Em análise' : 'Encerrada');
    nc.historico.push(nc.id + ' : ' + texto + ' em ' + new Date().toLocaleDateString('pt-PT'));
    guardarStorage(); mostrarNCs(); bootstrapModal.hide();
};

// --- FUNÇÃO FINALIZAR (Atualizada com Permissões e Histórico) ---
function finalizarAC(acId) {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    var ac = acs.find(a => a.id === acId);
    if (!ac) return;

    // Buscar a NC Pai para verificar a área
    var ncPai = ncs.find(n => n.id === ac.ncId);

    // Permissões: Admin, Qualidade OU Responsável da Área Específica
    var permitido = false;
    if (utilizadorLogado.tipo === 'AdminWeb' || utilizadorLogado.tipo === 'Gestão da Qualidade') {
        permitido = true;
    } else if (utilizadorLogado.tipo === 'Responsável de Área' && ncPai && utilizadorLogado.departamento === ncPai.area) {
        permitido = true;
    }

    if (!permitido) {
        alert("Apenas a Gestão da Qualidade ou o Responsável da Área (" + (ncPai ? ncPai.area : '?') + ") podem concluir esta ação.");
        return;
    }

    if (!confirm("Confirmar finalização da Ação Corretiva?")) return;

    ac.estado = 'concluida';
    ac.eficacia_auditada = 'pendente'; // Fica pendente para o auditor ver

    if (!ac.historico) ac.historico = [];
    ac.historico.push(ac.id + " : Concluída por " + utilizadorLogado.nome + " em " + new Date().toLocaleDateString('pt-PT'));

    guardarStorage();
    if (ncSelecionada !== null) verDetalhes(ncSelecionada);
}

// --- FUNÇÃO AUDITAR (Atualizada: Automática e Formatação) ---
function auditarAC(acId) {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo !== 'Auditor Interno' && utilizadorLogado.tipo !== 'Auditor Externo' && utilizadorLogado.tipo !== 'Gestão da Qualidade') {
        alert("Apenas auditores ou gestão da qualidade podem auditar."); return;
    }

    var ac = acs.find(a => a.id === acId); if (!ac) return;
    if (ac.estado !== 'concluida') { alert("A ação ainda não está concluída."); return; }

    var efic = null;

    while (true) {
        efic = prompt("Avaliação da eficácia (Eficaz ou Ineficaz):");

        // Cancelar auditoria
        if (efic === null) {
            alert("Auditoria cancelada.");
            return;
        }

        // Normalizar (ignora maiúsculas/minúsculas e espaços)
        efic = efic.trim().toLowerCase();

        // Validação correta
        if (efic === 'eficaz' || efic === 'ineficaz') {
            break; // sai do loop
        }

        alert("Valor inválido.\nEscreva apenas 'Eficaz' ou 'Ineficaz'.");
    }

    // Formatar para guardar
    efic = efic.charAt(0).toUpperCase() + efic.slice(1);

    var coment = prompt("Comentário de auditoria:");
    if (!coment) return;

    ac.eficacia_auditada = efic; // Guarda o valor
    ac.comentario_auditoria = coment;

    if (!ac.historico) ac.historico = [];

    // FORMATO DO HISTÓRICO: {id} : Auditada como {valor} | {mensagem}
    var msgHistorico = ac.id + " : Auditada como " + efic + " | Comentário Auditoria: " + coment;
    ac.historico.push(msgHistorico);

    if (efic.toLowerCase() === 'ineficaz') {
        // REABERTURA AUTOMÁTICA
        ac.estado = 'reaberta';
        ac.eficacia_auditada = 'pendente'; // Volta a pendente para permitir nova conclusão futura

        ac.historico.push(ac.id + " : Reaberta automaticamente após auditoria ineficaz.");
        alert("Ação marcada como Ineficaz. Foi reaberta automaticamente para nova correção.");
    } else {
        alert("Auditoria registada. Ação encerrada com eficácia.");
    }

    guardarStorage();
    if (ncSelecionada !== null) verDetalhes(ncSelecionada);
}

document.getElementById('filtroEstado').onchange = mostrarNCs;
document.getElementById('filtroPesquisa').oninput = mostrarNCs;