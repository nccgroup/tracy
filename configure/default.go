package configure

const DefaultConfig = `{
  "tracers": {
  	"{{XSS}}": "\"'<[[ID]]>",
  	"{{PLAIN}}": "[[ID]]"
   },
  "default-tracer": "{{PLAIN}}",
  "server-whitelist": [
  	"localhost:8081", 
    "127.0.0.1:8081", 
    "localhost:3000", 
    "127.0.0.1:3000"
  ],
  "tracer-server": "127.0.0.1:8081",
  "proxy-server": "127.0.0.1:7777",
  "auto-fill": false,
  "filters": [],
  "public-key-loc": "%s",
  "private-key-loc": "%s"
}`
