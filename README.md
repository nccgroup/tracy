<p align="center">
  <img src="https://user-images.githubusercontent.com/16947503/38943629-c354d81a-42e6-11e8-9644-cc956d92fbcc.png" width=250/>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/tracyplugin/"><img src="https://extensionworkshop.com/assets/7a17e6-5cc43798bf2472557d8b437e779316758d0e41483542e921f6781694623ee71c.png"></img></a>
</p>

## Tracy
A pentesting tool designed to assist with finding all sinks and sources of a web
application and display these results in a digestible manner. `tracy` should be used
during the mapping-the-application phase of the pentest to identify sources of input
and their corresponding outputs. `tracy` can use this data to intelligently find
vulnerable instances of XSS, especially with web applications that use lots of JavaScript.

`tracy` is a browser extension that records all user input 
to a web application and monitors any time those inputs are output, for example in a
DOM write, server response, or call to `eval`.

For guides and reference materials about `tracy`, see [the documentation](https://github.com/nccgroup/tracy/wiki).

## Installation

Tracy is now only a browser extension! No more binaries, just download it from the Chrome or Firefox store.

* [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tracyplugin/)
* [Chrome](https://chrome.google.com/webstore/detail/tracy/lcgbimfijafcjjijgjoodgpblgmkckhn).

And that's it! As long as tracy is installed in your browser, you are ready to find XSS. There is no longer
any requirements to configure a proxy or certificates.
