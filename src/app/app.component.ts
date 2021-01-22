import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DataFactoryService,
  FancyObject,
  MyDataRequest,
  MyDataResponse,
} from './data-factory.service';
import { ListPaged, ListResponseItems, paginateList } from './list-loader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'paginate-operator';

  // fancyItemLoader;

  fancyItemSubject: Subject<ListPaged>;

  fancyItem$: Observable<ListResponseItems<FancyObject>>;

  constructor(
    private dataFactoryService: DataFactoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // this.fancyItemLoader = new ListLoader1<FancyObject>(
    //   (request: MyDataRequest) =>
    //     this.dataFactoryService
    //       .getData(request)
    //       .pipe(this.afterFancyItemsLoad())
    // );
  }

  initStreams() {
    if (this.fancyItemSubject) {
      this.fancyItemSubject.complete();
    }
    this.fancyItemSubject = new Subject<ListPaged>();
    this.fancyItem$ = this.fancyItemSubject.pipe(
      paginateList((request: MyDataRequest) =>
        this.dataFactoryService
          .getData(request)
          .pipe(this.afterFancyItemsLoad())
      )
    );
    this.cdr.detectChanges();
  }

  afterFancyItemsLoad() {
    return (source$: Observable<MyDataResponse>) =>
      source$.pipe(
        map((response) => ({
          items: response.data.fancyItems,
          paging: response.data.paging,
        }))
      );
  }

  getNewData() {
    // this.fancyItemLoader.load({ page: { number: 0, size: 10 } }).subscribe;

    this.initStreams();
    this.fancyItemSubject.next({ page: { number: 0, size: 10 } });
  }

  getNextPage() {
    if (this.fancyItemSubject) {
      this.fancyItemSubject.next({ next: true });
    }
  }
}
