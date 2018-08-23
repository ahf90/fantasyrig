chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == 'install') {
        chrome.tabs.create({url: 'install.html', active: true}, function(tab) {});
    }
});
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-99856637-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();