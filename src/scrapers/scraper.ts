import { superstream } from "./providers/superstream";

export interface ScraperData {
    streamUrl: string;
    caption: {
        src: string;
        label: string;
        srclang: string;
    } | null | undefined;
}

export const scraper = superstream;