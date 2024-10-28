import {Observable} from "rxjs";
import {ToggleGroup} from "@components/shared/dialogs";



export interface TypeFork<T> {
  renderTableReportistica: Observable<Array<T & ToggleGroup>>,
  renderTableReportisticaSpecialistica: Observable<Array<T & ToggleGroup>>,
  renderTableElaborazione: Observable<Array<T & ToggleGroup>>
}
