//Versões do JS (mudar para atualizar ou apagar dados)
const VERSAO_DADOS = 'v8_final'; 

//Vefiricar de imediato
(function iniciarSeguranca() {
    garantirUtilizadores();
    verificarAutenticacao();
})();

// 2. Inicializar Utilizadores
function garantirUtilizadores() {
    const versaoAtual = localStorage.getItem('versao_dados');
    
    if (versaoAtual !== VERSAO_DADOS || !localStorage.getItem('utilizadores')) {
        console.log("A atualizar base de dados de utilizadores...");
        
        const usersDefault = [
            // Admi
            { id: 'USR0001', nome: 'SystemWebAdmin', email: 'SystemWebAdmin@empresa.pt', departamento: 'TI', tipo: 'AdminWeb' },
            
            // Qualidade 
            { id: 'USR0002', nome: 'Inês Silva', email: 'qualidade@empresa.pt', departamento: 'Qualidade', tipo: 'Gestão da Qualidade' },
            
            // Responsaveis de Área
            { id: 'USR0003', nome: 'João Silva', email: 'producao@empresa.pt', departamento: 'Produção', tipo: 'Responsável de Área' },
            { id: 'USR0004', nome: 'Carlos Andrade', email: 'logistica@empresa.pt', departamento: 'Logística', tipo: 'Responsável de Área' },
            { id: 'USR0005', nome: 'Zé Manel', email: 'comercial@empresa.pt', departamento: 'Comercial', tipo: 'Responsável de Área' },
            { id: 'USR0006', nome: 'João Perestrelo', email: 'it@empresa.pt', departamento: 'TI', tipo: 'Responsável de Área' },
            
            //Users Basicos
            { id: 'USR0007', nome: 'Rodrigo Ferreira', email: 'itbasic@empresa.pt', departamento: 'TI', tipo: 'Utilizador Básico' },
            { id: 'USR0008', nome: 'Zé Manel', email: 'logisticabasic@empresa.pt', departamento: 'Logística', tipo: 'Utilizador Básico' },
            { id: 'USR0009', nome: 'Paulo Cardoso', email: 'producaobasic@empresa.pt', departamento: 'Produção', tipo: 'Utilizador Básico' },

            // Auditor Interno
            { id: 'USR0010', nome: 'António Fernandes', email: 'auditoria@empresa.pt', departamento: 'Auditoria', tipo: 'Auditor Interno' }
        ];

        localStorage.setItem('utilizadores', JSON.stringify(usersDefault));
        localStorage.setItem('contadorUSER', 13);
        localStorage.setItem('versao_dados', VERSAO_DADOS);
        
        //clean session
        sessionStorage.removeItem('utilizadorLogado');
    }
}

function verificarAutenticacao() {
    if (window.location.pathname.includes('login.html')) return;

    const utilizadorStr = sessionStorage.getItem('utilizadorLogado');

    if (!utilizadorStr) {
        window.location.href = 'login.html';
        return;
    }

    const utilizador = JSON.parse(utilizadorStr);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => atualizarNavbar(utilizador));
    } else {
        atualizarNavbar(utilizador);
    }

    // --- REGRAS DE BLOQUEIO DE PÁGINAS ---

    // 1. Regra para AUDITOR INTERNO (Apenas vê NCs)
    if (utilizador.tipo === 'Auditor Interno') {
        // Se NÃO estiver na página de NCs (e não for login), bloqueia
        if (!window.location.pathname.includes('nao-conformidades.html')) {
            document.documentElement.innerHTML = ""; 
            mostrarErroAcesso("Acesso Restrito", "Auditores Internos apenas têm acesso à gestão de Não Conformidades.");
            throw new Error("Acesso negado para Auditor.");
        }
    }

    // 2. Regra para TI (Apenas vê Utilizadores - Exemplo antigo mantido)
    if (window.location.pathname.includes('utilizadores.html')) {
        // Se for TI, OK. Se for AdminWeb, OK. O resto bloqueia.
        if (utilizador.departamento !== 'TI' && utilizador.tipo !== 'AdminWeb') {
            document.documentElement.innerHTML = ""; 
            mostrarErroAcesso("Acesso Negado", "Esta página é reservada à administração de utilizadores.");
            throw new Error("Acesso negado.");
        }
    }
}

function mostrarErroAcesso(titulo, mensagem) {
    document.body.innerHTML = `
        <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light">
            <div class="d-flex align-items-center justify-content-center vh-100">
                <div class="text-center">
                    <h1 class="display-1 fw-bold text-danger">403</h1>
                    <p class="fs-3"> <span class="text-danger">${titulo}</span></p>
                    <p class="lead">${mensagem}</p>
                    <hr>
                    <a href="login.html" class="btn btn-outline-danger" onclick="logout()">Sair</a>
                    
                    <a href="nao-conformidades.html" class="btn btn-primary ms-2">Voltar ao Início</a>
                </div>
            </div>
        </body>
    `;
}

//Atualizar navbar
function atualizarNavbar(utilizador) {
    const userIcon = document.querySelector('.bi-person-circle');
    
    if (userIcon && userIcon.parentElement) {
        const linkElement = userIcon.parentElement;
        linkElement.innerHTML = `<i class="bi bi-person-circle"></i> ${utilizador.nome} <span class="badge bg-light text-dark ms-2">${utilizador.tipo} [${utilizador.departamento}]</span>`;
        
        const ul = linkElement.closest('ul');
        if (ul && !document.getElementById('btn-logout')) {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = '<a class="nav-link text-danger" href="#" onclick="logout()" id="btn-logout"><i class="bi bi-box-arrow-right"></i> Sair</a>';
            ul.appendChild(li);
        }
    }
}

//verify perms
function temPermissaoDeVisualizar(areaDoItem) {
    const utilizador = JSON.parse(sessionStorage.getItem('utilizadorLogado'));
    if (!utilizador) return false;

    if (utilizador.tipo === 'AdminWeb' || utilizador.tipo === 'Gestão da Qualidade') return true;
    
    // O Auditor Interno vê TUDO nas NCs (para poder auditar qualquer área)
    if (utilizador.tipo === 'Auditor Interno') return true;

    if (utilizador.tipo === 'Responsável de Área') return utilizador.departamento === areaDoItem;
    if (utilizador.departamento === 'TI') return true;
    if (utilizador.tipo === 'Utilizador Básico') return utilizador.departamento === areaDoItem;

    return true; 
}

function login(email, password) {
    if (!localStorage.getItem('utilizadores')) garantirUtilizadores();
    const users = JSON.parse(localStorage.getItem('utilizadores'));
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user && password === "123") {
        sessionStorage.setItem('utilizadorLogado', JSON.stringify(user));
        return { success: true };
    } else {
        return { success: false, message: 'Dados inválidos.' };
    }
}

function logout() {
    sessionStorage.removeItem('utilizadorLogado');
    window.location.href = 'login.html';
}

function carregarSelectUsuarios(elementIds) {
    const users = JSON.parse(localStorage.getItem('utilizadores')) || [];
    const ids = Array.isArray(elementIds) ? elementIds : [elementIds];

    ids.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const valorAtual = select.value;
            while (select.options.length > 1) select.remove(1);
            
            users.forEach(u => {
                if (u.tipo !== 'Responsável de Área') return; 
                const option = document.createElement('option');
                option.value = u.nome; 
                option.text = u.nome + " (" + u.departamento + ")"; 
                select.appendChild(option);
            });
            if(valorAtual) select.value = valorAtual;
        }
    });
}