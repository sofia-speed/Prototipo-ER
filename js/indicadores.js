var indicadores = [];
var contadorIND = 1;
var indicadorSelecionado = null;

window.onload = function () {
    carregarStorage();
    mostrarIndicadores();
    configurarModalNovoIndicador();
};

function carregarStorage() {
    var dados = localStorage.getItem('indicadores');
    if (dados) {
        indicadores = JSON.parse(dados);
        var cont = localStorage.getItem('contadorIND');
        if (cont) contadorIND = parseInt(cont);
    } else {
        indicadores = [];
        contadorIND = 1;
    }
}

function guardarStorage() {
    localStorage.setItem('indicadores', JSON.stringify(indicadores));
    localStorage.setItem('contadorIND', contadorIND);
}

function mostrarIndicadores() {
    var tbody = document.getElementById("tabelaIndicadores");
    tbody.innerHTML = '';

    var filtroArea = document.getElementById("filtroArea").value;
    var filtroPesquisa = document.getElementById("filtroPesquisa").value.toLowerCase();

    for (var i = 0; i < indicadores.length; i++) {
        var ind = indicadores[i];

        // Filtro de Segurança Visual (Auth.js)
        if (!temPermissaoDeVisualizar(ind.departamento)) continue;

        if (filtroArea && ind.departamento != filtroArea) continue;
        if (filtroPesquisa && !ind.nome.toLowerCase().includes(filtroPesquisa)) continue;

        var tr = document.createElement('tr');

        tr.innerHTML = '<td><strong>' + ind.id + '</strong></td>' +
            '<td>' + ind.nome + '</td>' +
            '<td>' + ind.departamento + '</td>' +
            '<td class="texto-quebra">' + ind.meta + '</td>' +
            '<td>' + ind.valor + '</td>' +
            '<td><button class="btn btn-primary btn-sm" onclick="verDetalhes(' + i + ')"><i class="bi bi-eye"></i></button></td>';

        tbody.appendChild(tr);
    }
}

document.getElementById('btnGuardarIndicador').onclick = function () {
    //ver perms
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado: Apenas o departamento de gestão/responsáveis de qualidade podem gerir indicadores.");
        return;
    }
    
    var nome = document.getElementById('indNome').value;
    var dept = document.getElementById('indDepartamento').value;
    var meta = document.getElementById('indMeta').value;
    var valor = document.getElementById('indValor').value;

    if (!nome || !dept || !meta || !valor) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }

    var id = 'IND' + ('000' + contadorIND).slice(-4);
    var dataAgora = new Date().toLocaleDateString('pt-PT');

    var novoIndicador = {
        id: id,
        nome: nome,
        departamento: dept,
        meta: meta,
        valor: Number(valor),
        historico: [
            'Indicador criado com valor inicial: ' + valor + ' em ' + dataAgora
        ]
    };

    indicadores.push(novoIndicador);
    contadorIND++;
    guardarStorage();
    mostrarIndicadores();

    document.getElementById('formNovoIndicador').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalNovoIndicador')).hide();
};

function verDetalhes(index) {
    indicadorSelecionado = index;
    var ind = indicadores[index];

    document.getElementById('detalheId').textContent = ind.id;
    document.getElementById('detalheNome').textContent = ind.nome;
    document.getElementById('detalheDepartamento').textContent = ind.departamento;
    document.getElementById('detalheMeta').textContent = ind.meta;
    document.getElementById('detalheValor').textContent = ind.valor;

    document.getElementById('novoValorAtual').value = '';

    new bootstrap.Modal(document.getElementById('modalDetalhesIndicador')).show();
}

function configurarModalNovoIndicador() {
    var modal = document.getElementById('modalNovoIndicador');
    var selectDept = document.getElementById('indDepartamento');

    if (!modal || !selectDept) return;

    modal.addEventListener('show.bs.modal', function () {
        var user = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

        document.getElementById('formNovoIndicador').reset();

        var isAdminOrQuality =
            user.tipo === 'AdminWeb' ||
            user.tipo === 'Gestão da Qualidade';

        if (isAdminOrQuality) {
            selectDept.disabled = false;
            selectDept.value = '';
        } else {
            selectDept.value = user.departamento;
            selectDept.disabled = true;
        }
    });
}


document.getElementById('btnAtualizarValor').onclick = function () {
    //ver eprms
    var utilizadorLogado = JSON.parse(sessionStorage.getItem('utilizadorLogado'));

    if (utilizadorLogado.tipo === 'Utilizador Básico' && utilizadorLogado.departamento !== 'Qualidade') {
        alert("Acesso Negado: Apenas o departamento de gestão/responsáveis de qualidade podem gerir indicadores.");
        return;
    }

    if (indicadorSelecionado == null) return;

    var novoValor = document.getElementById('novoValorAtual').value;
    if (novoValor === "") {
        alert("Insira um valor válido!");
        return;
    }

    var ind = indicadores[indicadorSelecionado];
    var valorAnterior = ind.valor;
    ind.valor = Number(novoValor);

    var dataAgora = new Date().toLocaleDateString('pt-PT') + ' ' + new Date().toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'});

    ind.historico.push('Valor atualizado de ' + valorAnterior + ' para ' + novoValor + ' em ' + dataAgora);

    guardarStorage();
    mostrarIndicadores();

    bootstrap.Modal.getInstance(document.getElementById('modalDetalhesIndicador')).hide();
    alert('Valor atualizado com sucesso!');
}

document.getElementById('filtroArea').onchange = mostrarIndicadores;
document.getElementById('filtroPesquisa').oninput = mostrarIndicadores;