export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  img_icon_url: string;
  has_community_visible_stats: boolean;
}

export interface SteamGameEnriched extends SteamGame {
  genres: string[];
  tags: string[];
  header_image?: string;
}
