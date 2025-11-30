const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { UnoGame } = require("./gameLogic");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const games = {};

// Função auxiliar para enviar o estado correto para cada jogador
const broadcastGameState = (roomCode) => {
    const game = games[roomCode];
    if (!game) return;

    const baseState = game.getGameState(); // Estado público (mesa, placar, vez)

    // Para cada jogador na sala, enviamos o estado público + a mão DELE
    game.players.forEach(player => {
        const socketId = player.id;
        
        // Cria um objeto de estado personalizado para este jogador
        const personalState = {
            ...baseState,
            hand: player.hand // Anexa as cartas específicas deste jogador
        };

        io.to(socketId).emit('updateState', personalState);
    });
    
    // Se o jogo acabou ou ainda não começou, precisamos garantir que 'gameStart' também use essa lógica
    // Mas 'updateState' é suficiente para o front se atualizar se usarmos ele sempre.
};

io.on('connection', (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    socket.on('createGame', (roomCode, playerName) => {
        if (games[roomCode]) {
            socket.emit('error', 'Esta sala já existe!');
            return;
        }
        
        games[roomCode] = new UnoGame(roomCode);
        games[roomCode].addPlayer(socket.id, playerName);
        socket.join(roomCode);
        socket.emit('gameCreated', { roomCode, message: 'Aguardando oponente...' });
    });

    socket.on('joinGame', (roomCode, playerName) => {
        const game = games[roomCode];
        if (!game) {
            socket.emit('error', 'Sala não encontrada!');
            return;
        }

        // Se já tem 2 jogadores e este socket não é um deles, bloqueia
        // (Lógica simplificada. Num app real tratariamos reconexão)
        if (game.players.length >= 2) { 
             socket.emit('error', 'Sala cheia!');
             return;
        }

        const added = game.addPlayer(socket.id, playerName);

        if (added) {
            socket.join(roomCode);
            
            if (game.players.length === 2) {
                console.log(`Iniciando jogo na sala ${roomCode}`);
                game.startGame();
                
                // Dispara o evento de início, mas usando o broadcast personalizado
                // Precisamos emitir 'gameStart' para o front mudar de tela, 
                // mas enviando os dados personalizados
                game.players.forEach(p => {
                    const personalState = {
                        ...game.getGameState(),
                        hand: p.hand
                    };
                    io.to(p.id).emit('gameStart', personalState);
                });
            }
        }
    });

    socket.on('playCard', ({ roomCode, cardIndex, color }) => {
        const game = games[roomCode];
        if (game) {
            const result = game.playCard(socket.id, cardIndex, color);
            if (result.success) {
                broadcastGameState(roomCode); // Atualiza todos
            } else {
                socket.emit('error', result.message);
            }
        }
    });

    socket.on('drawCard', ({ roomCode }) => {
        const game = games[roomCode];
        if (game) {
            const result = game.drawCard(socket.id);
            if (result.success) {
                broadcastGameState(roomCode); // Atualiza todos (mostra nova carta na mão)
            } else {
                socket.emit('error', result.message);
            }
        }
    });
    
    socket.on('callUno', ({ roomCode }) => {
        const game = games[roomCode];
        if (game) {
            const result = game.callUno(socket.id);
            if (result.success) {
                broadcastGameState(roomCode);
            }
        }
    });

    socket.on('disconnect', () => {
        // Lógica de desconexão (opcional: limpar sala)
    });
});

server.listen(3001, () => {
    console.log('SERVIDOR RODANDO NA PORTA 3001');
});