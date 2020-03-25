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

// MapEvent is global and unique (only one MapEvent at a time)
MapEvent = undefined;
	
function initMapEvent() {
	MapEvent = {};
	// inicializo consultas, teselas y parcelas
	MapEvent.queries = 0;
	MapEvent.patches = 0;
	MapEvent.plots = 0;
	// siempre categoría "map"	
	MapEvent.event_category = 'map';
	// inicializo etiqueta
	MapEvent.event_label = '';
	// preparo acción y etiqueta a partir del modo 
	MapEvent.action = 'map_update_';
	if (Sesion.modo === 'PROV') {
		MapEvent.action += 'prov';
		delete MapEvent.patches;
		delete MapEvent.plots;
	}
	else if (Sesion.modo === 'NOPARC') {
		MapEvent.action += 'noparc';
		delete MapEvent.plots;
	}
	else if (Sesion.modo === 'PARC') {
		// detecto si se muestran parcelas o no
		if (Sesion.mostrarparcs) {	
			MapEvent.action += 'parc';
		}
		else {
			MapEvent.action += 'noparc';
			delete MapEvent.plots;
		}
	}	
	else if (Sesion.modo === 'ARB') 
		MapEvent.action += 'arb';
	// timestamp in milliseconds
	MapEvent.init = Date.now();
}
function addBoxMapEvent(labbox) {
	// pongo etiqueta del box
	MapEvent.event_label += labbox;
}

function addMapEvent(key, amount) {
	if (MapEvent != undefined) {
		if (MapEvent[key] != undefined)
			MapEvent[key] += amount;
	}
}

function sendMapEvent() {
	if (MapEvent != undefined) {
		// timestamp de fin en milisegundos
		MapEvent.end = Date.now(); // timestamp in milliseconds 		
		// reformateo el objeto MapEvent para el evento
		MapEvent.value = MapEvent.end - MapEvent.init;
		var action = MapEvent.action;
		delete MapEvent.action;
		delete MapEvent.end;
		delete MapEvent.init;
		// envío el evento		
		gtag('event', action, MapEvent);
		// mando también tiempos de usuario con la latencia y el número de consultas en la etiqueta
		sendUserTiming(action, 'latency', MapEvent.event_label + " - nqueries: " + MapEvent.queries, MapEvent.value);
		//sendUserTiming(action, 'nqueries', MapEvent.event_label, MapEvent.queries);
	}
}

function sendUserTiming(cat, name, label, value) {
	// preparo objeto del user timing con la info
	var obj = {};
	obj.event_category = cat;
	obj.name = name;
	obj.event_label = label;
	obj.value = value;
	// envío el user timing	
	gtag('event', 'timing_complete', obj);
}

function sendTimeoutEvent() {
	if (MapEvent != undefined) {
		// incluyo etiqueta de timeout a la acción que tenía
		var action = MapEvent.action + "_timeout";
		// pongo por valor el timeout
		MapEvent.value = Sesion.timeout;
		// borro datos no relevantes
		delete MapEvent.action;
		delete MapEvent.end;
		delete MapEvent.init;
		// envío el evento		
		gtag('event', action, MapEvent);
	}
}

function sendEvent(cat, action, label, value) {
	// preparo objeto del evento con la info
	var obj = {};
	obj.event_category = cat;
	obj.event_label = prefixProcessing(label);
	if (value != undefined)
		obj.value = value;
	// envío el evento	
	gtag('event', action, obj);
}

function prefixProcessing(label) {
	// si hay algún prefijo que coincida hago la sustitución
	var prefijos = _.keys(queryPrefixes);
	_.each(prefijos, function(pref) {
		var cadena = queryPrefixes[pref];
		if (label.indexOf(cadena) == 0)
			label = label.replace(cadena, pref + ":");
	})
	return label;
}