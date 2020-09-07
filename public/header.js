function doHeader(){
  let h = `<nav>
<div class="nav-bar">
    <div class="nav-bar-left"><a href ="https://jeffrey-bot.glitch.me/" style="color:WHITE;">
        <img src="https://cdn.discordapp.com/attachments/482989052136652804/512689086276829184/JBLogo.png" alt="JB Logo" class="logo">
    </div>
    <div class="nav-left-brand-text">Jeffrey Bot</a></div>
    <a href ="https://www.youtube.com/JeffreyG" target="_blank"><div class="nav-bar-right">
        <img src="https://cdn.glitch.com/2c61ee42-4a04-4a21-b074-65934d0afc88%2FLogoJeffreyG--1-04-2019.jpg?1554335398036" alt="Jeffrey Logo" class="j-logo">
    </div></a>
    <div class="nav-right-brand-text">
        By <a href ="https://www.youtube.com/JeffreyG" style="color:WHITE;" target="_blank">JeffreyG</a>
    </div>
</div>
</nav>`;
  
  return document.write(h);
}