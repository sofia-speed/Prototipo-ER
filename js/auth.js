//Versões do JS (mudar para atualizar ou apagar dados)
const VERSAO_DADOS = 'v5_final'; 

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
            { id: 'USR0007', nome: 'Inês Silva', email: 'qualidade@empresa.pt', departamento: 'Qualidade', tipo: 'Gestão da Qualidade' },
            
            // Responsaveis de Área
            { id: 'USR0008', nome: 'João Silva', email: 'producao@empresa.pt', departamento: 'Produção', tipo: 'Responsável de Área' },
            { id: 'USR0009', nome: 'Carlos Andrade', email: 'logistica@empresa.pt', departamento: 'Logística', tipo: 'Responsável de Área' },
            { id: 'USR0010', nome: 'Zé Manel', email: 'comercial@empresa.pt', departamento: 'Comercial', tipo: 'Responsável de Área' },
            
            // TI Basico
            { id: 'USR0011', nome: 'Rodrigo Ferreira', email: 'it@empresa.pt', departamento: 'TI', tipo: 'Utilizador Básico' },
            
            // TI Responsavel
            { id: 'USR0012', nome: 'João Silva', email: 'joaosilva@empresa.pt', departamento: 'TI', tipo: 'Responsável de Área' }
        ];

        localStorage.setItem('utilizadores', JSON.stringify(usersDefault));
        localStorage.setItem('contadorUSER', 13);
        localStorage.setItem('versao_dados', VERSAO_DADOS);
        
        //clean session
        sessionStorage.removeItem('utilizadorLogado');
    }
}

//berificar Sessao e permissoes
function verificarAutenticacao() {
    if (window.location.pathname.includes('login.html')) return;

    // MUDANÇA: Chave agora é 'utilizadorLogado' (PT-PT)
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

    // Regra de Segurança TI (Página Utilizadores)
    if (window.location.pathname.includes('utilizadores.html')) {
        if (utilizador.departamento !== 'TI') {
            document.documentElement.innerHTML = ""; 
            mostrarErroAcesso();
            throw new Error("Acesso negado: Departamento " + utilizador.departamento + " não autorizado.");
        }
    }
}

//Ecraa de acesso negado
function mostrarErroAcesso() {
    document.body.innerHTML = `
        <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light">
            <div class="d-flex align-items-center justify-content-center vh-100">
                <div class="text-center">
                    <h1 class="display-1 fw-bold text-danger">403</h1>
                    <p class="fs-3"> <span class="text-danger">Acesso Bloqueado!</span></p>
                    <p class="lead">Esta página é exclusiva do departamento de TI.</p>
                    <hr>
                    <a href="nao-conformidades.html" class="btn btn-primary">Voltar ao Início</a>
                    <a href="login.html" class="btn btn-outline-danger ms-2" onclick="logout()">Sair</a>
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
    if (utilizador.tipo === 'Responsável de Área') return utilizador.departamento === areaDoItem;
    if (utilizador.departamento === 'TI') return true;

    return true; 
}

function login(email, password) {
    if (!localStorage.getItem('utilizadores')) garantirUtilizadores();
    
    const users = JSON.parse(localStorage.getItem('utilizadores'));
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user && password === "123") { // Password fixa
        sessionStorage.setItem('utilizadorLogado', JSON.stringify(user));
        return { success: true };
    } else {
        return { success: false, message: 'Email incorreto ou password inválida.' };
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