import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DataFactoryService,
  FancyObject,
  MyDataRequest,
  MyDataResponse,
} from './data-factory.service';
import {
  ListResponseItems,
  PaginateListLoader,
} from './list-loader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'paginate-operator';

  listLoader: PaginateListLoader<FancyObject>;

  constructor(private dataFactoryService: DataFactoryService) {
    const paginate = (request: MyDataRequest) => {
      return this.dataFactoryService
        .getData(request)
        .pipe(this.afterFancyItemsLoad());
    };

    this.listLoader = new PaginateListLoader(paginate);
  }

  ngOnInit() {}

  afterFancyItemsLoad() {
    return (source$: Observable<MyDataResponse>) =>
      source$.pipe(map(this.fancyItemMapper));
  }

  fancyItemMapper = (
    response: MyDataResponse
  ): ListResponseItems<FancyObject> => ({
    items: response.data.fancyItems,
    paging: response.data.paging,
  });

  getNewData() {
    this.listLoader.loadData({ request: { page: { number: 0, size: 15 } } });
  }

  getNextPage() {
    this.listLoader.loadNextPage();
  }

  initData() {
    const request: MyDataRequest = { page: { number: 0, size: 10 } };
    this.dataFactoryService.getData(request).subscribe((response) => {
      this.listLoader.initData({
        request: request,
        initData: this.fancyItemMapper(response),
      });
    });
  }
}
