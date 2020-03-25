/*
   Copyright 2019, Guillermo Vega-Gorgojo
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/////////////// SOLR

function TextEngine(uri) {  
    this.queryText = function(qdata, retfunc, failfunc) {
		var jqxhr = $.ajax({
			url: uri,
			dataType: "json",
			crossDomain: true,
			traditional: true,
			data: qdata
			});
	
		jqxhr.done(retfunc); 
	
		jqxhr.fail((failfunc) ? failfunc :
			function(obj, status, errorThrown) {
				console.log("ERROR DEL MOTOR SOLR\n"+ status + "\n" + errorThrown); 
			});

		return jqxhr; 
    };    
}; 

function PlaceSuggesterProvider(uri, defaultFailFunc) {
	var textengine = new TextEngine(uri);
	
	this.probar = function(callback, failfunc) {
		// probando con una llamada vacía...
		this.getSuggestions({}, callback, failfunc);
	};    
	
    this.getSuggestions = function(qdata, callback, failfunc) {
    	if (textengine != null)
			return textengine.queryText(qdata, callback, (failfunc) ? failfunc : defaultFailFunc);
		else
			(failfunc) ? failfunc() : defaultFailFunc();
    }; 
}

function PlaceSelectionProvider(uri, defaultFailFunc) {
	var textengine = new TextEngine(uri);
	
	this.probar = function(callback, failfunc) {
		// probando con una llamada vacía...
		this.getPlace({}, callback, failfunc);
	};    
	
    this.getPlace = function(qdata, callback, failfunc) {
    	if (textengine != null)
			return textengine.queryText(qdata, callback, (failfunc) ? failfunc : defaultFailFunc);
		else
			(failfunc) ? failfunc() : defaultFailFunc();
    }; 
}


/////////////// SPARQL

function SparqlServer(uri, httpMethod, gruri, auth) {
    var method = (httpMethod) ? httpMethod : "GET";
    var graph = (gruri) ? gruri : undefined;
    
    this.querySparql = function(query, retfunc, failfunc) {
    	// query data
    	var qdata = {};
    	// is there a graph?
		if (graph != undefined)
			qdata["default-graph-uri"] = graph;
		// remaining data
    	qdata.query = query;
		qdata.format = 'json';
		qdata.Accept = 'application/sparql-results+json';
		
		// ajax settings
		var ajaxsettings = {
			url: uri,
			cache: true,
			dataType: "json",
			type: method,
			data: qdata
		};
		
		// auth
		if (auth != undefined) {
			ajaxsettings.beforeSend = function (xhr) {
			    xhr.setRequestHeader ('Authorization', 'Basic ' + auth);
			};		
		};		
		
		// probando auth...
		//qdata.Authorization = 'Basic ' + btoa('s4h98jlqp297:km5trmc6k93hgf5');
    
    	// send ajax request
		var jqxhr = $.ajax(ajaxsettings);	
		
		jqxhr.done(function(datos) {
			// need to store data!
			//Grabar = true;
			// report new query TODO!!!
			//newQueryReport();
			// callback
			retfunc(datos);
		});
	
		jqxhr.fail((failfunc) ? failfunc :
			function(obj, status, errorThrown) {
			   console.error("ERROR DEL PUNTO SPARQL\n"+ status + "\n" + errorThrown); 
			});

		return jqxhr; 
    };    
};

function DataProvider(uri, httpMethod, gruri, defaultFailFunc, auth) {
    var sparqlserver = new SparqlServer(uri, httpMethod, gruri, auth);
    
    /**
       queryname: name of the query
       arg: a map string=>string containing the values to be used for retrieving data (for Mustache)
       callback: a function to be called with resulting data
       failfunc: optional override of default function to run if things fail. 

       returns a deferred object, but not of any particular kind. (i.e. we 
       do not require it to be an ajax call)  The object may already be resolved. 
    */
    this.getData = function(queryname, arg, callback, failfunc) {
    	// get query object
    	var qo = _.find(queries, function(el) { return el.name === queryname; });
		// substitute parameters with mustache
		var query = Mustache.render(qo.query, arg);
		// process prefixes
		query = processPrefixes(query);
		// log query
		console.debug(query);
		// query!
		return sparqlserver.querySparql(query, callback, (failfunc) ? failfunc : defaultFailFunc); 	
    }; 
};

// 7-feb-2020: cambio procesamiento de prefijos para que las IRIs abreviadas no incluyan "/" ni "#"
function processPrefixes(query) {
	// inicializo cadena de prefijos
	var cadprefs = "";
	// cojo los prefijos y analizo uno a uno
	var prefijos = _.keys(queryPrefixes);
	_.each(prefijos, function(pref) {
		var huboReemplazo = false;
		// preparamos la cadena a sustituir
		var cadsust = "<" +  queryPrefixes[pref];
		var istart = 0; // carácter para empezar la búsqueda
		// analizamos la cadena para las sustituciones		
		while (query.indexOf(cadsust, istart) != -1) {
			// obtengo el índice la sustitución (para eliminar el ">" siguiente)
			var indini = query.indexOf(cadsust, istart);
			// obtengo sufijo
			var indfin = query.indexOf(">", indini);
			var sufijo = query.substring(indini + cadsust.length, indfin);
			// reemplazo posible si el sufijo no tiene ni "/" ni "#"
			if (sufijo.indexOf("/") == -1 && sufijo.indexOf("#") == -1) {
				// hago reemplazo
				var cadreemplazar = cadsust + sufijo + ">";
				var cadreemplazo = pref + ":" + sufijo;
				query = query.replace(cadreemplazar, cadreemplazo);
				// actualizo huboReemplazo
				huboReemplazo = true;
				// actualizo istart
				istart = indini + cadreemplazo.length;
			}
			else // reemplazo no posible, actualizo istart
				istart = indfin;
		}
		// incluyo el prefijo si hay alguno en el texto de la consulta (se haya hecho lo anterior o no)
		if (query.indexOf(pref+":") != -1 && huboReemplazo)
			cadprefs += "PREFIX " + pref + ": <" +  queryPrefixes[pref] + ">\n";
	});
	return cadprefs + query;
}
/*
function processPrefixes(query) {
	// inicializo cadena de prefijos
	var cadprefs = "";
	// cojo los prefijos y analizo uno a uno
	var prefijos = _.keys(queryPrefixes);
	_.each(prefijos, function(pref) {
		// preparamos la cadena a sustituir
		var cadsust = "<" +  queryPrefixes[pref];
		// analizamos la cadena para las sustituciones		
		while (query.indexOf(cadsust) != -1) {
			// obtengo el índice la sustitución (para eliminar el ">" siguiente)
			var indice = query.indexOf(cadsust);
			// hago reemplazo
			query = query.replace(cadsust, pref + ":");
			// elimino el ">" siguiente
			var indmayor = query.indexOf(">", indice);
			query = query.slice(0, indmayor) + query.slice(indmayor + 1);
		}
		// incluyo el prefijo si hay alguno en el texto de la consulta (se haya hecho lo anterior o no)
		if (query.indexOf(pref+":") != -1)
			cadprefs += "PREFIX " + pref + ": <" +  queryPrefixes[pref] + ">\n";
	});
	return cadprefs + query;
}*/