package proxy

var requestCacheSetChan chan *requestCacheSet
var requestCacheGetChan chan *requestCacheGet

type requestCacheSet struct {
	url    string
	method string
	resp   []byte
}

type requestCacheGet struct {
	url    string
	method string
	ok     chan bool
	resp   chan []byte
}

func init() {
	requestCacheSetChan = make(chan *requestCacheSet, 50)
	requestCacheGetChan = make(chan *requestCacheGet, 50)
	go requestCacheRunner()
}

func requestCacheRunner() {
	var (
		set  *requestCacheSet
		get  *requestCacheGet
		resp []byte
		ok   bool
	)
	cache := make(map[string][]byte)
	for {
		select {
		case set = <-requestCacheSetChan:
			// Caching takes into account the request method as well as the URL.
			cache[set.method+":"+set.url] = set.resp
		case get = <-requestCacheGetChan:
			resp, ok = cache[get.method+":"+get.url]
			get.ok <- ok
			get.resp <- resp
		}
	}
}
