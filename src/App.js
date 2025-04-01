import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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
    >
      {match.team1 || 'TBD'}
    </motion.div>
    <motion.div
      className={`team ${match.winner === match.team2 ? 'winner' : ''}`}
      onClick={() =>
        match.team2 && match.team2 !== 'BYE' && !match.winner && setWinner(roundIndex, matchIndex, match.team2, bracketType)
      }
      whileHover={{ scale: 1.05 }}
    >
      {match.team2 || 'TBD'}
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
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    const paddedTeams = [...teams];
    while (paddedTeams.length < nextPowerOf2) paddedTeams.push('BYE');
  
    // Initialize brackets
    const winnersBracket = [];
    const losersBracket = [];
    
    // Generate first round of winners bracket
    const firstRound = [];
    for (let i = 0; i < paddedTeams.length; i += 2) {
      firstRound.push({ team1: paddedTeams[i], team2: paddedTeams[i + 1], winner: null });
    }
    winnersBracket.push(firstRound);
  
    // Calculate number of rounds needed
    const totalRounds = Math.log2(nextPowerOf2);
    
    // Generate subsequent winners bracket rounds
    for (let i = 1; i < totalRounds; i++) {
      const matchesInRound = nextPowerOf2 / Math.pow(2, i + 1);
      const round = Array(matchesInRound).fill().map(() => ({
        team1: null,
        team2: null,
        winner: null
      }));
      winnersBracket.push(round);
    }
  
    // Generate losers bracket structure
    // First losers round (from first winners round losers)
    losersBracket.push(Array(firstRound.length / 2).fill().map(() => ({
      team1: null,
      team2: null,
      winner: null
    })));
  
    // Generate subsequent losers rounds
    for (let i = 0; i < totalRounds - 1; i++) {
      const matchesInRound = nextPowerOf2 / Math.pow(2, i + 2);
      if (matchesInRound >= 1) {
        const round = Array(Math.ceil(matchesInRound)).fill().map(() => ({
          team1: null,
          team2: null,
          winner: null
        }));
        losersBracket.push(round);
      }
    }
  
    // Add grand final
    winnersBracket.push([{ team1: null, team2: null, winner: null }]);
  
    setBracket({ winners: winnersBracket, losers: losersBracket });
  };
  
  const setDoubleEliminationWinner = useCallback((roundIndex, matchIndex, team, bracketType = 'winners') => {
    const newBracket = { ...bracket };
    const winners = [...newBracket.winners];
    const losers = [...newBracket.losers];
  
    if (bracketType === 'winners') {
      const currentMatch = winners[roundIndex][matchIndex];
      const loser = currentMatch.team1 === team ? currentMatch.team2 : currentMatch.team1;
      currentMatch.winner = team;
  
      // Move winner to next winners round
      if (roundIndex < winners.length - 1) {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isTeam1 = matchIndex % 2 === 0;
        if (isTeam1) {
          winners[roundIndex + 1][nextMatchIndex].team1 = team;
        } else {
          winners[roundIndex + 1][nextMatchIndex].team2 = team;
        }
      }
  
      // Move loser to losers bracket
      if (loser && loser !== 'BYE') {
        if (roundIndex === 0) {
          // First round losers
          const loserMatchIndex = Math.floor(matchIndex / 2);
          if (matchIndex % 2 === 0) {
            losers[0][loserMatchIndex].team1 = loser;
          } else {
            losers[0][loserMatchIndex].team2 = loser;
          }
        } else {
          // Subsequent rounds losers
          const loserRoundIndex = Math.floor(roundIndex / 2);
          const loserMatchIndex = Math.floor(matchIndex / 2);
          if (losers[loserRoundIndex + 1]) {
            if (matchIndex % 2 === 0) {
              losers[loserRoundIndex + 1][loserMatchIndex].team1 = loser;
            } else {
              losers[loserRoundIndex + 1][loserMatchIndex].team2 = loser;
            }
          }
        }
      }
    } else {
      // Handle losers bracket
      const currentMatch = losers[roundIndex][matchIndex];
      currentMatch.winner = team;
  
      // Move winner to next losers round or grand final
      if (roundIndex < losers.length - 1) {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isTeam1 = matchIndex % 2 === 0;
        if (isTeam1) {
          losers[roundIndex + 1][nextMatchIndex].team1 = team;
        } else {
          losers[roundIndex + 1][nextMatchIndex].team2 = team;
        }
      } else if (roundIndex === losers.length - 1) {
        // Move losers bracket winner to grand final
        winners[winners.length - 1][0].team2 = team;
      }
    }
  
    // Check for tournament winner
    if (bracketType === 'winners' && roundIndex === winners.length - 1) {
      setWinnerState(team);
    }
  
    setBracket({ winners, losers });
  }, [bracket]);

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
      const targetBracket = bracketType === 'winners' ? newBracket.winners : newBracket.losers;
      targetBracket[roundIndex][matchIndex].winner = team;
    } else {
      newBracket[roundIndex][matchIndex].winner = team;
      if (roundIndex + 1 < newBracket.length && tournamentType === 'single') {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isTeam1 = matchIndex % 2 === 0;
        if (isTeam1) newBracket[roundIndex + 1][nextMatchIndex].team1 = team;
        else newBracket[roundIndex + 1][nextMatchIndex].team2 = team;
      }
    }
    setBracket(newBracket);

    // Check for final winner in Single Elimination
    if (tournamentType === 'single' && roundIndex === newBracket.length - 1) {
      setWinnerState(team);
    }
  }, [bracket, tournamentType]);

  return (
    <div className="app-container">
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
      </motion.div>
      <div className="bracket-container">
        {tournamentType === 'double' ? (
          <>
            <div>
              <h2>Winners Bracket</h2>
              {bracket.winners?.map((round, index) => (
                <Round
                  key={`winners-${index}`}
                  round={round}
                  roundIndex={index}
                  bracketType="winners"
                  setWinner={setDoubleEliminationWinner}
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
                  setWinner={setDoubleEliminationWinner}
                  tournamentType={tournamentType}
                />
              ))}
            </div>
          </>
        ) : (
          bracket.map((round, index) => (
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