import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    private http: Http,
    private elementRef:ElementRef
  ){}
  title = 'Ulster University Subjects';
  private api: string = 'https://ulster.funnelback.co.uk/s/search.json?collection=ulster-dev&num_ranks=3000&sort=title';
  private dataapi: string = 'https://www.ulster.ac.uk/digital-prospectus/_web_services/static/8-10-18/faculties-and-schools';
  ////private dataapi: string = 'http://localhost/faculties-and-schools.json';
  schools: any = [];
  private schoolsData: any = [];
  private subject: Subject<string> = new Subject();

  /*
   * API connect
   */
  apiConnect(api, query) {
    var req = this.http.get(api + query).map((res:Response) => res.json());
    return req;
  }

  /*
   * remove duplicates from an array
   */
  removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
       return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
  }

  ngOnInit() {
    this.schools = [];

    /* observable
     * Observables provide support for passing messages between publishers and subscribers in your application.
     * https://angular.io/guide/observables
     */
    var req = this.apiConnect(this.api, '&f.Campus|campus=' + this.elementRef.nativeElement.getAttribute('query'));

    /* subscribe to observable */
    req.subscribe(data => {
      data.response.resultPacket.results.forEach(course => {
        const exists = this.schools.indexOf(course.assetid) > -1;
        var label = course.metaData.school + ' - ' + course.metaData.campus;
        label = label.replace('School of', '');
        label = label.replace('Department of ', '');
        label = label.replace('Belfast ', '');
        label = label.replace('The Business Institute', 'Business');
        //DEBUG
        //console.log(label);
        if (course.metaData.school) {
          if (course.metaData.school == 'Centre for Flexible and Continuing Education') {
            //do nothing
          } else {
            this.schools.push({
              label: label,
              school: course.metaData.school,
              campus: course.metaData.campus
            });
          }
        }
      });
      this.schools = this.removeDuplicates(this.schools, 'label');
      this.schools = this.schools.sort(function(a, b){
        var nameA = a.label.toLowerCase(), nameB = b.label.toLowerCase()
        if (nameA < nameB) //sort string ascending
          return -1
        if (nameA > nameB)
          return 1
        return 0 //default return value (no sorting)
      });
    });

    this.schoolsData = [];
    var reqTwo = this.apiConnect(this.dataapi, '');
    reqTwo.subscribe(data => {
      data.forEach(school => {
        this.schoolsData.push({
          name: school.school_name,
          description: school.school_description,
          image: school.school_image_url
        });
      });
    });
  }
}
