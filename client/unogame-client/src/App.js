// client/src/App.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import './App.css'; 

// Conecta ao backend na porta 3001
const socket = io.connect("http://localhost:3001");

function App() {
  const [gameState, setGameState] = useState(null);
  const [inGame, setInGame] = useState(false);
  const [roomCode, setRoomCode] = useState(""); // Armazena o código da sala atual

  useEffect(() => {
    // Listener: Quando o jogo inicia (sala cheia)
    socket.on('gameStart', (data) => {
      console.log("Jogo iniciado!", data);
      setGameState(data);
      setRoomCode(data.roomCode); // Salva o código vindo do server
      setInGame(true);
    });

    // Listener: Atualizações de jogadas
    socket.on('updateState', (data) => {
      setGameState(data);
    });
    
    // Listener: Erros (sala cheia, não existe, etc)
    socket.on('error', (message) => {
        alert(message);
    });
    
    // Listener: Apenas entrou na sala (feedback visual para quem criou)
    socket.on('gameCreated', (data) => {
        setRoomCode(data.roomCode);
        alert(`${data.message}\nCódigo da sala: ${data.roomCode}`);
    });

    // Cleanup ao desmontar
    return () => {
      socket.off('gameStart');
      socket.off('updateState');
      socket.off('error');
      socket.off('gameCreated');
    };
  }, []);

  return (
    <div className="App">
      {!inGame ? (
        // Se não está em jogo, mostra o Lobby
        <Lobby socket={socket} />
      ) : (
        // Se o jogo começou, mostra o Tabuleiro
        <GameRoom 
            socket={socket} 
            gameState={gameState} 
            roomCode={roomCode} 
        />
      )}
    </div>
  );
}

export default App;