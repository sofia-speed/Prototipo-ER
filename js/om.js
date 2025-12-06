var oms = []; //Array que guarda a soportunidades de melhoria
var contadorOM = 1;
var omSelecionada = null;

window.onload = function () {
    carregarStorage();
    mostrarOMs();
    
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
        //Exemplos prefeitos para demonstrcaão
        oms = [
            {
                id: 'OM0001',
                titulo: 'Digitalizar registos de chão de fábrica',
                descricao: 'Substituir papel por tablets na linha de produção.',
                area: 'Produção',
                prioridade: 'Alta',
                dificuldade: 'Difícil',
                impacto: 'Alto',
                data: '2024-11-20T09:30', // Data com hora
                estado: 'implementacao',
                historico: [
                    'Proposta criada em 20/11/2024 09:30', 
                    'Estado alterado para Em Implementação em 25/11/2024 14:00'
                ]
            },
            {
                id: 'OM0002',
                titulo: 'Curso de Inglês Técnico',
                descricao: 'Melhorar comunicação com fornecedores',
                area: 'Comercial',
                prioridade: 'Média',
                dificuldade: 'Fácil',
                impacto: 'Médio',
                data: '2024-12-01T10:15', // Data com hora
                estado: 'proposta',
                historico: ['Proposta criada em 01/12/2024 10:15']
            }
        ];
        contadorOM = 3; 
        guardarStorage();
    }
}

function guardarStorage() {
    localStorage.setItem('oms', JSON.stringify(oms));
    localStorage.setItem('contadorOM', contadorOM);
}

// Função auxiliar para formatar data e hora (dd/mm/aaaa hh:mm)
function formatarDataHora(dataString) {
    if(!dataString) return "";
    var d = new Date(dataString);
    if(isNaN(d.getTime())) return dataString; 
    
    return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'});
}

function mostrarOMs() {
    console.log("mostrar oms");

    var tbody = document.getElementById("tabelaOMs");
    tbody.innerHTML = ''; //limpar a tabela

    var filtroEstado = document.getElementById("filtroEstado").value;
    var filtroPesquisa = document.getElementById("filtroPesquisa").value.toLowerCase();

    for (var i = 0; i < oms.length; i++) {
        var om = oms[i];
        
        // Filtros
        if (filtroEstado && om.estado != filtroEstado) continue; 
        if (filtroPesquisa && !om.titulo.toLowerCase().includes(filtroPesquisa)) continue; 

        var tr = document.createElement('tr'); 
        var corEstado;
        var textoEstado;

        switch(om.estado) {
            case 'proposta':
                corEstado = 'secondary';
                textoEstado = 'Proposta';
                break;
            case 'avaliacao':
                corEstado = 'warning';
                textoEstado = 'Em Avaliação';
                break;
            case 'implementacao':
                corEstado = 'primary';
                textoEstado = 'Em Implementação';
                break;
            case 'concluida':
                corEstado = 'success';
                textoEstado = 'Concluída';
                break;
            default:
                corEstado = 'light';
                textoEstado = 'N/A';
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
    var titulo = document.getElementById('omTitulo').value;
    var desc = document.getElementById('omDescricao').value;
    var area = document.getElementById('omArea').value;
    var prio = document.getElementById('omPrioridade').value;
    var dific = document.getElementById('omDificuldade').value; 
    var impac = document.getElementById('omImpacto').value;     
    var data = document.getElementById('omData').value; // Isto agora traz Data E Hora

    if (!titulo || !desc || !area || !prio || !data) {  
        alert('Preencha todos os campos obrigatórios');
        return;
    }

    var id = 'OM' + ('000' + contadorOM).slice(-4);
    
    //Histrico com data e hroa
    var dataAgora = new Date().toLocaleString('pt-PT', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});

    var novaOM = {
        id: id,
        titulo: titulo,
        descricao: desc,
        area: area,
        prioridade: prio,
        dificuldade: dific,
        impacto: impac,
        data: data, // Guarda formato YYYY-MM-DDTHH:MM
        estado: 'proposta', 
        historico: ['Proposta criada em ' + dataAgora]
    };

    oms.push(novaOM);
    contadorOM++;
    guardarStorage();
    mostrarOMs();

    document.getElementById('formNovaOM').reset();
    
    //Reset para data atuael
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

document.getElementById('btnAtualizarEstado').onclick = function () {
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

    // Regista no histórico com HORA
    var dataAgora = new Date().toLocaleString('pt-PT', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
    om.historico.push('Estado alterado para ' + textoEstado + ' em ' + dataAgora);

    guardarStorage();
    mostrarOMs();
    
    // Fecha o modal e mostra alerta
    alert('O estado da oportunidade foi atualizado com sucesso');
    var elementoModal = document.getElementById('modalDetalhesOM');
    var modalInstance = bootstrap.Modal.getInstance(elementoModal);
    modalInstance.hide();
};

document.getElementById('filtroEstado').onchange = mostrarOMs;
document.getElementById('filtroPesquisa').oninput = mostrarOMs;