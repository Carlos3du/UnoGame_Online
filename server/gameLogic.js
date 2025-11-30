class Card {
    constructor(color, value) {
        this.color = color;
        this.value = value;
    }
    
    canPlayOn(topCard) {
        if (this.color === 'wild') return true;
        if (topCard.color === 'wild') return true;
        return this.color === topCard.color || this.value === topCard.value;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.initialize();
        this.shuffle();
    }
    
    initialize() {
        const colors = ['red', 'yellow', 'green', 'blue'];
        const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', '+2'];
        
        for (let color of colors) {
            for (let value of values) {
                this.cards.push(new Card(color, value));
                if (value !== '0') {
                    this.cards.push(new Card(color, value));
                }
            }
        }
        
        for (let i = 0; i < 4; i++) {
            this.cards.push(new Card('wild', 'wild'));
            this.cards.push(new Card('wild', 'wilddraw4'));
        }
    }
    
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    draw() {
        return this.cards.pop();
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    // Adaptado para receber a pilha de descarte explicitamente, removendo dependência global
    refillFromDiscard(discardPile) {
        if (discardPile.length <= 1) return;
        
        // Mantém a carta do topo
        const topCard = discardPile.pop();
        
        // O resto vira o novo deck
        this.cards = [...discardPile];
        this.shuffle();
        
        // Limpa a pilha de descarte e devolve a carta do topo para ela
        // Nota: Quem chama essa função deve atualizar a discardPile original com o retorno ou limpar o array original
        return [topCard];
    }
}

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hand = [];
        this.hasCalledUno = false;
    }
    
    addCard(card) {
        this.hand.push(card);
    }
    
    playCard(cardIndex) {
        return this.hand.splice(cardIndex, 1)[0];
    }
    
    canPlay(topCard) {
        return this.hand.some(card => card.canPlayOn(topCard));
    }
}

class UnoGame {
    constructor(roomCode) {
        this.roomCode = roomCode;
        this.players = [];
        this.currentPlayerIndex = 0;
        this.direction = 1;
        this.deck = new Deck();
        this.discardPile = [];
        this.gameStarted = false;
        this.pendingColorChoice = false;
        this.winner = null;
        this.gameLog = [];
    }

    addPlayer(id, name) {
        if (this.gameStarted) return false;
        if (this.players.length >= 2) return false; // Limite de 2 jogadores conforme original, expansível
        
        this.players.push(new Player(id, name));
        return true;
    }
    
    // Método auxiliar para lidar com o deck vazio
    safeDraw() {
        if (this.deck.isEmpty()) {
            const newDiscard = this.deck.refillFromDiscard(this.discardPile);
            if (newDiscard) {
                this.discardPile = newDiscard;
                this.addToLog("Baralho reembaralhado!");
            } else if (this.deck.isEmpty()) {
                // Caso extremo: todas as cartas estão nas mãos
                return null;
            }
        }
        return this.deck.draw();
    }

    startGame() {
        if (this.players.length < 2) return false;
        this.gameStarted = true;
        this.gameLog = [];
        
        // Distribui 7 cartas para cada
        for (let player of this.players) {
            for (let i = 0; i < 7; i++) {
                player.addCard(this.deck.draw());
            }
        }
        
        // Carta inicial
        let startCard;
        do {
            startCard = this.deck.draw();
        } while (startCard.color === 'wild'); // Evita wild no início para simplificar
        
        this.discardPile.push(startCard);
        this.addToLog(`Jogo iniciado! Carta inicial: ${startCard.color} ${startCard.value}`);
        
        return this.getGameState();
    }
    
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    getTopCard() {
        return this.discardPile[this.discardPile.length - 1];
    }
    
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
    }
    
    playCard(playerId, cardIndex, chosenColor = null) {
        const player = this.getCurrentPlayer();
        
        // Validações
        if (player.id !== playerId) return { success: false, message: "Não é sua vez" };
        if (this.pendingColorChoice) return { success: false, message: "Aguardando escolha de cor" };
        if (this.winner) return { success: false, message: "Jogo acabou" };
        if (cardIndex < 0 || cardIndex >= player.hand.length) return { success: false, message: "Carta inválida" };

        const card = player.hand[cardIndex];
        const topCard = this.getTopCard();
        
        if (!card.canPlayOn(topCard)) return { success: false, message: "Jogada inválida" };
        
        // Executa a jogada
        const playedCard = player.playCard(cardIndex);
        this.discardPile.push(playedCard);
        this.addToLog(`${player.name} jogou ${playedCard.color} ${playedCard.value}`);
        
        // Verifica UNO não gritado (regra simplificada: penaliza automaticamente se tiver 1 carta e não gritou antes)
        if (player.hand.length === 1 && !player.hasCalledUno) {
            // Nota: No front original, o player gritava UNO antes de jogar a penúltima. 
            // Aqui, vamos assumir que ele deve enviar um evento 'callUno' ANTES de 'playCard'.
            // Se chegou aqui com 1 carta e flag falsa, penalidade.
            player.addCard(this.safeDraw());
            player.addCard(this.safeDraw());
            this.addToLog(`${player.name} esqueceu de gritar UNO! Comprou 2 cartas.`);
        }
        
        // Verifica Vitória
        if (player.hand.length === 0) {
            this.winner = player.name;
            this.addToLog(`${player.name} venceu a partida!`);
            return { success: true, gameState: this.getGameState() };
        }
        
        // Cartas Coringa
        if (playedCard.color === 'wild') {
            if (chosenColor) {
                // Se a cor já veio na requisição (ideal)
                this.applyColorChoice(chosenColor);
            } else {
                // Se não veio, trava o jogo esperando a cor
                this.pendingColorChoice = true;
                return { success: true, gameState: this.getGameState(), action: 'chooseColor' };
            }
        } else {
            // Efeitos especiais normais
            this.handleSpecialCard(playedCard);
            // Só passa a vez se não for Wild (Wild passa a vez após escolher a cor)
            if (playedCard.color !== 'wild') {
                this.nextPlayer();
            }
        }
        
        return { success: true, gameState: this.getGameState() };
    }

    applyColorChoice(color) {
        const topCard = this.getTopCard();
        topCard.color = color; // Muda visualmente a cor da carta na mesa
        this.pendingColorChoice = false;
        this.addToLog(`Nova cor escolhida: ${color}`);
        
        // Se for +4, o próximo compra agora
        if (topCard.value === 'wilddraw4') {
            this.handleDraw4();
        }
        
        this.nextPlayer();
    }
    
    handleSpecialCard(card) {
        const nextIdx = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        const nextP = this.players[nextIdx];

        switch (card.value) {
            case 'skip':
                this.addToLog(`${nextP.name} perdeu a vez!`);
                this.nextPlayer(); // Pula um extra (o fluxo normal já pula um no final do playCard, então chama nextPlayer aqui para somar)
                break;
            case 'reverse':
                if (this.players.length === 2) {
                    // No 1v1, reverse age como skip
                    this.addToLog(`Inverteu (Skip)! ${nextP.name} perdeu a vez.`);
                    this.nextPlayer();
                } else {
                    this.direction *= -1;
                    this.addToLog('Direção do jogo invertida!');
                }
                break;
            case '+2':
                nextP.addCard(this.safeDraw());
                nextP.addCard(this.safeDraw());
                this.addToLog(`${nextP.name} comprou 2 cartas e perdeu a vez!`);
                this.nextPlayer(); // Pula o jogador que comprou
                break;
        }
    }

    handleDraw4() {
        const nextIdx = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
        const nextP = this.players[nextIdx];
        for (let i = 0; i < 4; i++) nextP.addCard(this.safeDraw());
        this.addToLog(`${nextP.name} comprou 4 cartas e perdeu a vez!`);
        this.nextPlayer();
    }
    
    drawCard(playerId) {
        const player = this.getCurrentPlayer();
        if (player.id !== playerId) return { success: false };
        if (this.pendingColorChoice) return { success: false };
        
        // Regra original: se tiver carta jogável, não pode comprar (opcional, mantendo lógica do original)
        const topCard = this.getTopCard();
        if (player.canPlay(topCard)) {
             // Opcional: permitir blefe ou manter restrição. 
             // O original logava: "não pode comprar". Vamos manter flexível ou estrito?
             // Mantendo estrito conforme original:
             return { success: false, message: "Você tem cartas jogáveis!" };
        }

        const drawnCard = this.safeDraw();
        if (!drawnCard) return { success: false, message: "Baralho vazio" };
        
        player.addCard(drawnCard);
        this.addToLog(`${player.name} comprou uma carta`);

        // Se a carta comprada for jogável, pode jogar imediatamente (automático ou manual?)
        // O original permitia jogar ou passar. Aqui vamos simplificar: comprou, passa a vez se não jogar (mas o cliente deve decidir jogar).
        // Se a carta NÃO serve, passa a vez automaticamente.
        if (!drawnCard.canPlayOn(topCard)) {
            this.nextPlayer();
        }
        
        return { success: true, gameState: this.getGameState() };
    }
    
    callUno(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player && player.hand.length <= 2) {
            player.hasCalledUno = true;
            this.addToLog(`${player.name} gritou UNO!`);
            return { success: true, gameState: this.getGameState() };
        }
        return { success: false };
    }

    addToLog(msg) {
        this.gameLog.push(msg);
        if (this.gameLog.length > 10) this.gameLog.shift();
    }

    // Método crucial para o Frontend
    getGameState() {
        return {
            roomCode: this.roomCode,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.hand.length,
                isCurrent: p.id === this.getCurrentPlayer().id,
                hasCalledUno: p.hasCalledUno
            })),
            currentPlayerId: this.getCurrentPlayer() ? this.getCurrentPlayer().id : null,
            topCard: this.getTopCard(),
            direction: this.direction,
            gameLog: this.gameLog,
            winner: this.winner,
            isColorChoicePending: this.pendingColorChoice
            // Nota: As cartas da mão do jogador específico devem ser enviadas 
            // separadamente via socket.emit para garantir que ninguém veja as cartas do outro.
            // Ou o cliente filtra, mas enviar tudo é inseguro. 
            // Para simplicidade inicial, o servidor pode mandar 'myHand' no evento socket individual.
        };
    }

    // Helper para pegar a mão de um jogador específico (segurança)
    getPlayerHand(playerId) {
        const player = this.players.find(p => p.id === playerId);
        return player ? player.hand : [];
    }
}

module.exports = { UnoGame };