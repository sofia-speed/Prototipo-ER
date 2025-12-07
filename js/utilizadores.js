// utilizadores.js

var utilizadores = [];
var contadorUSER = 1;

window.onload = function () {
    carregarStorage();
    mostrarUtilizadores();
};

function carregarStorage() {
    var dados = localStorage.getItem('utilizadores');
    if (dados) {
        utilizadores = JSON.parse(dados);
        var cont = localStorage.getItem('contadorUSER');
        if (cont) contadorUSER = parseInt(cont);
    } else {
        // ExEMPLOS INICIAIS
        utilizadores = [
            {
                id: 'USR0001',
                nome: 'João Silva',
                email: 'joao.silva@empresa.pt',
                departamento: 'Qualidade',
                tipo: 'Gestão da Qualidade'
            },
            {
                id: 'USR0002',
                nome: 'Ana Pereira',
                email: 'ana.pereira@empresa.pt',
                departamento: 'Administração',
                tipo: 'Administração'
            },
            {
                id: 'USR0003',
                nome: 'Pedro Costa',
                email: 'pedro.costa@empresa.pt',
                departamento: 'TI',
                tipo: 'Desenvolvimento'
            },
            {
                id: 'USR0004',
                nome: 'Mariana Lopes',
                email: 'mariana.lopes@empresa.pt',
                departamento: 'Qualidade',
                tipo: 'Auditor Interno'
            }
        ];
        contadorUSER = 5;
        guardarStorage();
    }
}

function guardarStorage() {
    localStorage.setItem('utilizadores', JSON.stringify(utilizadores));
    localStorage.setItem('contadorUSER', contadorUSER);
}

function mostrarUtilizadores() {

    var tbody = document.getElementById("tabelaUtilizadores");
    tbody.innerHTML = '';

    var filtroTipo = document.getElementById("filtroTipo").value;
    var filtroPesquisa = document.getElementById("filtroPesquisa").value.toLowerCase();

    for (var i = 0; i < utilizadores.length; i++) {

        var u = utilizadores[i];

        if (filtroTipo && u.tipo != filtroTipo) continue;
        if (filtroPesquisa && !u.nome.toLowerCase().includes(filtroPesquisa) && !u.email.toLowerCase().includes(filtroPesquisa)) continue;

        var tr = document.createElement('tr');

        tr.innerHTML = '<td><strong>' + u.id + '</strong></td>' +
            '<td>' + u.nome + '</td>' +
            '<td>' + u.email + '</td>' +
            '<td>' + u.departamento + '</td>' +
            '<td>' + u.tipo + '</td>';

        tbody.appendChild(tr);
    }
}

document.getElementById('btnGuardarUtilizador').onclick = function () {

    var nome = document.getElementById('userNome').value;
    var email = document.getElementById('userEmail').value;
    var dept = document.getElementById('userDept').value;
    var tipo = document.getElementById('userTipo').value;

    if (!nome || !email || !dept || !tipo) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }

    var id = 'USR' + ('000' + contadorUSER).slice(-4);

    var novoUser = {
        id: id,
        nome: nome,
        email: email,
        departamento: dept,
        tipo: tipo
    };

    utilizadores.push(novoUser);
    contadorUSER++;
    guardarStorage();
    mostrarUtilizadores();

    document.getElementById('formNovoUtilizador').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalNovoUtilizador')).hide();
};

document.getElementById('filtroTipo').onchange = mostrarUtilizadores;
document.getElementById('filtroPesquisa').oninput = mostrarUtilizadores;