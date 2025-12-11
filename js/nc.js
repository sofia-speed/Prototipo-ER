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
        acs =[];
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
        prioridade: prio,
        data: data,
        estado: 'aberta',
        historico: ['aberta em ' + new Date().toLocaleDateString('pt-PT')]
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
    //ver perms
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
    var comentarioAuditoria = document.getElementById('ac_comentario_auditoria').value; 

    if (!ncId || !descricao || !responsavel || !prazo) {
        alert('Preencha os campos obrigatórios.');
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
        comentario_auditoria: comentarioAuditoria || null
    };

    acs.push(novaAC);
    contadorAC++;
    guardarStorage(); 

    document.getElementById('formNovaAC').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalNovaAC')).hide();
    
    alert('Ação Corretiva ' + id + ' criada com sucesso!');
    if(ncSelecionada !== null) verDetalhes(ncSelecionada);
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

    if(acs_associadas.length > 0){
        acs_associadas.forEach(ac => {
            var tr = document.createElement('tr');
            tr.innerHTML = '<td><strong>' + ac.id + '</strong></td>' +
                '<td>' + ac.descricao + '</td>' +
                '<td>' + ac.responsavel + '</td>' +
                '<td>' + ac.prazo.split('-').reverse().join('/') + '</td>' +
                '<td>'+ ac.estado + '</span></td>';
            tabelaAcoes.appendChild(tr);
        });
    } else {
        tabelaAcoes.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma ação corretiva associada.</td></tr>';
    }

    var modalEl = document.getElementById('modalDetalhesNC');
    if(!modalEl.classList.contains('show')) {
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

    nc.estado = novoEstado;
    var texto = nc.estado == 'aberta' ? 'Aberta' : (nc.estado == 'analise' ? 'Em análise' : 'Encerrada');
    nc.historico.push(texto + ' em ' + new Date().toLocaleDateString('pt-PT'));

    guardarStorage();
    mostrarNCs();
    bootstrapModal.hide(); 
    alert('O estado da não conformidade foi atualizado com sucesso');
};

document.getElementById('filtroEstado').onchange = mostrarNCs;
document.getElementById('filtroPesquisa').oninput = mostrarNCs;