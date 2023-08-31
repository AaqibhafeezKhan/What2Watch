import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const tmdb_api_key = process.env.TMDB_API_KEY;

export const searchMovie = async (query: string) => {
  const response = await axios.get(
    `https://api.themoviedb.org/3/search/movie?query=${query}&include_adult=false&language=en-US&page=1`,
    {
      headers: {
        Authorization: `Bearer ${tmdb_api_key}`,
      },
    }
  );
  const results: Media[] = response.data.results
    .filter((m: any) => m.poster_path && m.release_date !== "")
    .map((r: any) => {
      return {
        id: r.id,
        title: r.title,
        poster: `https://image.tmdb.org/t/p/w185/${r.poster_path}`,
        year: new Date(r.release_date).getFullYear(),
      };
    });
  return results;
};

export const getMovieById = async (id: string | number) => {

  const response = await axios.get(
    `https://api.themoviedb.org/3/movie/${id}?language=en-US`,
    {
      headers: {
        Authorization: `Bearer ${tmdb_api_key}`,
      },
    }
  );
  return {
    id: response.data.id,
    title: response.data.title,
    poster: `https://image.tmdb.org/t/p/w185/${response.data.poster_path}`,
    year: new Date(response.data.release_date).getFullYear(),
  };
}

export interface Media {
  id: number;
  imdb_id?: number;
  title: string;
  poster: string;
  year: number;
}
