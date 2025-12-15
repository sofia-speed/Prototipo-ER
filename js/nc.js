var ncs = [];
var acs = [];
var contador = 1;
var contadorAC = 1;
var ncSelecionada = null;

window.onload = function () {
    carregarStorage();
    mostrarNCs();

    // Configurar data atual
    var dateControl = document.getElementById('ncData');
    if(dateControl) dateControl.valueAsDate = new Date();

    // Lógica de Segurança Inicial (Esconder botão se for Básico)
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    var btnNovaNC = document.querySelector('button[data-bs-target="#modalNovaNC"]');
    
    if (utilizadorLogado && utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        if(btnNovaNC) btnNovaNC.style.display = 'none'; // Básico não vê o botão
    }

    // Configurar o comportamento do Modal ao abrir
    configurarModalNovaNC();
    configurarModalNovaAC();
};

function configurarModalNovaNC() {
    var modal = document.getElementById('modalNovaNC');
    var selectArea = document.getElementById('ncArea');
    var selectResp = document.getElementById('ncResponsavel');

    if (!modal) return;

    // Evento disparado sempre que o modal vai abrir
    modal.addEventListener('show.bs.modal', function () {
        var user = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
        
        // Resetar campos
        document.getElementById('formNovaNC').reset();
        document.getElementById('ncData').valueAsDate = new Date();

        // LÓGICA DE PERMISSÕES
        var isAdminOrQuality = (user.tipo === 'AdminWeb' || user.tipo === 'Gestão da Qualidade');

        if (isAdminOrQuality) {
            // ADMIN/QUALIDADE: Vê tudo, mexe em tudo
            selectArea.disabled = false;
            selectArea.value = ""; 
            selectResp.innerHTML = '<option value="">Selecione a Área primeiro...</option>';

            // Quando mudar a área, atualiza os responsáveis
            selectArea.onchange = function() {
                atualizarSelectResponsavelPorArea(this.value);
            };

        } else {
            // OUTROS USERS: Área fixa e bloqueada
            selectArea.value = user.departamento;
            selectArea.disabled = true; // Bloqueia o campo visualmente

            // Carrega imediatamente os responsáveis da área do user
            atualizarSelectResponsavelPorArea(user.departamento);
        }
    });
}

function configurarModalNovaAC() {
    var modalAC = document.getElementById('modalNovaAC');
    
    if (!modalAC) return;

    modalAC.addEventListener('show.bs.modal', function () {
        // 1. Descobrir qual é a NC associada
        var ncId = document.getElementById('ac_ncId').value;
        
        // 2. Encontrar os dados dessa NC (para saber a Área)
        var ncOrigem = ncs.find(n => n.id === ncId);

        if (ncOrigem) {
            console.log("A carregar responsáveis para a área: " + ncOrigem.area);
            
            // 3. Chamar a função de filtro enviando a Área da NC e o ID do select da AC
            atualizarSelectResponsavelPorArea(ncOrigem.area, 'ac_responsavel');
        } else {
            console.error("Erro: Não foi possível encontrar a NC origem.");
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

// Adicionado funcao de filtro
function atualizarSelectResponsavelPorArea(area, selectId) {
    // Se não for passado ID, assume o da NC por defeito
    var idDoCampo = selectId || 'ncResponsavel';
    var select = document.getElementById(idDoCampo);
    
    if (!select) return; // Segurança caso o campo não exista

    select.innerHTML = '<option value="">Selecione...</option>'; 

    if (!area) return; 

    var users = JSON.parse(localStorage.getItem('utilizadores')) || [];

    // Filtra: Apenas Responsáveis de Área QUE pertençam à Área selecionada
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
    
    // Como o campo pode estar disabled (bloqueado), temos de ir buscar o valor com cuidado
    var selectArea = document.getElementById('ncArea');
    var area = selectArea.value;

    // Proteção extra para Básico
    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
         alert("Acesso Negado.");
         return;
    }

    var titulo = document.getElementById('ncTitulo').value;
    var desc = document.getElementById('ncDescricao').value;
    var resp = document.getElementById('ncResponsavel').value; 
    var prio = document.getElementById('ncPrioridade').value;
    var data = document.getElementById('ncData').value;

    if (!titulo || !desc || !area || !resp || !data) {
        alert('Preencha todos os campos obrigatórios.');
        return;
    }

    var id = 'NC' + ('000' + contador).slice(-4);
    var novaNC = {
        id: id,
        titulo: titulo,
        descricao: desc,
        area: area,
        responsavel: resp,
        responsavelId: utilizadorLogado.id, 
        prioridade: prio,
        data: data,
        estado: 'aberta',
        historico: [id + '- Aberta em ' + new Date().toLocaleDateString('pt-PT')]
    };

    ncs.push(novaNC);
    contador++;
    guardarStorage();
    mostrarNCs();

    // Fechar modal
    var modalEl = document.getElementById('modalNovaNC');
    var modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
};

document.getElementById('btnGuardarAC').onclick = function () {
    console.log("Botão de Guardar Ação Corretiva clicado!");
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    // AC4.1 (1)
    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado: Apenas o departamento de gestão/responsáveis de qualidade podem gerir Ações Corretivas.");
        return;
    }

    var ncId = document.getElementById('ac_ncId').value;
    
    // AC4.1 (2)
    var ncOrigem = ncs.find(n => n.id === ncId);

    if (ncOrigem) {
        // Regra 1: AdminWeb e Gestão da Qualidade têm acesso total
        var temAcessoTotal = (utilizadorLogado.tipo === 'AdminWeb' || utilizadorLogado.tipo === 'Gestão da Qualidade');
        
        // Regra 2: Responsável de Área só tem acesso se a área coincidir
        var temAcessoArea = (utilizadorLogado.tipo === 'Responsável de Área' && utilizadorLogado.departamento === ncOrigem.area);

        // Se não tiver nem acesso total nem acesso à área, bloqueia
        if (!temAcessoTotal && !temAcessoArea) {
            alert("Acesso Negado: Apenas o Responsável da Área (" + ncOrigem.area + ") ou a Qualidade podem criar ações para esta NC.");
            return;
        }
    } else {
        alert("Erro: Não foi possível encontrar a Não Conformidade associada.");
        return;
    }
    // ------------------------------------------

    var descricao = document.getElementById('ac_descricao').value;
    var responsavel = document.getElementById('ac_responsavel').value;
    var prazo = document.getElementById('ac_prazo').value;
    var estado = document.getElementById('ac_estado').value;
    var eficaciaAuditada = document.getElementById('ac_eficacia').value;

    if (!ncId || !descricao || !responsavel || !prazo) {
        alert('Preencha os campos obrigatórios.');
        return;
    }

    var hoje = new Date();
    var dataPrazo = new Date(prazo);
    hoje.setHours(0, 0, 0, 0);

    if (dataPrazo < hoje) {
        alert("O prazo não pode ser anterior à data atual.");
        return;
    }

    var id = 'AC' + ('000' + contadorAC).slice(-4);

    var novaAC = {
        id: id,
        ncId: ncId,
        descricao: descricao,
        responsavel: responsavel,
        data_inicio: new Date().toLocaleDateString('pt-PT'),
        prazo: prazo,
        estado: estado,
        eficacia_auditada: eficaciaAuditada,
        historico: [id + '- Criada em ' + new Date().toLocaleDateString('pt-PT')]
    };

    acs.push(novaAC);
    contadorAC++;
    guardarStorage();

    document.getElementById('formNovaAC').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalNovaAC')).hide();

    alert('Ação Corretiva ' + id + ' criada com sucesso!');
    if (ncSelecionada !== null) verDetalhes(ncSelecionada);
};

function verDetalhes(index) {
    ncSelecionada = index;
    var nc = ncs[index];

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

    var tabelaAcoes = document.getElementById('tabelaAcoes');
    tabelaAcoes.innerHTML = '';

    var acs_associadas = acs.filter(ac => ac.ncId == nc.id);

    if (acs_associadas.length > 0) {
        acs_associadas.forEach(ac => {
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><strong>' + ac.id + '</strong></td>' +
                '<td>' + ac.descricao + '</td>' +
                '<td>' + ac.responsavel + '</td>' +
                '<td>' + ac.prazo.split('-').reverse().join('/') + '</td>' +
                '<td>' + ac.estado + '</td>' +
                '<td>' +
                (ac.estado === 'em_execucao'
                    ? '<button class="btn btn-sm btn-success" onclick="finalizarAC(\'' + ac.id + '\')">Concluir</button>'
                    : ac.estado === 'concluida'
                        ? '<button class="btn btn-sm btn-warning" onclick="auditarAC(\'' + ac.id + '\')">Auditar</button>'
                        : ac.estado === 'reaberta'
                            ? '<button class="btn btn-sm btn-success" onclick="finalizarAC(\'' + ac.id + '\')">Concluir</button>' // Mantém o botão "Concluir" visível quando reaberta
                            : '-'
                ) +
                '</td>';
            tabelaAcoes.appendChild(tr);
        });
    } else {
        tabelaAcoes.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma ação corretiva associada.</td></tr>';
    }

    acs_associadas.forEach(ac => {
        if (ac.historico && ac.historico.length > 0) {
            ac.historico.forEach(h => {
                var acHistoricoItem = document.createElement('li');
                acHistoricoItem.className = 'list-group-item';
                acHistoricoItem.textContent = h;
                document.getElementById('detalheHistorico').appendChild(acHistoricoItem);
            });
        }
    });

    var modalEl = document.getElementById('modalDetalhesNC');
    if (!modalEl.classList.contains('show')) {
        new bootstrap.Modal(modalEl).show();
    }
}

document.getElementById('btnAtualizarEstado').onclick = function () {
    //ver perms
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado: Apenas o departamento de gestão/responsáveis de qualidade podem gerir o estado.");
        return;
    }

    var modal = document.getElementById("modalDetalhesNC");
    var bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (ncSelecionada == null) return;

    var novoEstado = document.getElementById("detalheEstado").value;
    var nc = ncs[ncSelecionada];

    if (nc.estado == novoEstado) return;

    if (!confirm("Confirmar alteração do estado da não conformidade?")) {
        return;
    }

    nc.estado = novoEstado;
    var texto = nc.estado == 'aberta' ? 'Aberta' : (nc.estado == 'analise' ? 'Em análise' : 'Encerrada');
    nc.historico.push(
        nc.id + ' - ' + texto + ' em ' + new Date().toLocaleDateString('pt-PT')
    );

    guardarStorage();
    mostrarNCs();
    bootstrapModal.hide();
    alert('O estado da não conformidade foi atualizado com sucesso');
};

function finalizarAC(acId) {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo !== 'Gestão da Qualidade') {
        alert("Apenas a Gestão da Qualidade pode finalizar ações corretivas.");
        return;
    }

    if (!confirm("Confirmar finalização da ação corretiva?")) return;

    var ac = acs.find(a => a.id === acId);
    if (!ac) return;

    ac.estado = 'concluida';
    ac.eficacia_auditada = 'pendente';

    if (!ac.historico) ac.historico = [];

    ac.historico.push(
        ac.id + " - Concluída em " + new Date().toLocaleDateString('pt-PT')
    );

    guardarStorage();
    if (ncSelecionada !== null) verDetalhes(ncSelecionada);

    alert("Ação corretiva finalizada com sucesso.");
}

function auditarAC(acId) {
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (
        utilizadorLogado.tipo !== 'Auditor Interno' &&
        utilizadorLogado.tipo !== 'Auditor Externo' &&
        utilizadorLogado.tipo !== 'Gestão da Qualidade'
    ) {
        alert("Apenas auditores ou gestão da qualidade podem auditar ações corretivas.");
        return;
    }

    var ac = acs.find(a => a.id === acId);
    if (!ac) return;

    // Verifica se a AC está concluída
    if (ac.estado !== 'concluida') {
        alert("A ação corretiva ainda não está concluída.");
        return;
    }

    // Prompt para avaliação de eficácia
    var eficacia = prompt("Avaliação da eficácia (Eficaz / Ineficaz):");
    if (!eficacia) return;  // Se não for preenchido, sai da função

    // Prompt para comentário de auditoria
    var comentario = prompt("Comentário de auditoria:");
    if (!comentario) return;  // Se não for preenchido, sai da função

    // Salva a eficácia e o comentário no objeto AC
    ac.eficacia_auditada = eficacia;
    ac.comentario_auditoria = comentario;

    // Adiciona essa informação ao histórico da AC
    if (!ac.historico) ac.historico = [];  // Garante que o histórico existe
    ac.historico.push(
        ac.id + "- Auditada como " + eficacia + " em " + new Date().toLocaleDateString('pt-PT') +
        " | Comentário de Auditoria: " + comentario
    );

    // Se a eficácia for "Ineficaz", reabre a AC
    if (eficacia.toLowerCase() === 'ineficaz') {
        ac.estado = 'reaberta';  // Mudar o estado para "reaberta"
        ac.historico.push(ac.id + "- Reaberta após auditoria");
    }

    // Salva os dados no localStorage para persistência
    guardarStorage();

    if (ncSelecionada !== null) verDetalhes(ncSelecionada);

    alert("Auditoria registada com sucesso.");
}

document.getElementById('filtroEstado').onchange = mostrarNCs;
document.getElementById('filtroPesquisa').oninput = mostrarNCs;