/*
 *Copyright Regione Piemonte - 2024
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import {Injectable} from '@angular/core';
import {TypePeriod} from "@components/shared/dialogs/dialog-init-config/models";
import {
  addDays,
  differenceInDays,
  endOfMonth,
  endOfYear,
  format,
  getDate,
  getHours,
  getMinutes,
  getMonth,
  setHours,
  setMinutes,
  setSeconds,
  startOfMonth,
  startOfYear,
  subDays as subDaysFns,
  subMonths,
  subYears
} from "date-fns";
import {formatDate} from "@angular/common";


export type formatKeys = keyof typeof DateFormatter;

export enum tipoDateEnum {
  hh = 'hh',
  hhMm = 'hh:mm',
  hhMmSs = 'hh:mm:ss',
  dd = 'dd',
  mmDd = 'MM-dd',
  ddMMYyyy = 'dd-MM-yyyy',
  yyyyMMDd = 'yyyy-MM-dd',
}

export enum DateFormatter {
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'MM/DD/YYYY',
}

/**

 * DateSettingService is a service that provides methods to manipulate and work with dates.

 * It allows you to create start and end dates for different time periods, such as months and years.

 */
@Injectable({
  providedIn: 'root'
})
export class DateSettingService {

  // Private oggi: Date = new Date();
  private _startDate: Date = new Date();

  constructor() {
  }

  createStartDate(type: TypePeriod): Date {
    switch (type) {
      case 'personalizzato':
        return this._startDate;
      case 'mese':
        return this._startDate;
      case 'anno':
        return this._startDate;
      default:
        return this._startDate;
    }
  }

  /**
   * @description Crea la data inizio mese a partire dalla odierna
   * @example
   * this._createInitMouth()
   * @returns {Date}
   * @output 2021-07-01T00:00:00.000Z
   */
  private _createInitMouth(): Date {
    return startOfMonth(this._startDate)
  }

  /**
   * @description Crea la data fine mese a partire dalla odierna
   * @example
   * this._createEndMouth()
   * @returns {Date}
   * @output 2021-07-31T23:59:59.999Z
   */
  private _createEndMouth(): Date {
    return endOfMonth(this._startDate)
  }

  /**
   * Formats a given date according to the specified type.
   *
   * @param {number} date - The date to be formatted, represented as a timestamp.
   * @param {tipoDateEnum} [tipo=tipoDateEnum.yyyyMMDd] - The format type enum defining the date format.
   * @return {string} The formatted date string.
   */
  formatData(date: number, tipo: tipoDateEnum = tipoDateEnum.yyyyMMDd): string {
    return format(date, tipo);
  }

  /**
   * @description Crea la data inizio anno a partire dalla odierna
   * @param {string} data
   * @example
   * this._createInitYear()
   * @returns {Date}
   * @output 2021-01-01T00:00:00.000Z
   */
  createInitYear(data?: string): Date {
    return startOfYear(!data ? this._startDate : new Date(data));
  }

  createYear(data: number): number {
    return +format(data, 'yyyy');
  }

  /**
   * @description Crea la data fine anno a partire dalla odierna
   * @param {string} data
   * @example
   * this._createEndYear()
   * @returns {Date}
   * @output 2021-12-31T23:59:59.999Z
   */
  createEndYear(data?: string): Date {
    return endOfYear(!data ? this._startDate : new Date(data));
  }

  /**
   * @description Crea la data odierna setta l'ora a 0 e minuti a 1 secondo a 0
   * @example
   * this._createToday()
   * @returns {Date}
   * @output 2021-07-21T00:01:00.000Z
   */
  private _createToday(date?: Date, arg?: { minutes: number, hours: number, seconds: number }): Date {
    if (date) {
      this._startDate = date;
    }
    return !arg ? setHours(setMinutes(this._startDate, 1), 0) : setHours(setMinutes(setSeconds(this._startDate, arg.seconds), arg.minutes), arg.hours)
  }

  /**
   * @description Crea la data odierna setta l'ora a 23 e minuti a 59 secondo a 59
   * @example
   * this._createTodayEnd()
   * @returns {Date}
   * @output 2021-07-21T23:59:59.999Z
   */
  private _createTodayEnd(date?: Date): Date {
    if (date) {
      this._startDate = date;
    }
    return setHours(setMinutes(this._startDate, 59), 23)
  }

  /**
   * @description Formatto la data in YYYY-MM-DD hh:mm
   * @example
   * this._formatDate()
   * @returns {string}
   * @output 2021-07-21 00:01
   */
  formatDate(date: string | Date): string {
    return format(new Date(date), 'yyyy-MM-dd hh:mm');
  }

  /**
   * Generates a timestamp for a given date.
   *
   * @param {string | Date} date - The date object or date string.
   * @return {string} - The timestamp string for the given date.
   */
  createTimeStamp(date: string | Date): string {
    return new Date(date).getTime().toString();
  }


  /**
   * Helper method to subtract a given number of days from a date.
   *
   * @param {number} days - The number of days to subtract.
   * @return {Date} - The resulting date after subtracting the specified number of days.
   *
   * @private
   */
  private _subDays(days: number): Date {
    return subDaysFns(this._startDate, days);
  }

  /**
   * @description Elimina un insieme di mesi dall'odierna
   * @param {number} months
   * @example
   * this._subMonths(1)
   * @returns {Date}
   */
  private _subMonths(months: number): Date {
    return subMonths(this._startDate, months);
  }

  /**
   * Subtracts the specified number of years from the start date.
   *
   * @param {number} years - The number of years to subtract from the start date.
   * @return {Date} - The resulting date after subtracting the specified years from the start date.
   */
  private _subYears(years: number): Date {
    return subYears(this._startDate, years);
  }

  /**
   * Helper method to add a given number of days to a date e setting time to 0.
   * @param {Date} date - The date to add the days to.
   * @param {number} days - The number of days to add.
   * @return {Date} - The resulting date after adding the specified number of days.
   *
   * @private
   */
  addDays(date: Date, days: number): Date {
    function checkIfValidDate(param: any): boolean {
      return param instanceof Date && !isNaN(param.getTime());
    }

    if (checkIfValidDate(date)) {
      return addDays(this._createToday(date), days);
    } else {
      return addDays(this._createToday(new Date(date)), days);
    }

  }

  /**
   * @description Crea la data inizio mese a partire dalla odierna meno 1 mese
   * @param {string} date
   * @param {number} subMonth Numero di mesi da togliere
   * @example
   * this._createInitMouth()
   * @returns {Date}
   * @output 2021-06-01T00:00:00.000Z
   */
  createInitMouthPrec(date?: string, subMonth: number = 1): Date {
    if (date) {
      this._startDate = new Date(date);
    }
    return subMonth ? startOfMonth(this._subMonths(subMonth)) : this._createInitMouth();
  }

  /**
   * Creates the precise end of the previous month.
   * @param {string} date
   * @param {number} subMonth Numero di mesi da togliere
   * @return {Date} - The precise end of the previous month.
   */
  createEndMouthPrec(date?: string, subMonth: number = 1): Date {
    if (date) {
      this._startDate = new Date(date);
    }
    return subMonth ? endOfMonth(this._subMonths(1)) : this._createEndMouth();
  }

  /**
   * @description Crea la data inizio anno a partire dalla odierna meno 1 anno
   * @param {string} date
   * @example
   * this._createInitYearPrec()
   * @returns {Date}
   */
  createInitYearPrec(date?: string): Date {
    if (date) {
      this._startDate = new Date(date);
    }
    return startOfYear(this._subYears(1));
  }

  /**
   * @description Crea la fine precisa del anno precedente.
   * @param {string} date - La data
   * @return {Date} - La data precisa della fine del anno precedente.
   * @example
   * this.createEndYearPrec('2021-07-21T00:00:00.000Z')
   */
  createEndYearPrec(date?: string): Date {
    if (date) {
      this._startDate = new Date(date);
    }
    return endOfYear(this._subYears(1));
  }

  /**
   * @description Inizializza un nuovo oggetto Date rappresentante un giorno specifico, opzionalmente con un numero specificato di giorni sottratti.
   *
   * @param {string} [date] - La data per creare il giorno iniziale, come stringa in un formato Date valido. Se non fornito, verrà utilizzata la data odierna.
   * @param {number} [subDays] - Il numero di giorni da sottrarre al giorno iniziale. Se non fornito, non verranno sottratti giorni.
   * @param {hours: number; seconds: number; minutes: number} [arg] - Argomenti per il settaggio delle date.
   *
   * @returns {Date} - L'oggetto Date inizializzato rappresentante il giorno specifico.
   *
   * @example
   * ```typescript
   * const myDate = initializeDate('2024-01-01', 3);
   * console.log(myDate); // Stampa: Dec 30 2023 00:00:00 GMT+0000
   * ```
   */
  createInitDay(date?: string, subDays?: number, arg?: { hours: number, seconds: number, minutes: number }): Date {
    if (date) {
      this._startDate = new Date(date);
    }
    return subDays ? this._createToday(this._subDays(subDays), arg) : this._createToday(undefined, arg);
  }

  /**
   * @description Crea una data di fine giornata.
   *
   * @param {string} [date] - La data da impostare come data di inizio. (opzionale)
   * @param {number} [subDays] - Il numero di giorni da sottrarre alla data odierna. (opzionale)
   *
   * @returns {Date} - La data di fine giornata.
   *
   * @example
   * endOfDay('2021-07-01', 1) // '2021-06-30'
   */
  createEndDay(date?: string, subDays?: number): Date {
    if (date) {
      this._startDate = new Date(date);
    }
    return subDays ? this._createTodayEnd(this._subDays(subDays)) : this._createTodayEnd();
  }

  /**
   * @description Creare una funzione che mi possa restituire quanti giorni ci sono da una data all'altra
   * @param {string} startDate
   * @param {string} endDate
   * @example
   * this.differenceInDays('2021-07-01T00:00:00.000Z', '2021-07-31T23:59:59.999Z')
   * @returns {number}
   * @output 31
   */
  differenceInDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return differenceInDays(end, start);
  }

  /**
   * @description Prende la data salvata nel localStore e restituisce l'anno
   * @example
   * this.getYear()
   * @returns {number}
   */
  getYear(): number {
    return +format(this._startDate, 'yyyy');
  }

  /**
   * @description verifica che la data sia inizio anno
   * @param {Date} data - Passo la data per la verifica
   * @return boolean
   * @example isFirstMinuteOfYear(new Date())
   */
  isFirstMinuteOfYear(data: Date): boolean {
    return getMonth(data) === 0 && getDate(data) === 1 && getHours(data) === 0 && getMinutes(data) < 10
  }

  getGMT(data: string) {
    const date = new Date(+data);
    const offset = date.getTimezoneOffset();
    const hours = offset / -60;
    return hours;
  }

  private _returnAddZero(time: number): string {
    return `${(time < 10 ? '0' : '') + time}`;
  }

  private _generateName({timeStamp, addHours = true, separatore = '\n', formatter}: { timeStamp: number; addHours?: boolean; separatore?: string; formatter?: string }): string {
    let newTime = addHours ? new Date(timeStamp + (60 * 60 * 1000)) : new Date(timeStamp);
    let {dayUTC, monthUTC, hoursUTC, minutesUTC, yearUTC} = this.convertToUTC(newTime);

    // Gestione del formato DAY-1 24:00 al posto di DAY 00:00
    if (hoursUTC === 0 && minutesUTC === 0) {
      let mytimeStamp: number = (Math.floor(timeStamp / 60000)) * 60000; // azzero i secondi
      let newTimePrev = addHours ? new Date(mytimeStamp + (60 * 60 * 1000) - 1) : new Date(mytimeStamp - 1);
      let {dayUTC: newDayUTC, monthUTC: newMonthUTC, hoursUTC: newHoursUTC, minutesUTC: newMinutesUTC, yearUTC: newYearUTC} = this.convertToUTC(newTimePrev);
      dayUTC = newDayUTC;
      monthUTC = newMonthUTC;
      hoursUTC = 24;
      minutesUTC = 0;
      yearUTC = newYearUTC;
    }
    if (formatter) {
      let [data, ora] = formatter.split(' ');
      let dateFormatted = this.getFormatDate(data.toUpperCase() as formatKeys);
      switch (dateFormatted) {
        case 1:
          return `${this._returnAddZero(yearUTC)}-${this._returnAddZero(monthUTC + 1)}-${this._returnAddZero(dayUTC)}${separatore}${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
        case 2:
          return `${this._returnAddZero(monthUTC + 1)}/${this._returnAddZero(dayUTC)}/${this._returnAddZero(yearUTC)}${separatore}${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
        default:
          return `${this._returnAddZero(dayUTC)}/${this._returnAddZero(monthUTC + 1)}/${this._returnAddZero(yearUTC)}${separatore}${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
      }

    }

    return `${this._returnAddZero(dayUTC)}/${this._returnAddZero(monthUTC + 1)}/${this._returnAddZero(yearUTC)}${separatore}${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
  }

  /**
   * @description Creo una funzione che riceve una stringa con un separatore specifico e restituisce i valori con lo zero
   * @param {string} value - Stringa da cambiare
   * @param {string} separatore - Separatore che mi permette di ridivedere la stringa
   */
  private reWriteString(value: string, separatore: string): string {
    let [first, second, ultimate = ''] = value.split(separatore);
    first = this._returnAddZero(+first);
    second = this._returnAddZero(+second);

    ultimate = ultimate ? this._returnAddZero(+ultimate) : '';

    return !ultimate ? ` ${first === '00' ? '24' : first}${separatore}${second}` : `${first}${separatore}${second}${separatore}${ultimate}`;
  }

  generateDataAndHours(time: number | string, formatter: formatKeys, validazione: boolean = false): { day: string, hours: string } {

    if (!formatter) {
      throw new Error('Manca il formatter');
    }

    if (typeof time === 'string') {
      time = +time;
    }

    if (isNaN(time)) {
      throw new Error(`Time inserito non è un numero ${time}`);
    }
    let plusOra = 60 * 60 * 1000;

    let date = new Date(time + plusOra);
    let {
      dayUTC,
      monthUTC,
      hoursUTC,
      minutesUTC,
      yearUTC
    } = this.convertToUTC(date);

    // Gestione del formato DAY-1 24:00 al posto di DAY 00:00
    if (hoursUTC === 0 && minutesUTC === 0 && validazione) {
      let mytimeStamp: number = (Math.floor(time / 60000)) * 60000; // azzero i secondi
      let newTimePrev = new Date(mytimeStamp - 1);
      let {dayUTC: newDayUTC, monthUTC: newMonthUTC, hoursUTC: newHoursUTC, minutesUTC: newMinutesUTC, yearUTC: newYearUTC} = this.convertToUTC(newTimePrev);
      dayUTC = newDayUTC;
      monthUTC = newMonthUTC;
      hoursUTC = 24;
      minutesUTC = 0;
      yearUTC = newYearUTC;
    }

    // aggiungo uno al mese in utc
    monthUTC = monthUTC + 1;


    switch (formatter) {
      case "DD/MM/YYYY":
        return {
          day: this.reWriteString(`${dayUTC}/${monthUTC}/${yearUTC}`, '/'),
          hours: this.reWriteString(`${hoursUTC}:${minutesUTC}`, ':'),
        };
      case "YYYY-MM-DD":
        return {
          day: this.reWriteString(`${yearUTC}-${monthUTC}-${dayUTC}`, '-'),
          hours: this.reWriteString(`${hoursUTC}:${minutesUTC}`, ':')
        }
      case "MM/DD/YYYY":
        return {
          day: this.reWriteString(`${monthUTC}-${dayUTC}-${yearUTC}`, '/'),
          hours: this.reWriteString(`${hoursUTC}:${minutesUTC}`, ':')
        }
    }


  }

  /**
   * Converts a given date to UTC format.
   *
   * @param {Date} newTime - The date to convert to UTC.
   * @return {Object} - An object containing the UTC values of the date.
   *                    - dayUTC: The UTC day of the date.
   *                    - monthUTC: The UTC month of the date.
   *                    - hoursUTC: The UTC hours of the date.
   *                    - minutesUTC: The UTC minutes of the date.
   *                    - yearUTC: The UTC year of the date.
   *                    - secondsUTC: The UTC seconds of the date.
   *                    - millisecondsUTC: The UTC milliseconds of the date.
   */
  convertToUTC(newTime: Date): {
    dayUTC: number;
    monthUTC: number;
    hoursUTC: number;
    minutesUTC: number;
    yearUTC: number;
    millisecondsUTC: number;
    secondsUTC: number;
    dayOfWeek: number;
  } {
    let dayUTC = newTime.getUTCDate();
    let monthUTC = newTime.getUTCMonth();
    let hoursUTC = newTime.getUTCHours();
    let minutesUTC = newTime.getUTCMinutes();
    let yearUTC = newTime.getUTCFullYear();
    let millisecondsUTC = newTime.getMilliseconds();
    let secondsUTC = newTime.getUTCSeconds();
    let dayOfWeekUTC = newTime.getUTCDay();
    return {dayUTC, monthUTC, hoursUTC, minutesUTC, yearUTC, secondsUTC, millisecondsUTC, dayOfWeek: dayOfWeekUTC};
  }

  generateNameToTimeStamp({timestamp, separatore, addHours, formatter}: { timestamp: number; addHours?: boolean; separatore?: string, formatter?: string }): string {
    if (!timestamp) {
      throw new Error('Not timeStamp implement');
    }
    return this._generateName({timeStamp: timestamp, addHours, separatore, formatter});
  }

  getFormatDate(data: formatKeys): number {
    return DateFormatter[data];
  }

  /**
   * Retrieves the formatted name based on the given time and timebase.
   *
   * @param {number} time - The time in milliseconds.
   * @param {string} timebase - The timebase to use for formatting.
   *    Possible values: "TIME", "TIMESTAMP", "TIMESTAMP_NO_YEAR_MONTH",
   *    "WEEKTIME", "TIMESTAMP_NO_YEAR".
   *
   * @return {string} The formatted name based on the given time and timebase.
   * @example
   * this.getFormatterToTimeBase(1000000, 'DATE')
   */
  getFormatterToTimeBase(time: number, timebase: string): string {

    let {dayUTC, monthUTC, hoursUTC, minutesUTC, yearUTC, dayOfWeek} = this.convertToUTC(new Date(time));
    let day = '';


    if (hoursUTC === 0 && minutesUTC === 0) {
      let mytimeStamp: number = (Math.floor(time / 60000)) * 60000; // azzero i secondi
      let newTimePrev = new Date(mytimeStamp - 1);
      let {dayUTC: newDayUTC, monthUTC: newMonthUTC, hoursUTC: newHoursUTC, minutesUTC: newMinutesUTC, yearUTC: newYearUTC} = this.convertToUTC(newTimePrev);
      dayUTC = newDayUTC;
      monthUTC = newMonthUTC;
      hoursUTC = 24;
      minutesUTC = 0;
      yearUTC = newYearUTC;
      dayOfWeek = dayOfWeek - 1;
    }


    switch (dayOfWeek) {

      case 0:
        day = 'dom';
        break;
      case 1:
        day = 'lun';
        break;
      case 2:
        day = 'mar';
        break;
      case 3:
        day = 'mer';
        break;
      case 4:
        day = 'gio';
        break;
      case 5:
        day = 'ven';
        break;
      case -1:
      case 6:
        day = 'sab';
        break;
    }

    // aggiungo uno al mese in utc
    monthUTC = monthUTC + 1;

    switch (true) {
      case timebase === "TIME":
        return `${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
      // return formatDate(time, 'HH:mm', 'it');
      case timebase === 'TIMESTAMP':
        return `${this._returnAddZero(dayUTC)}/${this._returnAddZero(monthUTC)}/${this._returnAddZero(yearUTC)} ${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
      // return formatDate(time, 'dd/MM/YYYY HH:mm', 'it');
      case timebase === 'TIMESTAMP_NO_YEAR_MONTH':
        return `${this._returnAddZero(dayUTC)} ${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
      // return formatDate(time, 'dd HH:mm', 'it');
      case timebase === 'WEEKTIME':
        return `${day} ${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
      // return formatDate(time, 'EE HH:mm', 'it');
      case timebase === 'TIMESTAMP_NO_YEAR':
        return `${this._returnAddZero(dayUTC)}/${this._returnAddZero(monthUTC)} ${this._returnAddZero(hoursUTC)}:${this._returnAddZero(minutesUTC)}`;
      // return formatDate(time, 'dd/MM HH:mm', 'it');
      default:
        return formatDate(time ?? '', 'dd-MM-yyyy', 'it');
    }
  }

  /**
   * @description Trasforma un timeStamp a 1h e 1m in UTC
   * @param {number} time - Il timeStamp da trasformare
   * @returns {number} - Il nuovo timeStamp trasformato in UTC
   * @example
   * this.transformDateUtc(1648764663000)
   *
   * Nota: Questo esempio assume che il fuso orario locale dell'utente sia UTC.
   */
  transformDateUtc(time: number): number {
    return new Date(time).setUTCHours(23, 59, 59, 0);
  }

  /**
   * @description Prendo un time e lo setto con le ore che mi servono
   * @param {number} time - Time in timestamp
   * @param {number} hours - Ore da settare
   */
  setTimeToUtc(time: number, hours: number = 4): number {
    return new Date(time).setUTCHours(hours, 0, 0, 0);
  }

  /**
   * Subtracts a specified number of days from a given date.
   *
   * @param {Date} data - The date from which days will be subtracted.
   * @param {number} days - The number of days to subtract.
   * @return {Date} The new date after subtracting the specified number of days.
   */
  subDays(data: Date, days: number): Date {
    return subDaysFns(data, days);
  }


}

export enum TimeResponseEnum {
  TIME = 'TIME',
  TIMESTAMP = 'TIMESTAMP',
  TIMESTAMP_NO_YEAR_MONTH = 'TIMESTAMP_NO_YEAR_MONTH',
  WEEKTIME = 'WEEKTIME',
  TIMESTAMP_NO_YEAR = 'TIMESTAMP_NO_YEAR',
}


