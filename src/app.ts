import express from 'express';
import dotenv from 'dotenv';
import { getMovieById, searchMovie } from './scrapers/metadata';
import { scraper } from './scrapers/scraper';

dotenv.config();

const app = express();
const port = 5000;

app.set('view engine', 'ejs');
app.set('views', './src/views');

app.use(express.static('public'));

app.get('/', async (req, res) => {
  const { query } = req.query;

  try {
    let movies = [];
    if (typeof query === "string") movies = await searchMovie(query);

    res.render('search', { movies });
  } catch (error) {
    console.log(error)
    console.error(error);
    res.render('error', { error: "An unexpected error has occurred" });
  }
});

app.get('/movie/:id', async (req, res) => {
  const movie = await getMovieById(req.params.id);

  try {
    const stream = await scraper(movie);
    if (!stream) return res.render('error', { error: "Movie not found!" })
    res.render('movie', { ...stream });
  } catch (error) {
    console.log(error)
    console.error(error);
    res.render('error', { error: "An unexpected error has occurred" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});