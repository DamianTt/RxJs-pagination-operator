import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ListPaged, ListResponseItems } from './list-loader';

export interface MyDataResponse {
  data: {
    paging: Paging;
    fancyItems: FancyObject[];
  };
}

export interface FancyObject {
  name: string;
  year: number;
}

export interface Paging {
  pagesCount: number;
  recordsCount: number;
}

export interface MyDataRequest extends ListPaged {}

@Injectable({
  providedIn: 'root',
})
export class DataFactoryService {
  constructor() {}

  getData(request: MyDataRequest): Observable<MyDataResponse> {
    let delayy = 50;
    if (request.page.number > 0 ) {
      delayy = 500;
    }
    const recordsCount = 84;
    return of({
      data: {
        paging: {
          pagesCount: Math.ceil(recordsCount / request.page.size),
          recordsCount: recordsCount,
        },
        fancyItems: this.fancyItemsGenerator(
          request.page.number,
          request.page.size,
          recordsCount
        ),
      },
    }).pipe(delay(delayy));
  }

  fancyItemsGenerator(
    from: number,
    size: number,
    recordsCount: number
  ): FancyObject[] {
    const maxIndex = recordsCount;
    const result: FancyObject[] = [];

    for (let i = 0; i < size && from * size + i < maxIndex; i++) {
      result.push({
        name: 'Anakin-' + (from * size + i),
        year: from * size + i,
      });
    }

    return result;
  }
}
