import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
	const products = [{
      ID: 1,
      TracerString: "TracerString1",
      Method: "GET",
      Host: "www.google.com",
      Path: "/search",
      Params: "source=hp&ei=SRAOWvDTI6G-jwSxqZyQCA&q=SBUFhQDaSV&oq=cKnokfQjuE&gs_l=psy-ab.12...5285.5285.0.8084.1.1.0.0.0.0.466.466.4-1.1.0....0...1..64.psy-ab..0.0.0....0.tp7s2w1D65Q",
      TracerEventType: "DOM",
      Contexts: [{
      	ID: 1,
        ContextLocationType: "1",
        NodeType: "a",
        ContextData: "/search?q=SBUFhQDaSV&source=lnt&tbs=li:1&sa=X&ved=0ahUKEwjD84Opk8TXAhXHz4MKHYp2C_0QpwUIHg"
      },{
      	ID: 2,
        ContextLocationType: "3",
        NodeType: "a",
        ContextData: "/search?q=SBUFhQDaSV&source=lnt&tbs=li:1&sa=X&ved=0ahUKEwjD84Opk8TXAhXHz4MKHYp2C_0QpwUIHg"
      }]
  },{
      ID: 2,
      TracerString: "TracerString2",
      Method: "GET",
      Host: "www.google2.com",
      Path: "/search2",
      Params: "sourcesad=hp&ei=SRAOWvDTI6G-jwSxqZyQCA&q=SBUFhQDaSV&oq=cKnokfQjuE&gs_l=psy-ab.12...5285.5285.0.8084.1.1.0.0.0.0.466.466.4-1.1.0....0...1..64.psy-ab..0.0.0....0.tp7s2w1D65Q",
      TracerEventType: "DOM",
      Contexts: []
  },{
      ID: 3,
      TracerString: "TracerString3",
      Method: "PUT",
      Host: "www.google3.com",
      Path: "/search2",
      Params: "sourcesad=hp&ei=SRAOWvDTI6G-jwSxqZyQCA&q=SBUFhQDaSV&oq=cKnokfQjuE&gs_l=psy-ab.12...5285.5285.0.8084.1.1.0.0.0.0.466.466.4-1.1.0....0...1..64.psy-ab..0.0.0....0.tp7s2w1D65Q",
      TracerEventType: "Request",
      Contexts: []
  },{
      ID: 4,
      TracerString: "TracerString4",
      Method: "POST",
      Host: "www.google4.com",
      Path: "/search2",
      Params: "sourcesad=hp&ei=SRAOWvDTI6G-jwSxqZyQCA&q=SBUFhQDaSV&oq=cKnokfQjuE&gs_l=psy-ab.12...5285.5285.0.8084.1.1.0.0.0.0.466.466.4-1.1.0....0...1..64.psy-ab..0.0.0....0.tp7s2w1D65Q",
      TracerEventType: "DOM",
      Contexts: []
  }];
   const options = {
      expandRowBgColor: 'rgb(242, 255, 163)'
    };
ReactDOM.render(<App data={products} options={options}/>, document.getElementById('root'));
registerServiceWorker();
