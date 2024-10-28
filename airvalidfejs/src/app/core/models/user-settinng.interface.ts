export interface IUserSetting {
  lang:   string;
  theme:  string;
  font:   string;
  layout: Layout;
  areeTerritoriali?: any
}

export interface Layout {
  set:     string;
  default: Col;
  reverse: Col;
  col:     Col;
}

export interface Col {
  slide_a?:  number;
  slide_b?:  number;
  slide_c?:  number;
  slide_d?: number;
}
