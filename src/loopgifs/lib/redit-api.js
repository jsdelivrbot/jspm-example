import jsonp from 'jsonp';
class ReditApi {
  constructor() {
    this.reditURL = "https://www.reddit.com/r/perfectloops/top.json?sort=top&t=week&jsonp=callbackFunction";
  }

  load() {
    return new Promise((resolve, reject) => {
      jsonp(this.reditURL, {param: 'jsonp'}, (err, data)=> {
        err ? reject(err) : resolve(data.data.children)
      })
    })
  }
}

export default new ReditApi();
