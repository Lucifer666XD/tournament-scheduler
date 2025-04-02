import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Particles from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim'; // Use loadSlim instead of loadFull
import Confetti from 'react-confetti';
import './App.css';

// Memoize Match component to prevent unnecessary re-renders
const Match = React.memo(({ match, roundIndex, matchIndex, bracketType, setWinner }) => (
  <motion.div
    className="match"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      className={`team ${match.winner === match.team1 ? 'winner' : ''}`}
      onClick={() =>
        match.team1 && match.team1 !== 'BYE' && !match.winner && setWinner(roundIndex, matchIndex, match.team1, bracketType)
      }
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {match.team1 || 'TBD'}
      {match.winner === match.team1 && (
        <Confetti
          width={200}
          height={100}
          numberOfPieces={50}
          recycle={false}
          run={true}
        />
      )}
    </motion.div>
    <motion.div
      className={`team ${match.winner === match.team2 ? 'winner' : ''}`}
      onClick={() =>
        match.team2 && match.team2 !== 'BYE' && !match.winner && setWinner(roundIndex, matchIndex, match.team2, bracketType)
      }
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {match.team2 || 'TBD'}
      {match.winner === match.team2 && (
        <Confetti
          width={200}
          height={100}
          numberOfPieces={50}
          recycle={false}
          run={true}
        />
      )}
    </motion.div>
  </motion.div>
));

// Memoize Round component
const Round = React.memo(({ round, roundIndex, bracketType, setWinner, tournamentType }) => (
  <motion.div
    className={`round ${tournamentType}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: roundIndex * 0.2 }}
  >
    <h3>Round {roundIndex + 1}</h3>
    {round.map((match, index) => (
      <Match
        key={`${roundIndex}-${index}`}
        match={match}
        roundIndex={roundIndex}
        matchIndex={index}
        bracketType={bracketType}
        setWinner={setWinner}
      />
    ))}
  </motion.div>
));

// Points Table component for Round Robin
const PointsTable = ({ teams, bracket }) => {
  const calculatePoints = () => {
    const points = teams.reduce((acc, team) => {
      acc[team] = { played: 0, wins: 0, points: 0 };
      return acc;
    }, {});

    bracket.forEach((round) => {
      round.forEach((match) => {
        if (match.winner) {
          points[match.team1].played += 1;
          points[match.team2].played += 1;
          points[match.winner].wins += 1;
          points[match.winner].points += 1;
        }
      });
    });

    return Object.entries(points).map(([team, stats]) => ({
      team,
      ...stats,
    }));
  };

  const pointsData = calculatePoints();
  const allMatchesPlayed = bracket.every((round) =>
    round.every((match) => match.winner)
  );
  const winner = allMatchesPlayed
    ? pointsData.reduce((a, b) => (a.points > b.points ? a : b)).team
    : null;

  return (
    <motion.div
      className="points-table"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Points Table</h2>
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Played</th>
            <th>Wins</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {pointsData.map((row, index) => (
            <tr key={index}>
              <td>{row.team}</td>
              <td>{row.played}</td>
              <td>{row.wins}</td>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {winner && (
        <motion.div
          className="winner-bracket"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <h2>🏆 Tournament Winner 🏆</h2>
          <p>{winner}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

function App() {
  const [teams, setTeams] = useState([]);
  const [teamInput, setTeamInput] = useState('');
  const [bracket, setBracket] = useState([]);
  const [tournamentType, setTournamentType] = useState('single');
  const [winner, setWinnerState] = useState(null);
  const [finalMatchup, setFinalMatchup] = useState(null);

  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine); // Use loadSlim instead of loadFull
  }, []);

  const addTeam = () => {
    if (teamInput.trim() && !teams.includes(teamInput.trim())) {
      setTeams([...teams, teamInput.trim()]);
      setTeamInput('');
    }
  };

  const generateBracket = () => {
    if (teams.length < 2) {
      alert('Please add at least 2 teams');
      return;
    }
    setWinnerState(null);
    setFinalMatchup(null);
    switch (tournamentType) {
      case 'single':
        generateSingleElimination();
        break;
      case 'double':
        generateDoubleElimination();
        break;
      case 'roundRobin':
        generateRoundRobin();
        break;
      default:
        break;
    }
  };

  const generateSingleElimination = () => {
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    const paddedTeams = [...teams];
    while (paddedTeams.length < nextPowerOf2) paddedTeams.push('BYE');

    const firstRound = [];
    for (let i = 0; i < paddedTeams.length; i += 2) {
      firstRound.push({ team1: paddedTeams[i], team2: paddedTeams[i + 1], winner: null });
    }

    const newBracket = [firstRound];
    let currentRound = firstRound;
    while (currentRound.length > 1) {
      const nextRound = [];
      for (let i = 0; i < currentRound.length; i += 2) {
        nextRound.push({ team1: null, team2: null, winner: null });
      }
      newBracket.push(nextRound);
      currentRound = nextRound;
    }
    setBracket(newBracket);
  };

  const generateDoubleElimination = () => {
    let teamCount = teams.length;
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const paddedTeams = [...teams];
    while (paddedTeams.length < nextPowerOf2) paddedTeams.push('BYE');

    const winnersBracket = [];
    const losersBracket = [];
    const firstRound = [];
    for (let i = 0; i < paddedTeams.length; i += 2) {
      firstRound.push({ team1: paddedTeams[i], team2: paddedTeams[i + 1], winner: null });
    }
    winnersBracket.push(firstRound);

    const winnerRounds = Math.log2(nextPowerOf2);
    for (let i = 1; i < winnerRounds; i++) {
      const matchesInRound = nextPowerOf2 / Math.pow(2, i + 1);
      const round = Array(matchesInRound).fill().map(() => ({
        team1: null,
        team2: null,
        winner: null
      }));
      winnersBracket.push(round);
    }

    const loserRoundCount = 2 * Math.log2(nextPowerOf2) - 1;
    const firstLosersRound = Array(Math.floor(nextPowerOf2/4)).fill().map(() => ({
      team1: null,
      team2: null,
      winner: null
    }));
    losersBracket.push(firstLosersRound);

    for (let i = 1; i < loserRoundCount; i++) {
      let matchCount;
      if (i % 2 === 0) {
        matchCount = Math.ceil(losersBracket[i-1].length / 2);
      } else if (i === 1) {
        matchCount = Math.floor(nextPowerOf2/4);
      } else {
        matchCount = losersBracket[i-1].length;
      }
      const round = Array(matchCount).fill().map(() => ({
        team1: null,
        team2: null,
        winner: null
      }));
      losersBracket.push(round);
    }

    const finals = [
      { team1: null, team2: null, winner: null, isFinal: true },
      { team1: null, team2: null, winner: null, isFinal: true }
    ];

    setBracket({ winners: winnersBracket, losers: losersBracket, finals: finals });
    setFinalMatchup({ winnersBracketWinner: null, losersBracketWinner: null, firstMatchWinner: null });
  };

  const setDoubleEliminationWinner = useCallback((roundIndex, matchIndex, team, bracketType) => {
    setBracket(prevBracket => {
      const newBracket = JSON.parse(JSON.stringify(prevBracket));
      
      if (bracketType === 'winners') {
        const currentMatch = newBracket.winners[roundIndex][matchIndex];
        const loser = currentMatch.team1 === team ? currentMatch.team2 : currentMatch.team1;
        currentMatch.winner = team;
        
        if (roundIndex < newBracket.winners.length - 1) {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const isTeam1 = matchIndex % 2 === 0;
          if (isTeam1) {
            newBracket.winners[roundIndex + 1][nextMatchIndex].team1 = team;
          } else {
            newBracket.winners[roundIndex + 1][nextMatchIndex].team2 = team;
          }
        } else if (roundIndex === newBracket.winners.length - 1) {
          newBracket.finals[0].team1 = team;
          setFinalMatchup(prev => ({ ...prev, winnersBracketWinner: team }));
        }
        
        if (loser && loser !== 'BYE') {
          if (roundIndex === 0) {
            const loserMatchIndex = Math.floor(matchIndex / 2);
            if (matchIndex % 2 === 0) {
              newBracket.losers[0][loserMatchIndex].team1 = loser;
            } else {
              newBracket.losers[0][loserMatchIndex].team2 = loser;
            }
          } else {
            const targetLosersRound = Math.min(roundIndex * 2, newBracket.losers.length - 1);
            if (targetLosersRound < newBracket.losers.length) {
              const loserMatchIndex = Math.min(
                Math.floor(matchIndex),
                newBracket.losers[targetLosersRound].length - 1
              );
              newBracket.losers[targetLosersRound][loserMatchIndex].team2 = loser;
            }
          }
        }
      } else if (bracketType === 'losers') {
        const currentMatch = newBracket.losers[roundIndex][matchIndex];
        currentMatch.winner = team;
        
        const nextRoundIndex = roundIndex + 1;
        if (nextRoundIndex < newBracket.losers.length) {
          let nextMatchIndex;
          if (nextRoundIndex % 2 === 0) {
            nextMatchIndex = Math.floor(matchIndex / 2);
          } else {
            nextMatchIndex = matchIndex;
          }
          
          if (nextMatchIndex < newBracket.losers[nextRoundIndex].length) {
            if (nextRoundIndex % 2 === 0) {
              const isTeam1 = matchIndex % 2 === 0;
              if (isTeam1) {
                newBracket.losers[nextRoundIndex][nextMatchIndex].team1 = team;
              } else {
                newBracket.losers[nextRoundIndex][nextMatchIndex].team2 = team;
              }
            } else {
              newBracket.losers[nextRoundIndex][nextMatchIndex].team1 = team;
            }
          }
        } else if (roundIndex === newBracket.losers.length - 1) {
          newBracket.finals[0].team2 = team;
          setFinalMatchup(prev => ({ ...prev, losersBracketWinner: team }));
        }
      } else if (bracketType === 'finals') {
        const currentMatch = newBracket.finals[matchIndex];
        currentMatch.winner = team;
        
        if (matchIndex === 0) {
          setFinalMatchup(prev => ({ ...prev, firstMatchWinner: team }));
          if (team === newBracket.finals[0].team2) {
            newBracket.finals[1].team1 = newBracket.finals[0].team1;
            newBracket.finals[1].team2 = newBracket.finals[0].team2;
          } else {
            setWinnerState(team);
          }
        } else if (matchIndex === 1) {
          setWinnerState(team);
        }
      }
      
      return newBracket;
    });
  }, []);

  const generateRoundRobin = () => {
    const rounds = [];
    let allTeams = [...teams];
    if (allTeams.length % 2 !== 0) allTeams.push('BYE');

    const n = allTeams.length;
    for (let round = 0; round < n - 1; round++) {
      const roundMatches = [];
      for (let i = 0; i < n / 2; i++) {
        const team1 = allTeams[i];
        const team2 = allTeams[n - 1 - i];
        if (team1 !== 'BYE' && team2 !== 'BYE') {
          roundMatches.push({ team1, team2, winner: null });
        }
      }
      rounds.push(roundMatches);
      allTeams = [allTeams[0], ...allTeams.slice(2), allTeams[1]];
    }
    setBracket(rounds);
  };

  const setWinner = useCallback((roundIndex, matchIndex, team, bracketType = 'winners') => {
    const newBracket = tournamentType === 'double' ? { ...bracket } : [...bracket];
    if (tournamentType === 'double') {
      setDoubleEliminationWinner(roundIndex, matchIndex, team, bracketType);
    } else {
      newBracket[roundIndex][matchIndex].winner = team;
      if (roundIndex + 1 < newBracket.length && tournamentType === 'single') {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isTeam1 = matchIndex % 2 === 0;
        if (isTeam1) newBracket[roundIndex + 1][nextMatchIndex].team1 = team;
        else newBracket[roundIndex + 1][nextMatchIndex].team2 = team;
      }
      
      setBracket(newBracket);

      if (tournamentType === 'single' && roundIndex === newBracket.length - 1) {
        setWinnerState(team);
      }
    }
  }, [bracket, tournamentType, setDoubleEliminationWinner]);

  return (
    <div className="app-container">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 120,
          particles: {
            number: { value: 50, density: { enable: true, value_area: 800 } },
            color: { value: "#3b82f6" },
            shape: { type: "circle" },
            opacity: { value: 0.5 },
            size: { value: 3 },
            move: { enable: true, speed: 1, direction: "none", random: true }
          }
        }}
      />
      <motion.h1
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        Tournament Scheduler
      </motion.h1>
      <div className="input-container">
        <select
          value={tournamentType}
          onChange={(e) => setTournamentType(e.target.value)}
        >
          <option value="single">Single Elimination</option>
          <option value="double">Double Elimination</option>
          <option value="roundRobin">Round Robin</option>
        </select>
        <input
          value={teamInput}
          onChange={(e) => setTeamInput(e.target.value)}
          placeholder="Enter team name"
          onKeyPress={(e) => e.key === 'Enter' && addTeam()}
        />
        <button onClick={addTeam}>Add Team</button>
        <button onClick={generateBracket}>Generate Bracket</button>
      </div>
      <motion.div
        className="teams-list"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3>Teams: {teams.length}</h3>
        {teams.length > 0 ? (
          <ul>
            {teams.map((team, index) => (
              <motion.li
                key={index}
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {team}
              </motion.li>
            ))}
          </ul>
        ) : (
          <p>No teams added yet.</p>
        )}
      </motion.div>
      <div className="bracket-container">
        {tournamentType === 'double' && bracket.winners ? (
          <>
            <div>
              <h2>Winners Bracket</h2>
              {bracket.winners?.map((round, index) => (
                <Round
                  key={`winners-${index}`}
                  round={round}
                  roundIndex={index}
                  bracketType="winners"
                  setWinner={setWinner}
                  tournamentType={tournamentType}
                />
              ))}
            </div>
            <div>
              <h2>Losers Bracket</h2>
              {bracket.losers?.map((round, index) => (
                <Round
                  key={`losers-${index}`}
                  round={round}
                  roundIndex={index}
                  bracketType="losers"
                  setWinner={setWinner}
                  tournamentType={tournamentType}
                />
              ))}
            </div>
            <div>
              <h2>Finals</h2>
              <Round
                key="finals-0"
                round={[bracket.finals[0]]}
                roundIndex={0}
                bracketType="finals"
                setWinner={setWinner}
                tournamentType={tournamentType}
              />
              {finalMatchup?.firstMatchWinner === finalMatchup?.losersBracketWinner && (
                <Round
                  key="finals-1"
                  round={[bracket.finals[1]]}
                  roundIndex={1}
                  bracketType="finals"
                  setWinner={setWinner}
                  tournamentType={tournamentType}
                />
              )}
            </div>
          </>
        ) : (
          bracket.map && bracket.map((round, index) => (
            <Round
              key={`main-${index}`}
              round={round}
              roundIndex={index}
              bracketType="main"
              setWinner={setWinner}
              tournamentType={tournamentType}
            />
          ))
        )}
      </div>
      {tournamentType === 'roundRobin' && bracket.length > 0 && (
        <PointsTable teams={teams} bracket={bracket} />
      )}
      {winner && (
        <motion.div
          className="winner-bracket"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <h2>🏆 Tournament Winner 🏆</h2>
          <p>{winner}</p>
        </motion.div>
      )}
    </div>
  );
}

export default App;