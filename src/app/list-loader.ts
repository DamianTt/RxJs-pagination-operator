import { defer, EMPTY, Observable, ObservableInput, Subject } from 'rxjs';
import { exhaustMap, map, startWith, switchMap, tap } from 'rxjs/operators';
import { Paging } from './data-factory.service';

export interface ListPaged {
  next?: boolean;
  page?: {
    size: number;
    number: number;
  };
}

export interface ListResponseItems<T> {
  paging: Paging;
  items: T[];
  currentPage?: number;
  status?: number;
  size?: number;
  error?: boolean;
}

interface PaginateListAccumulator<T> extends ListResponseItems<T> {
  request: ListPaged;
}

export class PaginateListLoader<T, R> {
  private _baseSubject: Subject<ListPaged>;
  private _nextPageSubject: Subject<ListPaged>;
  private _items$: Observable<ListResponseItems<T>>;

  constructor(
    paginate: (request: ListPaged) => Observable<ListResponseItems<T>>
  ) {
    this._baseSubject = new Subject<ListPaged>();
    this._nextPageSubject = new Subject<ListPaged>();

    this._items$ = this._baseSubject.pipe(
      switchMap((req) => {
        return this._nextPageSubject.pipe(
          startWith(req),
          paginateList(paginate)
        );
      })
    );
  }

  public loadNextPage(): void {
    this._nextPageSubject.next({ next: true });
  }

  public loadData(request: R): void {
    this._baseSubject.next(request);
  }

  get items$(): Observable<ListResponseItems<T>> {
    return this._items$;
  }
}

export function paginateList<R>(
  dataLoader: (request: ListPaged) => Observable<ListResponseItems<R>>
) {
  return (source$: Observable<ListPaged>) =>
    source$.pipe(
      exhaustScan((acc: PaginateListAccumulator<R>, curr: ListPaged) => {
        if (!curr.next) {
          return dataLoader({
            ...curr,
          }).pipe(
            map((response) => ({
              ...response,
              items: [...response.items],
              currentPage: curr.page.number,
              request: { ...curr },
            }))
          );
        }

        if (curr.next && acc) {
          const nextPageNumber = acc.currentPage + 1;
          if (acc.paging.pagesCount <= nextPageNumber) {
            return EMPTY;
          }
          const newRequest = {
            ...acc.request,
            page: { ...acc.request.page, number: nextPageNumber },
          };
          return dataLoader(newRequest).pipe(
            map((response) => ({
              ...response,
              items: [...acc.items, ...response.items],
              currentPage: nextPageNumber,
              request: newRequest,
            }))
          );
        }

        return EMPTY;
      }, null)
    );
}

// https://github.com/svenvanheugten/rxjs-exhaustscan
export function exhaustScan<T, R>(
  accumulator: (acc: R, value: T, index: number) => ObservableInput<R>,
  seed: R
) {
  return (source: Observable<T>) =>
    defer(() => {
      let acc: R = seed;

      return source.pipe(
        exhaustMap(
          (value: T, index: number): ObservableInput<R> =>
            accumulator(acc, value, index)
        ),
        tap((value: R) => (acc = value))
      );
    });
}
