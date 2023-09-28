export interface IUserSetting {
  lang:   string;
  theme:  string;
  font:   string;
  layout: Layout;
}

export interface Layout {
  set:     string;
  default: Col;
  reverse: Col;
  col:     Col;
}

export interface Col {
  slideA:  number;
  slideB:  number;
  slideC:  number;
  slideD?: number;
}
