import React, { useState, useEffect } from "react";
import "./App.css";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const App = () => {
  const [pokemon, setPokemon] = useState([]);
  const [searchPokemon, setSearchPokemon] = useState("");
  const [searchedPokemon, setSearchedPokemon] = useState(null);
  const [randomPokemon, setRandomPokemon] = useState(null);
  const [battlePokemon, setBattlePokemon] = useState([]);
  const [winner, setWinner] = useState(null);
  const [activeSection, setActiveSection] = useState("default");

  useEffect(() => {
    fetchPokemon();
  }, []);

  const fetchPokemon = async () => {
    try {
      setActiveSection("default");
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=150");
      const data = await res.json();
      const details = await Promise.all(
        data.results.map(async (p) => {
          const pokeRes = await fetch(p.url);
          return pokeRes.json();
        })
      );
      setPokemon(details);
    } catch (err) {
      console.error("Failed to fetch Pokémon.");
    }
  };

  const fetchSearchedPokemon = async () => {
    if (!searchPokemon.trim()) return;
    try {
      setActiveSection("search");
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchPokemon.toLowerCase()}`);
      const data = await res.json();
      setSearchedPokemon(data);
      setSearchPokemon(""); 
    } catch (err) {
      setSearchedPokemon(null);
      console.error("Pokémon not found.");
    }
  };

  const fetchRandomPokemon = async () => {
    const randomId = Math.floor(Math.random() * 898) + 1;
    try {
      setActiveSection("random");
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      const data = await res.json();
      const movesPromises = data.moves.slice(0, 10).map(move => fetch(move.move.url).then(res => res.json()));
      const movesDetails = await Promise.all(movesPromises);
      const moves = movesDetails.map(move => ({
        name: move.name,
        description: move.effect_entries.find(entry => entry.language.name === "en")?.effect
    }));
    
    setRandomPokemon({
      ...data,
      detailedMoves: moves
  });

    } catch (err) {
      console.error("Failed to fetch random Pokémon.");
    }
  };

  const fetchBattlePokemon = async () => {
    const randomIds = [
      Math.floor(Math.random() * 898) + 1,
      Math.floor(Math.random() * 898) + 1,
    ];
    try {
      setActiveSection("battle");
      const responses = await Promise.all(randomIds.map((id) => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)));
      const data = await Promise.all(responses.map((res) => res.json()));
      setBattlePokemon(data);
      determineWinner(data[0], data[1]);
    } catch (err) {
      console.error("Failed to fetch battle Pokémon.");
    }
  };

  const determineWinner = (p1, p2) => {
    const p1Total = p1.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
    const p2Total = p2.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
    if (p1Total > p2Total) {
      setWinner(p1.name);
    } else if (p2Total > p1Total) {
      setWinner(p2.name);
    } else {
      setWinner("TIE");
    }
  };
  

  const shufflePokemon = () => {
    setActiveSection("default");
    const shuffled = [...pokemon].sort(() => 0.5 - Math.random());
    setPokemon(shuffled.slice(0, 10));
  };

  return (
    <div className="container">
      <h1>Pokédex</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Enter Pokémon name..."
          value={searchPokemon}
          onChange={(e) => setSearchPokemon(e.target.value)}
        />
        <button onClick={fetchSearchedPokemon}>Search</button>
      </div>

      <div className="buttons">
        <button onClick={shufflePokemon}>Shuffle Pokémon</button>
        <button onClick={fetchRandomPokemon}>Random Pokémon</button>
        <button onClick={fetchBattlePokemon}>Random Pokémon Battle</button>
      </div>

      {activeSection === "search" && searchedPokemon && (
        <div className="pokemon-section">
          <h2>{searchedPokemon.name.toUpperCase()}</h2>
          <img src={searchedPokemon.sprites.front_default} alt={searchedPokemon.name} />
          <p>Type: {searchedPokemon.types.map((t) => t.type.name).join(", ")}</p>
          <ul>
            {searchedPokemon.stats.map((stat) => (
              <li key={stat.stat.name}>{stat.stat.name}: {stat.base_stat}</li>
            ))}
          </ul>
        </div>
      )}

      {activeSection === "random" && randomPokemon && (
        <div className="pokemon-section">
          <h2>{randomPokemon.name.toUpperCase()}</h2>
          <img src={randomPokemon.sprites.front_default} alt={randomPokemon.name} />
          <p>Type: {randomPokemon.types.map((t) => t.type.name).join(", ")}</p>
          <ul>
            {randomPokemon.stats.map(stat => (
              <li key={stat.stat.name}>{`${stat.stat.name}: ${stat.base_stat}`}</li>
            ))}
          </ul>
          <div className="pokemon-moves">
            <h3>Moves:</h3>
            <ul>
                {randomPokemon.detailedMoves.map(move => (
                    <li key={move.name}>{move.name} - {move.description}</li>
                ))}
            </ul>
        </div>
        </div>
      )}

    {activeSection === "search" && !searchedPokemon && (
      <div className="error">Pokémon not found. Please check the spelling and try again!</div>
    )}
    
      {activeSection === "battle" && battlePokemon.length === 2 && (
        <div className="battle">
          <h2>Pokémon Battle!</h2>
          <div className="battle-info">
            <div>
              <h3>{battlePokemon[0].name.toUpperCase()}</h3>
              <img src={battlePokemon[0].sprites.front_default} alt={battlePokemon[0].name} />
              <ul>
                {battlePokemon[0].stats.map(stat => (
                  <li key={stat.stat.name}>{stat.stat.name}: {stat.base_stat}</li>
                ))}
              </ul>
            </div>
            <p>VS</p>
            <div>
              <h3>{battlePokemon[1].name.toUpperCase()}</h3>
              <img src={battlePokemon[1].sprites.front_default} alt={battlePokemon[1].name} />
              <ul>
                {battlePokemon[1].stats.map(stat => (
                  <li key={stat.stat.name}>{stat.stat.name}: {stat.base_stat}</li>
                ))}
              </ul>
            </div>
          </div>
          <h3>Winner: {winner.toUpperCase()}</h3>

          <Bar
            data={{
              labels: ["Total Stats"],
              datasets: [
                {
                  label: battlePokemon[0].name.toUpperCase(),
                  data: [battlePokemon[0].stats.reduce((sum, stat) => sum + stat.base_stat, 0)],
                  backgroundColor: "blue",
                },
                {
                  label: battlePokemon[1].name.toUpperCase(),
                  data: [battlePokemon[1].stats.reduce((sum, stat) => sum + stat.base_stat, 0)],
                  backgroundColor: "red",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom" },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        </div>
      )}

      {activeSection === "default" && (
        <div className="pokemon-grid">
          {pokemon.map((p) => (
            <div key={p.id} className="card">
              <h3>{p.name.toUpperCase()}</h3>
              <img src={p.sprites.front_default} alt={p.name} />
              <p>Type: {p.types.map((t) => t.type.name).join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
