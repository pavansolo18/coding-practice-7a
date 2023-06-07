const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//1 get all players in player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT
    *
    FROM
    player_details;`;
  const allAllPlayers = await db.all(getAllPlayersQuery);
  response.send(
    allAllPlayers.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//2 Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const PlayerQuery = `
    SELECT 
      *
    FROM 
      player_details
    WHERE 
      player_id = ${playerId};`;
  const eachPlayer = await db.get(PlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(eachPlayer));
});

//3 Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayer = `
            UPDATE
              player_details
            SET
              player_name = '${playerName}'
            WHERE player_id = ${playerId};`;

  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//4 Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `
    SELECT 
      *
    FROM 
      match_details 
    WHERE 
      match_id = ${matchId};`;
  const match = await db.get(matchDetails);
  response.send(convertMatchDbObjectToResponseObject(match));
});

//5 Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersMatchesQuery = `
    SELECT *
    FROM
      player_match_score
      NATURAL JOIN match_details
    WHERE
      player_id= ${playerId};`;
  const playersMatches = await db.all(getPlayersMatchesQuery);
  response.send(
    playersMatches.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

//6 Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT *
    FROM
      player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id= ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM
      player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id= ${playerId};`;
  const playerMatchDetails = await db.get(getMatchPlayersQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
