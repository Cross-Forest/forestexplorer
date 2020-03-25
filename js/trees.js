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

// ÁRBOLES
function pintarArbolesBox(box) {
	// ¿cuántas parcelas hay pintadas en la capa?
	var nplots = _.keys(Sesion.parbsPintadas).length;

	// obtenemos las parcelas a pintar
	var plots = [];
	_.each(box, function(ploturi) {
		// sólo pintamos si no estaba la parcela en la capa
		if (Sesion.parbsPintadas[ploturi] == undefined) {
			// guardo la parcela en la lista
			plots.push(Datinv.parcelas[ploturi]);
			// y añado también a la lista de parcelas pintadas
			Sesion.parbsPintadas[ploturi] = []; // array para guardar los círculos de las parcelas
		}
		else { 
			// estaba pintada la parcela, reajusto popups de los círculos
			var texto = tooltipParcela(Datinv.parcelas[ploturi], true);
			_.each(Sesion.parbsPintadas[ploturi], function(circ) {
				circ.bindPopup(texto);
			});			
			// hago reajuste de iconos de los árboles si es necesario
			_.each(Datinv.parcelas[ploturi].arbs, function(arburi) {
				// recupero el árbol
				var arb = Datinv.arboles[arburi];
				// obtengo su icono
				var ticon = getIconoArbol(arb);
				// cambio el icono si no coincide
				if (Sesion.arbsPintados[arburi].getIcon() != ticon)
					Sesion.arbsPintados[arburi].setIcon(ticon);
			});
		}			
	});
	//console.log("# DE PARCELAS POR PINTAR: "+plots.length);
	// logging del rendering
	//console.log("Rendering de parcelas de árboles: " + _.keys(Sesion.parbsPintadas).length + " pintadas - " + plots.length +" pendientes");

	// pinto los 4 círculos de las parcelas: 5, 10, 15, 25m
	var imax = config.colplots[config.colcircplotind].length - 1;
	_.each(plots, function(plot) {	
		// obtengo texto del tooltip de la parcela		
		var texto = tooltipParcela(plot, true);
		// creo los 4 círculos y les incluyo un popup con el texto anterior
		Sesion.parbsPintadas[plot.uri].push( L.circle([plot.lat, plot.lng], 
				{color: config.colplots[config.colcircplotind][imax-6], weight: 1, radius: config.radioParcelaN3, fillOpacity: 0.7})
			.bindPopup(texto)
			.addTo(Arbs) );
		Sesion.parbsPintadas[plot.uri].push( L.circle([plot.lat, plot.lng], 
				{color: config.colplots[config.colcircplotind][imax-4], weight: 1, radius: config.radioParcelaN2, fillOpacity: 0.3})
			.bindPopup(texto)
			.addTo(Arbs) );
		Sesion.parbsPintadas[plot.uri].push( L.circle([plot.lat, plot.lng], 
				{color: config.colplots[config.colcircplotind][imax-2], weight: 1, radius: config.radioParcelaN1, fillOpacity: 0.3})
			.bindPopup(texto)
			.addTo(Arbs) );
		Sesion.parbsPintadas[plot.uri].push( L.circle([plot.lat, plot.lng], 
				{color: config.colplots[config.colcircplotind][imax], weight: 1, radius: config.radioParcelaN0, fillOpacity: 0.3})
			.bindPopup(texto)
			.addTo(Arbs) );

		// recorro los árboles de la parcela
		_.each(plot.arbs, function(arburi) {
			// recupero el árbol
			var arb = Datinv.arboles[arburi];
			// obtengo su icono
			var ticon = getIconoArbol(arb);
			// pinto y guardo el marcador del árbol
			Sesion.arbsPintados[arburi] = L.marker([arb.lat, arb.lng], {icon: ticon})
				.bindTooltip(tooltipArbol(arb))
				.addTo(Arbs);
		});
	});
}
function tooltipArbol(arb) {
	var tooltip = "<strong>"+getLiteral(dict.tree)+" " + uriToLiteral(arb.uri) + "</strong>";
	var espuri = getMoreSpecificSpecies(arb.types);
	// especie
	if (espuri != undefined && espuri != null && Datinv.especies[espuri][onturis.prVulgarName] != undefined) {		
		var nesp = firstUppercase(getLiteral(Datinv.especies[espuri][onturis.prVulgarName].lits, uriToLiteral(espuri)));
		// si hay nombre científico...
		if (Sesion.nomci) {
			nesp = '<i>' + firstUppercase(getLiteral(Datinv.especies[espuri][onturis.prScientificName].lits,
				nesp)) + '</i>';
		}
		tooltip += '<br>' + nesp;
	}
	// altura
	if (arb[onturis.prHasHeightInMeters] != undefined 
		&& arb[onturis.prHasHeightInMeters].lits != undefined) {
		var altura = getLiteral(arb[onturis.prHasHeightInMeters].lits);	
		if (altura != undefined && altura != null)
			tooltip += '<br>'+getLiteral(dict.height)+': '+altura+'m';
	}
	// diámetro
	if (arb[onturis.prHasDBH1InMillimeters] != undefined 
		&& arb[onturis.prHasDBH1InMillimeters].lits != undefined
		&& arb[onturis.prHasDBH2InMillimeters] != undefined 
		&& arb[onturis.prHasDBH2InMillimeters].lits != undefined) {
		var dbh1 = getLiteral(arb[onturis.prHasDBH1InMillimeters].lits);
		var dbh2 = getLiteral(arb[onturis.prHasDBH2InMillimeters].lits);
		if (dbh1 != undefined && dbh1 != null && dbh2 != undefined && dbh2 != null) {
			// calculo media geométrica
			var dbh = Math.round(Math.sqrt(dbh1*dbh2));			
			tooltip += '<br>'+getLiteral(dict.diameter)+': '+dbh+'mm';
		}
	}
	/*
	if (arb['http://gsic.uva.es/ifn3/ontology/hasDBH1InMillimeters'] != undefined 
		&& arb['http://gsic.uva.es/ifn3/ontology/hasDBH1InMillimeters'].lits != undefined) {
		var dbh1 = getLiteral(arb['http://gsic.uva.es/ifn3/ontology/hasDBH1InMillimeters'].lits);	
		if (dbh1 != undefined && dbh1 != null)
			tooltip += '<br>Dbh1: '+dbh1+'mm';
	}
	if (arb['http://gsic.uva.es/ifn3/ontology/hasDBH2InMillimeters'] != undefined 
		&& arb['http://gsic.uva.es/ifn3/ontology/hasDBH2InMillimeters'].lits != undefined) {
		var dbh2 = getLiteral(arb['http://gsic.uva.es/ifn3/ontology/hasDBH2InMillimeters'].lits);	
		if (dbh2 != undefined && dbh2 != null)
			tooltip += '<br>Dbh2: '+dbh2+'mm';
	}*/
	return tooltip;
}
function quitarArboles() {
	// borro la capa de árboles
	Arbs.clearLayers();
	// inicializo la lista de parcelas pintadas en modo árbol
	Sesion.parbsPintadas = {};
	// inicializo la lista de árboles pintados
	Sesion.arbsPintados = {};	
}
