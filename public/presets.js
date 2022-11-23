function doHeader(){
  let h = `<nav>
<div class="nav-bar">
    <div class="nav-bar-left"><a href ="/" style="color:WHITE;">
        <img src="https://github.com/DevJeffreyG/JeffreyBot/blob/v2.X.X/src/resources/imgs/icon.png?raw=true" alt="JB Logo" class="logo">
    </div>
    <div class="nav-left-brand-text">Jeffrey Bot</a></div>
    <a href ="https://www.youtube.com/JeffreyG" target="_blank"><div class="nav-bar-right">
        <img src="https://pbs.twimg.com/media/EXH_bsHXkAUNUp_?format=jpg&name=4096x4096" alt="Jeffrey Logo" class="j-logo">
    </div></a>
    <div class="nav-right-brand-text">
        By <a href ="https://www.youtube.com/JeffreyG" style="color:WHITE;" target="_blank">JeffreyG</a>
    </div>
</div>
</nav>`;
  
  return document.write(h);
}

function doFooter(){
  let h = `<div class="contenedor">
    <svg class="selfServeStepsWave-_t0iR4 wave-38gW17" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1440 267"><path d="M1440,71.5c-18.11-3.24-46.81,5.09-81.79,16.37-32.68,10.54-73.32,23.63-122.86,32.24-50.66,8.8-73.87-9.64-104.17-33.74-31.93-25.39-71.75-57-159.92-69.7C854.11-.14,759.57,31.7,682.83,57.54,647,69.6,615.1,80.35,586.56,84.24c-47.22,6.45-81.17-4.35-115.95-15.42-31.29-10-63.26-20.13-106.19-18.14-40,1.86-72.54,28.27-102.9,52.89-38.47,31.19-73.39,59.5-115.3,31.33C71.23,84.5,0,113.86,0,113.86V267H1440Z" fill="#18191c"></path></svg>
    <div class="centrado2"><a href="https://www.youtube.com/JeffreyG">(c) JeffreyG - 2018 - presente</a></div>
  </div>`;
  return document.write(h)
}