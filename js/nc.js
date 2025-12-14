var ncs = [];
var acs = [];
var contador = 1;
var contadorAC = 1;
var ncSelecionada = null;

window.onload = function () {
    carregarStorage();
    mostrarNCs();
    document.getElementById('ncData').valueAsDate = new Date();
    carregarSelectUsuarios(['ncResponsavel', 'ac_responsavel']);
};

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
    //ver perms
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado: Apenas o departamento de gestão/responsáveis de qualidade podem gerir Não Conformidades.");
        return;
    }

    var titulo = document.getElementById('ncTitulo').value;
    var desc = document.getElementById('ncDescricao').value;
    var area = document.getElementById('ncArea').value;
    var resp = document.getElementById('ncResponsavel').value;
    var prio = document.getElementById('ncPrioridade').value;
    var data = document.getElementById('ncData').value;

    if (!titulo || !desc || !area || !resp || !data) {
        alert('Preencha todos os campos obrigatórios');
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

    document.getElementById('formNovaNC').reset();
    document.getElementById('ncData').valueAsDate = new Date();
    bootstrap.Modal.getInstance(document.getElementById('modalNovaNC')).hide();
};

document.getElementById('btnGuardarAC').onclick = function () {
    console.log("Botão de Guardar Ação Corretiva clicado!");
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado: Apenas o departamento de gestão/responsáveis de qualidade podem gerir Ações Corretivas.");
        return;
    }

    var ncId = document.getElementById('ac_ncId').value;
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