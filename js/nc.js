

var ncs = []; //array das nao conformidades
var acs =[]; //array das acoes corretivas
var contador = 1; //serve para criar os ids das nc
var ncSelecionada = null; //nc selecionada ao  ver detalhes

window.onload = function () {
    carregarStorage();
    mostrarNCs();
    document.getElementById('ncData').valueAsDate = new Date();
};

function carregarStorage() {
    var dados = localStorage.getItem('ncs');
    if (dados) {
        ncs = JSON.parse(dados);
        var cont = localStorage.getItem('contador');
        if (cont) contador = parseInt(cont);
    } else {
        // dados exemplo
        ncs = [
            {
                id: 'NC0001',
                titulo: 'Atraso na entrega de materiais',
                descricao: 'Fornecedor não cumpriu prazo.',
                area: 'Logística',
                responsavel: 'João Silva',
                prioridade: 'Alta',
                data: '2024-12-01',
                estado: 'analise',
                historico: ['aberta em 01/12/2024', 'em análise em 02/12/2024']
            },
            {
                id: 'NC0002',
                titulo: 'Produto fora das especificações',
                descricao: 'Lote com dimensões incorretas.',
                area: 'Qualidade',
                responsavel: 'Maria Santos',
                prioridade: 'Crítica',
                data: '2024-12-03',
                estado: 'aberta',
                historico: ['aberta em 03/12/2024']
            }
        ];

        acs =[
            {
                id: 'AC0001',
                ncId: 'NC0001',
                descricao: 'Comunicar com o fornecedor',
                responsavel: 'João Silva',
                estado: 'em execução',
                prazo: '2026-03-02'
            }
        ]
        contador = 3; //id da nc seguinte seria 0003
        guardarStorage();
    }
}

function guardarStorage() {
    localStorage.setItem('ncs', JSON.stringify(ncs));
    localStorage.setItem('contador', contador);
}

function mostrarNCs() {

    console.log("mostrar ncs");

    var tbody = document.getElementById("tabelaNCs");
    tbody.innerHTML = ''; //limpar a tabela

    var filtroEstado = document.getElementById("filtroEstado").value;
    var filtroPesquisa = document.getElementById("filtroPesquisa").value.toLowerCase();

    for (var i = 0; i < ncs.length; i++) {
        console.log("ciclo for " + i)
        var nc = ncs[i];
        if (filtroEstado && nc.estado != filtroEstado) continue; //verficar se estado da nc corresponde ao filtro
        if (filtroPesquisa && !nc.titulo.toLowerCase().includes(filtroPesquisa)) continue; //verificar se titulo da nc corresponde a pesquisa

        var tr = document.createElement('tr'); //cria uma linha na tabela
        var corEstado;
        var textoEstado;
        if (nc.estado == 'aberta') {
            corEstado = 'danger'; //vermelho
            textoEstado = 'Aberta';
        } else if (nc.estado == 'analise') {
            corEstado = 'warning'; //amarelo
            textoEstado = 'Em Análise';
        } else {
            corEstado = 'success'; //verde
            textoEstado = 'Encerrada'
        }

        tr.innerHTML = '<td><strong>' + nc.id + '</strong></td>' +
            '<td>' + nc.titulo + '</td>' +
            '<td>' + nc.area + '</td>' +
            '<td>' + nc.responsavel + '</td>' +
            '<td>' + nc.data.split('-').reverse().join('/') + '</td>' +
            '<td><span class="badge bg-' + corEstado + '">' + textoEstado + '</span></td>' +
            '<td><button class="btn btn-sm btn-primary" onclick="verDetalhes(' + i + ')"><i class="bi bi-eye"></i></button></td>';
        tbody.appendChild(tr);


    }
}

document.getElementById('btnGuardarNC').onclick = function () {
    var titulo = document.getElementById('ncTitulo').value;
    var desc = document.getElementById('ncDescricao').value;
    var area = document.getElementById('ncArea').value;
    var resp = document.getElementById('ncResponsavel').value;
    var prio = document.getElementById('ncPrioridade').value;
    var data = document.getElementById('ncData').value;

    if (!titulo || !desc || !area || !resp || !data) {  //verifica se foi tudo preenchido
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

    new bootstrap.Modal(document.getElementById('modalDetalhesNC')).show();
}

document.getElementById('btnAtualizarEstado').onclick = function () {
    var modal = document.getElementById("modalDetalhesNC");
    var bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (ncSelecionada == null) return;

    var novoEstado = document.getElementById("detalheEstado").value;
    var nc = ncs[ncSelecionada];

    if (nc.estado == novoEstado) return;

    nc.estado = novoEstado;
    var texto;
    if (novoEstado == 'aberta') {
        texto = 'Aberta';
    } else if (novoEstado == 'analise') {
        texto = 'Em análise';
    } else {
        texto = 'Encerrada'
    }
    nc.historico.push(texto + ' em ' + new Date().toLocaleDateString('pt-PT')); //regista no historico a atualizacao

    guardarStorage();
    mostrarNCs();
    bootstrapModal.hide(); //fecha o modal depois da atualização
    alert('O estado da não conformidade foi atualizado com sucesso');
};

document.getElementById('filtroEstado').onchange = mostrarNCs;
document.getElementById('filtroPesquisa').oninput = mostrarNCs;
