var indicadores = [];
var contadorIND = 1;
var indicadorSelecionado = null;
var graficoEstado = null;

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
        ],
        sentido: document.getElementById('indSentido').value
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
    desenharGauge(ind);
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

    var dataAgora = new Date().toLocaleDateString('pt-PT') + ' ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    ind.historico.push('Valor atualizado de ' + valorAnterior + ' para ' + novoValor + ' em ' + dataAgora);

    guardarStorage();
    mostrarIndicadores();

    bootstrap.Modal.getInstance(document.getElementById('modalDetalhesIndicador')).hide();
    alert('Valor atualizado com sucesso!');
}

function extrairNumero(texto) {
    var match = texto.match(/\d+/);
    return match ? Number(match[0]) : null;
}

function avaliarIndicador(valor, meta, sentido) {

    if (sentido === 'menor_melhor') {
        if (valor <= meta) return 'bom';
        if (valor <= meta * 1.1) return 'atencao';
        return 'mau';
    }

    if (sentido === 'maior_melhor') {
        if (valor >= meta) return 'bom';
        if (valor >= meta * 0.9) return 'atencao';
        return 'mau';
    }
}

function desenharGauge(ind) {

    var meta = extrairNumero(ind.meta);
    if (!meta || meta <= 0) return;

    var valor = ind.valor;
    var percentagem;

    if (ind.sentido === 'maior_melhor') {
        percentagem = valor / meta;
    } else {
        percentagem = meta / valor;
    }

    percentagem = Math.max(0, Math.min(percentagem, 1));

    var estado =
        percentagem >= 0.85 ? 'bom' :
            percentagem >= 0.55 ? 'atencao' :
                'mau';

    var cores = {
        bom: '#28a745',
        atencao: '#ffc107',
        mau: '#dc3545'
    };

    var ctx = document.getElementById('graficoEstado').getContext('2d');

    if (graficoEstado) graficoEstado.destroy();

    graficoEstado = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentagem, 1 - percentagem],
                backgroundColor: [cores[estado], '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '75%',
            rotation: -90,
            circumference: 180,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });

    document.getElementById('textoEstado').textContent =
        valor + ' / ' + meta + ' (' +
        (estado === 'bom' ? 'OK' :
            estado === 'atencao' ? 'Atenção' :
                'Fora da Meta') + ')';
}




document.getElementById('filtroArea').onchange = mostrarIndicadores;
document.getElementById('filtroPesquisa').oninput = mostrarIndicadores;