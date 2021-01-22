import { defer, EMPTY, Observable, ObservableInput } from 'rxjs';
import { exhaustMap, map, tap } from 'rxjs/operators';
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

// First draft
// It aint much, but its honest work
/* export function ListLoader2<T>(
  dataLoader: (request: ListPaged) => Observable<ListResponseItems<T>>
) {
  let nextPage$: Subject<any> = null;

  this.valueChanges = new Subject<ListResponseItems<T>>();

  this.nextPage = () => {
    if (nextPage$) {
      nextPage$.next();
    }
  };

  this.load = (request: ListPaged) => {
    return dataLoader(request).pipe(
      tap((response: ListResponseItems<T>) => {
        nextPage$ = new Subject<null>();
        this.valueChanges.next(response);
        if (response.paging.pagesCount <= 1) {
          console.log('complete()');
          nextPage$.complete();
        }
      }),
      map((response: ListResponseItems<T>) => ({
        ...response,
        currentPage: request.page.number,
      })),
      exhaustMap((basicResponse: ListResponseItems<T>) => {
        return nextPage$.pipe(
          exhaustScan((acc, curr) => {
            console.log('nowy acc: ', acc);
            const nextPageNumber = acc.currentPage + 1;
            return dataLoader({
              ...request,
              page: { ...request.page, number: nextPageNumber },
            }).pipe(
              map((response) => ({
                ...response,
                items: [...acc.items, ...response.items],
                currentPage: nextPageNumber,
              }))
            );
          }, basicResponse),
          tap((response: ListResponseItems<T>) => {
            this.valueChanges.next(response);

            console.log('FinalResponse: ', response);
            if (response.paging.pagesCount <= response.currentPage) {
              console.log('complete()');
              nextPage$.complete();
            }
          })
        );
      })
    );
  };
} */

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
