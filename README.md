<p align="center">
  <img src="https://user-images.githubusercontent.com/16947503/38943629-c354d81a-42e6-11e8-9644-cc956d92fbcc.png" width=250/>
</p>

## Tracy
A pentesting tool designed to assist with finding all sinks and sources of a web
application and display these results in a digestible manner. `tracy` should be used
during the mapping-the-application phase of the pentest to identify sources of input
and their corresponding outputs. `tracy` can use this data to intelligently find
vulnerable instances of XSS, especially with web applications that use lots of JavaScript.

`tracy` is a browser extension and light-weight HTTP proxy that records all user input 
to a web application and monitors any time those inputs are output, for example in a
DOM write, server response, or call to `eval`.

For guides and reference materials about `tracy`, see [the documentation](https://github.com/nccgroup/tracy/wiki).

## Installation
It is strongly recommended that you use a released version. Release binaries are available
on the [releases](https://github.com/nccgroup/tracy/releases) page. Download the appropriate 
release binary and run it:

```bash
# Run the proxy server and the tracer API. Pick the binary that works for your host.
$ ./tracy-linux-amd64
```

Then, install the browser extension with Firefox or Chrome using one of the following links:

[firefox](https://addons.mozilla.org/en-US/firefox/addon/tracyplugin/)<br>
[chrome](https://chrome.google.com/webstore/detail/tracy/lcgbimfijafcjjijgjoodgpblgmkckhn)

Once tracy is running and the plugin is installed, install the certificate into your browser's certificate store(the certifcate is located in the .tracy folder in the home directory) and configure your browser to use the proxy(the default proxy address is localhost on port 7777) 

*Note:* The `tracy` binary and browser extension work together. Running one without the other 
will result in unexpected behavior.
