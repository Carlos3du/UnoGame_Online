import React, { useState } from 'react';

function Lobby({ socket }) {
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');

    const handleCreateGame = (e) => {
        e.preventDefault();
        if (playerName && roomCode) {
            // Emite evento para criar uma nova sala no servidor
            socket.emit('createGame', roomCode, playerName);
        } else {
            alert("Preencha o nome e o código da sala!");
        }
    };

    const handleJoinGame = (e) => {
        e.preventDefault();
        if (playerName && roomCode) {
            // Emite evento para entrar em uma sala existente
            socket.emit('joinGame', roomCode, playerName);
        } else {
            alert("Preencha o nome e o código da sala!");
        }
    };

    return (
        <div className="container">
            <header>
                <h1>UNO</h1>
                <p>Multiplayer Online</p>
            </header>
            
            <main className="setup-container">
                <form>
                    <div className="player-setup">
                        <label htmlFor="playerName">Seu Apelido:</label>
                        <input 
                            type="text" 
                            id="playerName" 
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Ex: Carlos"
                            required 
                        />
                    </div>
                    
                    <div className="player-setup">
                        <label htmlFor="roomCode">Código da Sala:</label>
                        <input 
                            type="text" 
                            id="roomCode" 
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            placeholder="Ex: SALA1"
                            required 
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            type="button" 
                            className="start-game-btn" 
                            onClick={handleCreateGame}
                        >
                            Criar Sala
                        </button>
                        
                        <button 
                            type="button" 
                            className="start-game-btn" 
                            style={{ background: 'linear-gradient(45deg, #0051ff, #00a2ff)' }} // Diferenciar visualmente
                            onClick={handleJoinGame}
                        >
                            Entrar na Sala
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default Lobby;