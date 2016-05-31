export default(urls)=> {
  var elem = document.querySelector("#gifs");
  elem.innerHTML=urls.map(url=>`<div><img src="${url}"></div>`).join('\n');

}
