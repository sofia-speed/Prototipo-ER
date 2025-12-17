var utilizadores = [];
var contadorUSER = 1;
var utilizadorLogado = null;

window.onload = function () {
    // 1. Carregar o utilizador logado da Sessão (Nome chave corrigido para utilizadorLogado)
    var sessionUser = sessionStorage.getItem('utilizadorLogado');

    if (sessionUser) {
        utilizadorLogado = JSON.parse(sessionUser);
        console.log("Utilizador Logado:", utilizadorLogado.nome, "| Tipo:", utilizadorLogado.tipo);
    } else {
        console.warn("Nenhum utilizador encontrado na sessão.");
    }

    // 2. Controlar visibilidade do botão "Novo Utilizador"
    var btnNovo = document.getElementById('btnNovoUtilizador');
    if (btnNovo) {
        if (utilizadorLogado && utilizadorLogado.tipo === 'AdminWeb') {
            btnNovo.style.display = 'block';
        } else {
            btnNovo.style.display = 'none';
        }
    }

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
        utilizadores = [];
        contadorUSER = 1;
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

    var isAdmin = (utilizadorLogado && utilizadorLogado.tipo === 'AdminWeb');

    for (var i = 0; i < utilizadores.length; i++) {
        var u = utilizadores[i];

        if (filtroTipo && u.tipo != filtroTipo) continue;
        if (filtroPesquisa && !u.nome.toLowerCase().includes(filtroPesquisa) && !u.email.toLowerCase().includes(filtroPesquisa)) continue;

        var tr = document.createElement('tr');

        var html = '<td><strong>' + u.id + '</strong></td>' +
            '<td>' + u.nome + '</td>' +
            '<td>' + u.email + '</td>' +
            '<td>' + u.departamento + '</td>' +
            '<td>' + u.tipo + '</td>';

        if (isAdmin) {
            html += '<td>' +
                '<button class="btn btn-sm btn-danger" onclick="eliminarUtilizador(\'' + u.id + '\')" title="Eliminar">' +
                '<i class="bi bi-trash"></i>' +
                '</button>' +
                '</td>';
        } else {
            html += '<td class="text-muted text-center"><small>-</small></td>';
        }

        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

function eliminarUtilizador(id) {
    if (!utilizadorLogado || utilizadorLogado.tipo !== 'AdminWeb') {
        alert("CRÍTICO: Acesso Negado! Apenas o SystemWebAdmin tem permissão para eliminar registos.");
        return;
    }

    if (utilizadorLogado.id === id) {
        alert("Operação inválida: Não pode eliminar a sua própria conta.");
        return;
    }

    if (confirm("ATENÇÃO: Tem a certeza que deseja eliminar o utilizador " + id + "? Esta ação é irreversível.")) {
        utilizadores = utilizadores.filter(function (user) {
            return user.id !== id;
        });
        guardarStorage();
        mostrarUtilizadores();
    }
}

document.getElementById('btnGuardarUtilizador').onclick = function () {
    if (!utilizadorLogado || utilizadorLogado.tipo !== 'AdminWeb') {
        alert("Acesso Negado: Não tem permissão para criar utilizadores.");
        return;
    }

    var nome = document.getElementById('userNome').value;
    var email = document.getElementById('userEmail').value;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        alert("Email inválido.");
        return;
    }
    var dept = document.getElementById('userDept').value;
    var tipo = document.getElementById('userTipo').value;

    if (!nome || !email || !dept || !tipo) {
        alert('Por favor, preencha todos os campos obrigatórios!');
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