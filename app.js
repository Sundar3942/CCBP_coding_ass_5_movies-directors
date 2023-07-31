const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const dbPath = path.join(__dirname, "moviesData.db");

const convertDBObj_movie = function (params) {
  return {
    movieName: params.movie_name,
  };
};
const convertDBObj_full_movie_details = function (params) {
  return {
    movieId: params.movie_id,
    directorId: params.director_id,
    movieName: params.movie_name,
    leadActor: params.lead_actor,
  };
};
const director_convertedObj = function (params) {
  return {
    directorId: params.director_id,
    directorName: params.director_name,
  };
};
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started and running");
    });
  } catch (e) {
    console.log("Error: ${e.message}");
    process.exit(1);
  }
};
initializeDBandServer();

app.get("/movies/", async (request, response) => {
  const getQuery = `
        SELECT * FROM movie ORDER BY movie_id;
    `;
  const movieArray = await db.all(getQuery);
  const dbResponse = movieArray.map((eachObj) => convertDBObj_movie(eachObj));
  response.send(dbResponse);
});

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const postQuery = `INSERT INTO movie (
        director_id,movie_name,lead_actor)
        VALUES(
            ${directorId},'${movieName}','${leadActor}'
            );`;
  const dbResponse = await db.run(postQuery);
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const query = `
        SELECT * from movie WHERE movie_id = ${movieId};
    `;
  const dbResponse = await db.get(query);
  const converted = convertDBObj_full_movie_details(dbResponse);
  console.log(converted);
  response.send(converted);
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const putQuery = `UPDATE movie 
    SET director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId}
    `;
  const dbResponse = await db.run(putQuery);
  console.log(dbResponse);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteBookQuery = `
    DELETE FROM
      movie
    WHERE
      movie_id = ${movieId};`;
  await db.run(deleteBookQuery);
  response.send("Movie Removed");
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const query = `
    SELECT DISTINCT movie.movie_name as movie_name
    from movie INNER JOIN  director ON movie.director_id = director.director_id
    WHERE director.director_id = ${directorId};
    `;
  const directorsArray = await db.all(query);
  const converted = directorsArray.map((eachObj) =>
    convertDBObj_movie(eachObj)
  );
  console.log(converted);
  response.send(converted);
});

app.get("/directors/", async (request, response) => {
  const query = `
    SELECT * from director;
    `;
  const directorsArray = await db.all(query);
  const converted = directorsArray.map((eachObj) =>
    director_convertedObj(eachObj)
  );
  console.log(converted);
  response.send(converted);
});
module.exports = app;
