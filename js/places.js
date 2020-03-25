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

function procesarSugerenciasLugares(entrada) {
	// pido sugerencias (incluso si la entrada es una cadena vacía)
	var qdata = {
		suggest: true,				
		'suggest.q': entrada
	};					
	SugeProv.getSuggestions(qdata, function(datos) {
		var keys = Object.keys(datos.suggest.mySuggester);
		if (keys.length > 0) {
			// paso el objeto con los resultados para el rendering
			renderSugerenciasLugares(datos.suggest.mySuggester[keys[0]]);
		}
	});
}
function renderSugerenciasLugares(resultados) {
	// objeto sugerencias
	var sinfo = {};
	sinfo.sugerencias = [];
	
	// formateo las sugerencias
	if (resultados.numFound == 0)
		sinfo.nosugerencias = true;
	else {
		_.each(resultados.suggestions, function(suge) {
			var el = {};
			el.id = suge.payload; // el id
			el.name = suge.term; // la sugerencia
			sinfo.sugerencias.push(el);
		});
	}
	
	// muestro sugerencias
	var cont = Mustache.render(sugeLugaresTemplate, sinfo);
	$("#sugelugares").html(cont);
		
	// handler de los botones de sugerencias de lugares
	$(".bot_suge_lugar").click(function() {
		// obtengo id de la sugerencia
		var id = $(this).attr("id");
		// pedimos la información del lugar
		var qdata = { q:'id:' + id };					
		LugaresProv.getPlace(qdata, function(datos) {
			if (datos.response.numFound > 0) {
				var sel = datos.response.docs[0];
				seleccionarLugar(sel);
			}
		});
	});
	
	// inicializo focus
	Sesion.lugarfocus = -1;
}


function seleccionarLugar(lugar) {
	// pongo nombre	en la entrada
	$("#in_lugares").val(lugar.name);	
	// escondo la lista de sugerencias
	$("#sugelugares").addClass("d-none");
	// se tuesta al clickar en una sugerencia tras ejecutar: $("#sugelugares").html("");
	// como alternativa, lo incluyo tras un delay
	setTimeout(function(){
		$("#sugelugares").html("");
	}, 400);
	
	// inicializo focus
	Sesion.lugarfocus = -1;
	
	// si había marcador de lugar, lo quito
	if (Sesion.lugarmarker != null)
		Sesion.lugarmarker.remove();
	
	// pongo tooltip y marcador en el lugar
	var tooltip = '<strong>'+lugar.name+'</strong>';
	// pongo el tipo de lugar
	tooltip += '<br>' + getLiteral(dict[lugar.feature_code]);
	// obtengo etiqueta provincia
	if (lugar.admin2_code != undefined) {
		var pr = _.find(provs.features, function(pr) {
			return pr.properties.admin2_code === lugar.admin2_code;
		});
		if (pr != undefined)
			tooltip += "<br>"+getLiteral(dict.provinceof)+' '+pr.properties.texto;
	}
	// población
	if (lugar.population > 0)
		tooltip += '<br>'+getLiteral(dict.population)+': '+Number(lugar.population).toLocaleString();
	// coordenadas
	var coords = [lugar.latitude, lugar.longitude];	
	// pongo marcador
	Sesion.lugarmarker = L.marker(coords, {icon: Iconos.lugar})
		.bindTooltip(tooltip)
		.addTo(Map);
		
	// guardo lugar en la sesión (para poder hacer un zoom si se pulsa intro en la entrada)
	Sesion.lugar = lugar;
	
	// mando evento a GA
	sendEvent('places', 'places_selection', lugar.name);
	
	// navegamos al municipio
	Map.flyTo(coords, config.zLugar, {animate: true, duration: 1});
	// anterior
	// Map.setView(coords, config.zLugar);
}
function ajustarLugarfocus() {
	// Sesion.lugarfocus = 0; => cajetín entrada
	// Sesion.lugarfocus = i; => num de sugerencia
	// obtengo número de sugerencias
	var ns = $("#sugelugares").children(":enabled").length;
	// reajusto índice del focus si hace falta
	if (ns == 0) Sesion.lugarfocus = -1;
	else if (Sesion.lugarfocus >= ns) Sesion.lugarfocus = 0;
	else if (Sesion.lugarfocus < 0) Sesion.lugarfocus = ns -1;
	// y ahora las cosas visuales
	$("#sugelugares").children().removeClass("active");
	if (Sesion.lugarfocus >= 0)
		$("#sugelugares").children().eq(Sesion.lugarfocus).addClass("active");
}
