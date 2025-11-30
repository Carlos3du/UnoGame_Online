# 🃏 UNO Game - Multiplayer Fullstack

Este é um jogo de UNO Multiplayer desenvolvido com **React** (Frontend) e **Node.js + Socket.io** (Backend), permitindo que dois jogadores joguem em tempo real em dispositivos ou abas diferentes.

## 🚀 Tecnologias Usadas

* **Frontend:** React.js, CSS3
* **Backend:** Node.js, Express
* **Comunicação Real-time:** Socket.io

---

## 📦 Pré-requisitos

Certifique-se de ter o **Node.js** instalado na sua máquina.

---

## 🛠️ Instalação e Configuração

Como o projeto é dividido em duas partes (Cliente e Servidor), você precisará instalar as dependências em ambas as pastas.

### 1. Configurar o Servidor (Backend)

Abra um terminal e execute:

```bash
cd server
npm install
(Isso instalará o express, socket.io e cors)

2. Configurar o Cliente (Frontend)
Abra outro terminal (mantenha o anterior aberto ou volte para a raiz) e execute:

Bash

cd client
npm install
(Isso instalará o react, react-dom, react-scripts e socket.io-client)

▶️ Como Rodar o Projeto
Você precisará de dois terminais rodando simultaneamente.

Passo 1: Iniciar o Backend
No terminal da pasta /server:

Bash

node index.js
✅ Você deve ver a mensagem: SERVIDOR RODANDO NA PORTA 3001

Passo 2: Iniciar o Frontend
No terminal da pasta /client:

Bash

npm start
✅ Isso abrirá o navegador automaticamente em http://localhost:3000.

🎮 Como Jogar (Testando Multiplayer)
Para simular uma partida multiplayer no seu próprio computador:

Jogador 1 (Criar Sala):

Acesse http://localhost:3000 no seu navegador.

Apelido: Digite Jogador1.

Código da Sala: Digite SALA1.

Clique em "Criar Sala".

Status: Você verá a mensagem "Aguardando oponente...".

Jogador 2 (Entrar na Sala):

Abra uma nova aba (ou aba anônima) e acesse http://localhost:3000.

Apelido: Digite Jogador2.

Código da Sala: Digite o mesmo código: SALA1.

Clique em "Entrar na Sala".

Início do Jogo:

Assim que o segundo jogador entrar, o jogo iniciará automaticamente em ambas as telas.

As cartas serão distribuídas e o jogo indicará de quem é a vez.

🐛 Solução de Problemas Comuns
Erro: "Address already in use":

Significa que a porta 3000 ou 3001 já está ocupada. Feche outros terminais Node.js abertos ou reinicie o computador.

Jogo não conecta:

Verifique se o backend está rodando (node index.js). Sem ele, o frontend não consegue criar salas.

Não consigo comprar cartas:

O jogo segue a regra estrita do UNO: se você tem uma carta jogável na mão, o botão de comprar fica desabilitado. Se quiser testar livremente, edite o arquivo server/gameLogic.js e comente a verificação no método drawCard.

📂 Estrutura do Projeto
/server: Contém a lógica do jogo (gameLogic.js) e o servidor socket (index.js).

/client: Contém a interface React (App.js, components/).