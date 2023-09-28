export interface IGetStatusLock {
  measurementID: string;
  year:          number;
  userID:        string;
  userInfo:      string;
  date:          number;
  locked:        boolean;
  myLock:        boolean;
  measurementId?: string;
  userId?:        string;
}
