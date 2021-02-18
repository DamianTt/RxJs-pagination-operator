import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DataFactoryService,
  FancyObject,
  MyDataRequest,
  MyDataResponse,
} from './data-factory.service';
import { PaginateListLoader } from './list-loader';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'paginate-operator';

  dataFactorySub: PaginateListLoader<FancyObject>;

  constructor(private dataFactoryService: DataFactoryService) {
    const paginate = (request: MyDataRequest) => {
      return this.dataFactoryService
        .getData(request)
        .pipe(this.afterFancyItemsLoad());
    };

    this.dataFactorySub = new PaginateListLoader(paginate);
  }

  ngOnInit() {}

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
    this.dataFactorySub.loadData({ page: { number: 0, size: 10 } });
  }

  getNextPage() {
    this.dataFactorySub.loadNextPage();
  }
}
