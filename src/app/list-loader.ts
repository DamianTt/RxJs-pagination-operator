import { Observable, of, Subject } from 'rxjs';
import {
  exhaustMap,
  map,
  scan,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { Paging } from './data-factory.service';

export interface ListPaged {
  page?: {
    size: number;
    number: number;
  };
}

export interface ListRequest<T> {
  request: ListPaged;
  initData?: ListResponseItems<T>;
}

export interface ListResponseItems<T> {
  paging?: Paging;
  items: T[];
  currentPage?: number;
  status?: number;
  size?: number;
  error?: boolean;
}

export class PaginateListLoader<T> {
  private _baseSubject: Subject<ListRequest<T>>;
  private _nextPageSubject: Subject<boolean>;
  private _items$: Observable<ListResponseItems<T>>;

  constructor(
    paginate: (request: ListPaged) => Observable<ListResponseItems<T>>
  ) {
    this._baseSubject = new Subject<ListRequest<T>>();

    this._items$ = this._baseSubject.pipe(
      tap(() => {
        if (this._nextPageSubject) {
          this._nextPageSubject.complete();
        }
        this._nextPageSubject = new Subject<boolean>();
      }),
      switchMap((baseRequest) => {
        // Accumulate requests
        // Can't use scan operator before exhaustMap
        let request: ListPaged = { ...baseRequest.request };
        return this._nextPageSubject.pipe(
          startWith(baseRequest),
          exhaustMap((listRequest) => {
            if (typeof listRequest !== 'boolean' && listRequest.initData) {
              return of({ ...listRequest.initData });
            }

            return paginate({
              ...request,
            });
          }),
          map((response: ListResponseItems<T>) => ({ ...response })),
          // Accumulate responses
          scan(
            (acc: ListResponseItems<T>, curr: ListResponseItems<T>) => {
              request = {
                ...request,
                page: { ...request.page, number: request.page.number + 1 },
              };
              if (request.page.number >= curr.paging.pagesCount) {
                this._nextPageSubject.complete();
              }
              return {
                ...curr,
                items: [...acc.items, ...curr.items],
                currentPage: request.page.number,
              };
            },
            { items: [] }
          )
        );
      })
    );
  }

  public loadNextPage(): void {
    if (this._nextPageSubject) {
      this._nextPageSubject.next(true);
    }
  }

  public loadData(request: ListRequest<T>): void {
    this._baseSubject.next(request);
  }

  public initData(initData: ListRequest<T>): void {
    this._baseSubject.next(initData);
  }

  get items$(): Observable<ListResponseItems<T>> {
    return this._items$;
  }
}
