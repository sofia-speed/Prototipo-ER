var oms = []; 
var contadorOM = 1;
var omSelecionada = null;

window.onload = function () {
    carregarStorage();
    mostrarOMs();
    configurarModalNovaOM();
    
    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('omData').value = now.toISOString().slice(0, 16);
};

function carregarStorage() {
    var dados = localStorage.getItem('oms');
    if (dados) {
        oms = JSON.parse(dados);
        var cont = localStorage.getItem('contadorOM');
        if (cont) contadorOM = parseInt(cont);
    } else {
        oms = [];
        contadorOM = 1; 
    }
    guardarStorage();
}

function guardarStorage() {
    localStorage.setItem('oms', JSON.stringify(oms));
    localStorage.setItem('contadorOM', contadorOM);
}

function formatarDataHora(dataString) {
    if(!dataString) return "";
    var d = new Date(dataString);
    if(isNaN(d.getTime())) return dataString; 
    return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'});
}

function mostrarOMs() {
    var tbody = document.getElementById("tabelaOMs");
    tbody.innerHTML = ''; 

    var filtroEstado = document.getElementById("filtroEstado").value;
    var filtroPesquisa = document.getElementById("filtroPesquisa").value.toLowerCase();

    for (var i = 0; i < oms.length; i++) {
        var om = oms[i];
        
        if (!temPermissaoDeVisualizar(om.area)) continue;

        if (filtroEstado && om.estado != filtroEstado) continue; 
        if (filtroPesquisa && !om.titulo.toLowerCase().includes(filtroPesquisa)) continue; 

        var tr = document.createElement('tr'); 
        var corEstado;
        var textoEstado;

        switch(om.estado) {
            case 'proposta': corEstado = 'secondary'; textoEstado = 'Proposta'; break;
            case 'avaliacao': corEstado = 'warning'; textoEstado = 'Em Avaliação'; break;
            case 'implementacao': corEstado = 'primary'; textoEstado = 'Em Implementação'; break;
            case 'concluida': corEstado = 'success'; textoEstado = 'Concluída'; break;
            default: corEstado = 'light'; textoEstado = 'N/A';
        }

        var dataFormatada = formatarDataHora(om.data);

        tr.innerHTML = '<td><strong>' + om.id + '</strong></td>' +
            '<td>' + om.titulo + '</td>' +
            '<td>' + om.area + '</td>' +
            '<td>' + om.prioridade + '</td>' +
            '<td>' + dataFormatada + '</td>' +
            '<td><span class="badge bg-' + corEstado + '">' + textoEstado + '</span></td>' +
            '<td><button class="btn btn-sm btn-primary" onclick="verDetalhes(' + i + ')"><i class="bi bi-eye"></i></button></td>';
        tbody.appendChild(tr);
    }
}

document.getElementById('btnGuardarOM').onclick = function () {
    // --- VERIFICAÇÃO DE PERMISSÕES ---
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    
    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado: Apenas o departamento de gestão/responsáveis de qualidade podem gerir Oportunidades.");
        return;
    }
    // ---------------------------------

    var titulo = document.getElementById('omTitulo').value;
    var desc = document.getElementById('omDescricao').value;
    var area = document.getElementById('omArea').value;
    var prio = document.getElementById('omPrioridade').value;
    var dific = document.getElementById('omDificuldade').value; 
    var impac = document.getElementById('omImpacto').value;     
    var data = document.getElementById('omData').value; 

    if (!titulo || !desc || !area || !prio || !data) {  
        alert('Preencha todos os campos obrigatórios');
        return;
    }

    var id = 'OM' + ('000' + contadorOM).slice(-4);
    var dataAgora = new Date().toLocaleString('pt-PT', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});

    var novaOM = {
        id: id,
        titulo: titulo,
        descricao: desc,
        area: area,
        prioridade: prio,
        dificuldade: dific,
        impacto: impac,
        data: data, 
        estado: 'proposta', 
        historico: ['Proposta criada em ' + dataAgora]
    };

    oms.push(novaOM);
    contadorOM++;
    guardarStorage();
    mostrarOMs();

    document.getElementById('formNovaOM').reset();
    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('omData').value = now.toISOString().slice(0, 16);
    
    bootstrap.Modal.getInstance(document.getElementById('modalNovaOM')).hide();
};

function verDetalhes(index) {
    omSelecionada = index;
    var om = oms[index];

    document.getElementById('detalheId').textContent = om.id;
    document.getElementById('detalheTitulo').textContent = om.titulo;
    document.getElementById('detalheDescricao').textContent = om.descricao;
    document.getElementById('detalheArea').textContent = om.area;
    document.getElementById('detalhePrioridade').textContent = om.prioridade;
    document.getElementById('detalheDificuldade').textContent = om.dificuldade; 
    document.getElementById('detalheImpacto').textContent = om.impacto;         
    document.getElementById('detalheData').textContent = formatarDataHora(om.data);
    document.getElementById('detalheEstado').value = om.estado;

    var historicoHTML = '';
    for (var i = 0; i < om.historico.length; i++) {
        historicoHTML += '<li class="list-group-item">' + om.historico[i] + '</li>';
    }
    document.getElementById('detalheHistorico').innerHTML = historicoHTML;

    new bootstrap.Modal(document.getElementById('modalDetalhesOM')).show();
}

function configurarModalNovaOM() {
    var modal = document.getElementById('modalNovaOM');
    var selectArea = document.getElementById('omArea');

    if (!modal || !selectArea) return;

    modal.addEventListener('show.bs.modal', function () {
        var user = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

        // reset do formulário
        document.getElementById('formNovaOM').reset();

        var isAdminOrQuality =
            user.tipo === 'AdminWeb' ||
            user.tipo === 'Gestão da Qualidade';

        if (isAdminOrQuality) {
            // Pode escolher
            selectArea.disabled = false;
            selectArea.value = '';
        } else {
            // Área automática e bloqueada
            selectArea.value = user.departamento;
            selectArea.disabled = true;
        }

        // voltar a colocar a data atual
        var now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('omData').value = now.toISOString().slice(0, 16);
    });
}

document.getElementById('btnAtualizarEstado').onclick = function () {
    // --- VERIFICAÇÃO DE PERMISSÕES ---
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    
    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado: Apenas o departamento de gestão/responsáveis de qualidade podem gerir Oportunidades.");
        return;
    }
    // ---------------------------------

    if (omSelecionada == null) return;

    var novoEstado = document.getElementById("detalheEstado").value;
    var om = oms[omSelecionada];

    if (om.estado == novoEstado) return;

    om.estado = novoEstado;
    var textoEstado;
    switch(novoEstado) {
        case 'proposta': textoEstado = 'Proposta'; break;
        case 'avaliacao': textoEstado = 'Em Avaliação'; break;
        case 'implementacao': textoEstado = 'Em Implementação'; break;
        case 'concluida': textoEstado = 'Concluída'; break;
    }

    var dataAgora = new Date().toLocaleString('pt-PT', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
    om.historico.push('Estado alterado para ' + textoEstado + ' em ' + dataAgora);

    guardarStorage();
    mostrarOMs();
    
    alert('O estado da oportunidade foi atualizado com sucesso');
    bootstrap.Modal.getInstance(document.getElementById('modalDetalhesOM')).hide();
};

document.getElementById('filtroEstado').onchange = mostrarOMs;
document.getElementById('filtroPesquisa').oninput = mostrarOMs;