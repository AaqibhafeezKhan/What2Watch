import CryptoJS from "crypto-js";
import axios from "axios";

import { Media } from "../metadata";
import { ScraperData } from "../scraper";


// CONSTANTS, read below (taken from og)
// We do not want content scanners to notice this scraping going on so we've hidden all constants
// The source has its origins in China so I added some extra security with banned words
// Mayhaps a tiny bit unethical, but this source is just too good :)
// If you are copying this code please use precautions so they do not change their api.
const iv = atob("d0VpcGhUbiE=");
const key = atob("MTIzZDZjZWRmNjI2ZHk1NDIzM2FhMXc2");
const apiUrls = [
    atob("aHR0cHM6Ly9zaG93Ym94LnNoZWd1Lm5ldC9hcGkvYXBpX2NsaWVudC9pbmRleC8="),
    atob("aHR0cHM6Ly9tYnBhcGkuc2hlZ3UubmV0L2FwaS9hcGlfY2xpZW50L2luZGV4Lw=="),
];
const appKey = atob("bW92aWVib3g=");
const appId = atob("Y29tLnRkby5zaG93Ym94");

// cryptography stuff
const crypto = {
    encrypt(str: string) {
        return CryptoJS.TripleDES.encrypt(str, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(iv),
        }).toString();
    },
    getVerify(str: string, str2: string, str3: string) {
        if (str) {
            return CryptoJS.MD5(
                CryptoJS.MD5(str2).toString() + str3 + str
            ).toString();
        }
        return null;
    },
};

function normalizeTitle(title: string): string {
    return title
        .trim()
        .toLowerCase()
        .replace(/['":]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_");
}

function compareTitle(a: string, b: string): boolean {
    return normalizeTitle(a) === normalizeTitle(b);
}

// get expire time
const expiry = () => Math.floor(Date.now() / 1000 + 60 * 60 * 12);

function generateRandomId(alphabet: string, length: number) {
    let randomId = '';
    const alphabetLength = alphabet.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * alphabetLength);
        randomId += alphabet[randomIndex];
    }

    return randomId;
}

// sending requests
const get = async (data: object, altApi = false) => {
    const defaultData = {
        childmode: "0",
        app_version: "11.5",
        appid: appId,
        lang: "en",
        expired_date: `${expiry()}`,
        platform: "android",
        channel: "Website",
    };
    const encryptedData = crypto.encrypt(
        JSON.stringify({
            ...defaultData,
            ...data,
        })
    );
    const appKeyHash = CryptoJS.MD5(appKey).toString();
    const verify = crypto.getVerify(encryptedData, appKey, key);
    const body = JSON.stringify({
        app_key: appKeyHash,
        verify,
        encrypt_data: encryptedData,
    });
    const b64Body = btoa(body);

    const formatted = new URLSearchParams();
    formatted.append("data", b64Body);
    formatted.append("appid", "27");
    formatted.append("platform", "android");
    formatted.append("version", "129");
    formatted.append("medium", "Website");

    const requestUrl = altApi ? apiUrls[1] : apiUrls[0];
    const randomId = generateRandomId("0123456789abcdef", 32);

    const res = await axios.get(`${requestUrl}?${formatted.toString()}&token${randomId}`, {
        method: "POST",
        headers: {
            Platform: "android",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    return res.data;
};

// Find best resolution
const getBestQuality = (list: any[]) => {
    return (
        list.find((quality: any) => quality.quality === "1080p" && quality.path) ??
        list.find((quality: any) => quality.quality === "720p" && quality.path) ??
        list.find((quality: any) => quality.quality === "480p" && quality.path) ??
        list.find((quality: any) => quality.quality === "360p" && quality.path)
    );
};


export const superstream = async (media: Media) : Promise<ScraperData> => {

    const searchQuery = {
        module: "Search3",
        page: "1",
        type: "all",
        keyword: media.title,
        pagelimit: "20",
    };
    const searchRes = (await get(searchQuery, true)).data;

    const superstreamEntry = searchRes.find(
        (res: any) =>
            compareTitle(res.title, media.title) &&
            res.year === Number(media.year)
    );

    if (!superstreamEntry) return null;
    const superstreamId = superstreamEntry.id;

    const apiQuery = {
        uid: "",
        module: "Movie_downloadurl_v3",
        mid: superstreamId,
        oss: "1",
        group: "",
    };

    const mediaRes = (await get(apiQuery)).data;

    const hdQuality = getBestQuality(mediaRes.list);
    if (!hdQuality) return null;

    const subtitleApiQuery = {
        fid: hdQuality.fid,
        uid: "",
        module: "Movie_srt_list_v2",
        mid: superstreamId,
      };

      const subtitleRes = (await get(subtitleApiQuery)).data;

      const englishSub = subtitleRes.list.find((sub) => sub.language === "English");

    return {
        streamUrl: hdQuality.path,
        caption: englishSub.subtitles[0].filepath
    };
}