var ncs = [];
var acs = [];
var contador = 1;
var contadorAC = 1;
var ncSelecionada = null;

window.onload = function () {
    carregarStorage();
    mostrarNCs();

    var dateControl = document.getElementById('ncData');
    if(dateControl) dateControl.valueAsDate = new Date();

    // --- SEGURANÇA VISUAL (Botão Nova NC) ---
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    var btnNovaNC = document.querySelector('button[data-bs-target="#modalNovaNC"]');
    
    if (utilizadorLogado) {
        // Se for Básico OU Auditor Interno, esconde o botão de criar NC
        if (utilizadorLogado.tipo === 'Utilizador Básico' || utilizadorLogado.tipo === 'Auditor Interno') {
            if(btnNovaNC) btnNovaNC.style.display = 'none';
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
            selectArea.onchange = function() {
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
        historico: [id + '- Aberta em ' + new Date().toLocaleDateString('pt-PT')]
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
        historico: [id + '- Criada em ' + new Date().toLocaleDateString('pt-PT')]
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
        if(btnAtualizarEstado) btnAtualizarEstado.style.display = 'none';
        if(btnCriarAC) btnCriarAC.style.display = 'none';
        if(selectEstado) selectEstado.disabled = true;
    } else {
        if(btnAtualizarEstado) btnAtualizarEstado.style.display = 'block';
        if(btnCriarAC) btnCriarAC.style.display = 'block';
        if(selectEstado) selectEstado.disabled = false;
    }

    var tabelaAcoes = document.getElementById('tabelaAcoes');
    tabelaAcoes.innerHTML = '';

    var acs_associadas = acs.filter(ac => ac.ncId == nc.id);

    if (acs_associadas.length > 0) {
        acs_associadas.forEach(ac => {
            var tr = document.createElement('tr');
            
            // Lógica para o botão de ação na tabela
            var botaoAcao = '-';
            
            if (ac.estado === 'concluida') {
                // Se estiver concluída, o Auditor (e admin/qualidade) pode auditar
                if (utilizadorLogado.tipo === 'Auditor Interno' || utilizadorLogado.tipo === 'Gestão da Qualidade' || utilizadorLogado.tipo === 'Auditor Externo') {
                    botaoAcao = '<button class="btn btn-sm btn-warning" onclick="auditarAC(\'' + ac.id + '\')">Auditar</button>';
                }
            } else if (ac.estado === 'em_execucao') {
                // Se estiver em execução, só quem não é auditor pode concluir
                if (utilizadorLogado.tipo !== 'Auditor Interno') {
                    botaoAcao = '<button class="btn btn-sm btn-success" onclick="finalizarAC(\'' + ac.id + '\')">Concluir</button>';
                }
            } else if (ac.estado === 'aguardando_reabertura') {
                // --- NOVO: Botão Reabrir ---
                // Auditor NÃO vê este botão (ele já fez o trabalho dele). Admin/Qualidade veem.
                if (utilizadorLogado.tipo === 'AdminWeb' || utilizadorLogado.tipo === 'Gestão da Qualidade') {
                    botaoAcao = '<button class="btn btn-sm btn-danger" style="background-color: #6f42c1; border-color: #6f42c1;" onclick="reabrirAC(\'' + ac.id + '\')">Reabrir AC</button>';
                } else {
                    botaoAcao = '<span class="badge bg-danger">Ineficaz - Aguarda Reabertura</span>';
                }
            }

            // Converter estado para texto legível na tabela
            var estadoTexto = ac.estado;
            if(ac.estado === 'em_execucao') estadoTexto = 'Em Execução';
            if(ac.estado === 'concluida') estadoTexto = 'Concluída';
            if(ac.estado === 'aguardando_reabertura') estadoTexto = 'Auditada (Ineficaz)';

            tr.innerHTML =
                '<td><strong>' + ac.id + '</strong></td>' +
                '<td>' + ac.descricao + '</td>' +
                '<td>' + ac.responsavel + '</td>' +
                '<td>' + ac.prazo.split('-').reverse().join('/') + '</td>' +
                '<td>' + estadoTexto + '</td>' +
                '<td>' + botaoAcao + '</td>';
            tabelaAcoes.appendChild(tr);
        });
        
        // Adiciona histórico das ACs ao histórico visual
        acs_associadas.forEach(ac => {
            if (ac.historico && ac.historico.length > 0) {
                ac.historico.forEach(h => {
                    var li = document.createElement('li');
                    li.className = 'list-group-item list-group-item-light';
                    li.innerHTML = '<small><strong>AC ' + ac.id + ':</strong> ' + h + '</small>';
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
    nc.historico.push(nc.id + ' - ' + texto + ' em ' + new Date().toLocaleDateString('pt-PT'));
    guardarStorage(); mostrarNCs(); bootstrapModal.hide();
};

function finalizarAC(acId) {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    if (utilizadorLogado.tipo !== 'Gestão da Qualidade' && utilizadorLogado.tipo !== 'AdminWeb') {
        alert("Apenas a Gestão da Qualidade pode finalizar ações."); return;
    }
    if (!confirm("Confirmar finalização?")) return;
    var ac = acs.find(a => a.id === acId); if (!ac) return;
    ac.estado = 'concluida'; 
    ac.eficacia_auditada = 'pendente';
    if (!ac.historico) ac.historico = [];
    ac.historico.push("Concluída em " + new Date().toLocaleDateString('pt-PT'));
    guardarStorage(); if (ncSelecionada !== null) verDetalhes(ncSelecionada);
}

// --- LÓGICA DE AUDITORIA ATUALIZADA ---
function auditarAC(acId) {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo !== 'Auditor Interno' && utilizadorLogado.tipo !== 'Auditor Externo' && utilizadorLogado.tipo !== 'Gestão da Qualidade') {
        alert("Apenas auditores ou gestão da qualidade podem auditar."); return;
    }

    var ac = acs.find(a => a.id === acId); if (!ac) return;
    if (ac.estado !== 'concluida') { alert("A ação ainda não está concluída."); return; }
    
    var efic = prompt("Avaliação da eficácia (Eficaz / Ineficaz):"); if (!efic) return;
    var coment = prompt("Comentário de auditoria:"); if (!coment) return;

    ac.eficacia_auditada = efic; 
    ac.comentario_auditoria = coment;
    
    if (!ac.historico) ac.historico = [];
    ac.historico.push("Auditada como " + efic + " | " + coment);

    if (efic.toLowerCase() === 'ineficaz') {
        // MUDANÇA: Não volta logo para 'em_execucao' ou 'reaberta'. 
        // Vai para um estado de espera, para que a gestão possa ver e clicar no botão "Reabrir".
        ac.estado = 'aguardando_reabertura'; 
        alert("Ação marcada como Ineficaz. O estado mudou para 'Aguardando Reabertura'. O gestor deverá reabrir a ação.");
    }

    guardarStorage(); 
    if (ncSelecionada !== null) verDetalhes(ncSelecionada);
}

// --- NOVA FUNÇÃO: REABRIR AC ---
function reabrirAC(acId) {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    // Apenas Gestão ou Admin reabrem (Auditor não mexe nisto)
    if (utilizadorLogado.tipo !== 'Gestão da Qualidade' && utilizadorLogado.tipo !== 'AdminWeb') {
        alert("Apenas a Gestão da Qualidade pode reabrir ações."); return;
    }

    var justificacao = prompt("Motivo da reabertura / Instruções para correção:");
    if (!justificacao) return;

    var ac = acs.find(a => a.id === acId);
    if (!ac) return;

    // Volta o estado para execução
    ac.estado = 'em_execucao';
    // Reinicia a auditoria para pendente (pois vai ser trabalhada de novo)
    ac.eficacia_auditada = 'pendente'; 
    
    if (!ac.historico) ac.historico = [];
    ac.historico.push("REABERTA - Justificação: " + justificacao + " (" + new Date().toLocaleDateString('pt-PT') + ")");

    guardarStorage();
    if (ncSelecionada !== null) verDetalhes(ncSelecionada);
    alert("Ação corretiva reaberta com sucesso. Voltou ao estado 'Em Execução'.");
}

document.getElementById('filtroEstado').onchange = mostrarNCs;
document.getElementById('filtroPesquisa').oninput = mostrarNCs;