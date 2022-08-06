var Promise = require("Promise");

function fetchModel(url) {
  return new Promise(function(resolve, reject) {
      function xhrHandler(event) {
        if (this.readyState != 4) {
          return;
        }
        if (this.readyState == 4 && this.status == 200) {
          resolve({data: JSON.parse(this.responseText)});
          return;
        }
        if (this.status != 200) {
          reject({error: msg, status:this.status, statusText:this.statusText});
          return;
        }
      }

      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = xhrHandler;
      xhr.open("GET", url);
      xhr.send();
  });
}

export default fetchModel;