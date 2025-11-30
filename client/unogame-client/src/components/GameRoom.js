import React, { useState, useEffect } from 'react';

function GameRoom({ socket, gameState, roomCode }) {
    const [showColorModal, setShowColorModal] = useState(false);
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);

    // Identifica o jogador local
    const myPlayer = gameState.players.find(p => p.id === socket.id);
    const isMyTurn = gameState.currentPlayerId === socket.id;
    
    // Separa jogadores (Eu vs Oponentes)
    // Nota: O servidor deve enviar 'hand' apenas para o socket dono. 
    // Assumimos aqui que gameState.hand contém as cartas do jogador local.
    const myHand = gameState.hand || []; 
    const otherPlayers = gameState.players.filter(p => p.id !== socket.id);

    // Handlers de Ação
    const handleCardClick = (card, index) => {
        if (!isMyTurn) return;

        // Se for carta coringa, precisamos escolher a cor primeiro
        if (card.color === 'wild') {
            setSelectedCardIndex(index);
            setShowColorModal(true);
        } else {
            // Jogada normal
            socket.emit('playCard', { roomCode, cardIndex: index });
        }
    };

    const handleColorChoice = (color) => {
        socket.emit('playCard', { 
            roomCode, 
            cardIndex: selectedCardIndex, 
            color: color 
        });
        setShowColorModal(false);
        setSelectedCardIndex(null);
    };

    const handleDrawCard = () => {
        if (isMyTurn) {
            socket.emit('drawCard', { roomCode });
        }
    };

    const handleCallUno = () => {
        socket.emit('callUno', { roomCode });
    };

    const handleNewGame = () => {
        // Implementar lógica de reset se necessário ou recarregar página
        window.location.reload();
    };

    if (!gameState) return <div className="waiting-message">Carregando jogo...</div>;

    return (
        <div className="game-container">
            <header>
                <h1>UNO</h1>
                <div className="scoreboard">
                    {/* Renderiza placar de todos os jogadores */}
                    {gameState.players.map(player => (
                        <div key={player.id} className={`player-score ${player.isCurrent ? 'active' : ''}`}>
                            <span className="player-name">{player.name}</span>
                            <span className="score">{player.cardCount} cartas</span>
                        </div>
                    ))}
                </div>
            </header>

            <main className="game-board">
                {/* Área do Deck e Descarte */}
                <div className="deck-area">
                    <div className="draw-pile" onClick={handleDrawCard} style={{ cursor: isMyTurn ? 'pointer' : 'default' }}>
                        <div className="card card-back"></div>
                    </div>
                    <div className="discard-pile">
                        {gameState.topCard && (
                            <div className={`card ${gameState.topCard.color}`}>
                                {gameState.topCard.value}
                            </div>
                        )}
                    </div>
                </div>

                {/* Informações do Jogo */}
                <div className="game-info">
                    <div className={`current-player ${isMyTurn ? 'highlight' : ''}`}>
                        Vez de: <span>{gameState.players.find(p => p.isCurrent)?.name}</span>
                    </div>
                    <div className="game-actions">
                        <button 
                            className="action-btn" 
                            onClick={handleDrawCard}
                            disabled={!isMyTurn}
                            style={{ background: !isMyTurn ? '#ccc' : '#ffe100' }}
                        >
                            Comprar Carta
                        </button>
                        <button 
                            className="action-btn uno-btn" 
                            onClick={handleCallUno}
                        >
                            UNO!
                        </button>
                    </div>
                </div>

                {/* Área das Mãos */}
                <div className="hands-area">
                    {/* Mão do Jogador Local */}
                    <div className="player-hand">
                        <h3>Suas Cartas ({myPlayer?.name}):</h3>
                        <div className="cards">
                            {myHand.map((card, index) => (
                                <div 
                                    key={index} 
                                    className={`card ${card.color} ${isMyTurn ? 'playable' : ''}`}
                                    onClick={() => handleCardClick(card, index)}
                                >
                                    {card.value}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mão dos Oponentes (Apenas versos) */}
                    {otherPlayers.map(player => (
                        <div key={player.id} className="player-hand">
                            <h3>Cartas de {player.name}:</h3>
                            <div className="cards">
                                {Array.from({ length: player.cardCount }).map((_, i) => (
                                    <div key={i} className="card card-back"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Log do Jogo */}
            <div className="game-log">
                <h3>Log do Jogo</h3>
                <ul>
                    {gameState.gameLog && gameState.gameLog.slice().reverse().map((msg, index) => (
                        <li key={index}>{msg}</li>
                    ))}
                </ul>
            </div>

            {/* Modal de Escolha de Cor */}
            {showColorModal && (
                <div className="modal show">
                    <div className="modal-content">
                        <h3>Escolha uma cor:</h3>
                        <div className="color-options">
                            {['red', 'yellow', 'green', 'blue'].map(color => (
                                <button 
                                    key={color}
                                    className={`color-btn ${color}`} 
                                    onClick={() => handleColorChoice(color)}
                                ></button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Game Over */}
            {gameState.winner && (
                <div className="modal show">
                    <div className="modal-content">
                        <h2>Jogo Terminou!</h2>
                        <p>{gameState.winner} venceu!</p>
                        <button className="action-btn" onClick={handleNewGame}>Sair</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GameRoom;