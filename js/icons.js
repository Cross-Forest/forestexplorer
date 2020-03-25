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

// ICONOS
function generaIconos() {
	// creo objeto inicial (variable global)
	Iconos = {};
	// genero icono genérico de arbol
	Iconos.arbol = {};
	Iconos.arbol.nor = generaIconoArbol( config.treeicon );
	Iconos.arbol.des = generaIconoArbol( config.treeicon + '_des' );
	// genero iconos por familia
	_.each(_.keys(config.familyicons), function(furi) {
		// inicializo objeto
		Iconos[furi] = {};
		// iconos normal y deshabilitado
		Iconos[furi].nor = generaIconoArbol( config.familyicons[furi] );
		Iconos[furi].des = generaIconoArbol( config.familyicons[furi] + '_des' );
		// iconos de colores
		_.each(config.colespinds, function(cind) {
			Iconos[furi][cind] = generaIconoArbol( config.familyicons[furi] + cind );
		});
	});
	// genero iconos de lugar por colores
	// a partir de https://github.com/pointhi/leaflet-color-markers
	Iconos.lugar = new L.Icon({
		iconUrl: 'images/marker-icon-2x-blue.png',
		shadowUrl: 'images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41]
	});
	// inicializo iconos de especies
	Iconos.especies = {};
}
function generaIconoArbol(nfich) {
	return L.icon({
		iconUrl: 'images/' + nfich + '.png',
		iconSize:     [100, 100], // size of the icon
		iconAnchor:   [50, 95], // point of the icon which will correspond to marker's location
		tooltipAnchor:[10, -40], // point from which tooltips will "open", relative to the icon anchor
	});	
}
function getIconoArbol(arb) {
	// lo primero es ver qué tipo de icono toca
	var icono = Iconos.arbol; // valor por defecto
	var spuri = getMoreSpecificSpecies(arb.types);
	if (spuri != undefined) {
		// si no está definido el icono de la especie, lo calculo
		if (Iconos.especies[spuri] == undefined) {
			var icaux = Iconos.arbol; // valor por defecto
			// analizamos las familias
			_.each(_.keys(config.familyicons), function(furi) {
				// compruebo si está incluido spuri en la lista de uris expandida de la familia
				if ( _.contains(Datinv.especies[furi].expuris, spuri) )
					icaux = Iconos[furi]; // ¡es de la familia!
			});	
			// guardo para luego
			Iconos.especies[spuri] = icaux;
		}
		// asigno el icono
		icono = Iconos.especies[spuri];	
	}
	
	// y luego vemos si está seleccionado a partir de la especie	
	// si no hay selección, icono normal o no hay tipo del árbol (¡caso raro!)
	if (Sesion.espfilturis.length == 0)
		return icono.nor; // devuelvo icono normal
		
	// HAY UNA O MÁS ESPECIES SELECCIONADAS
	// si no hay especie del árbol (¡caso raro!), icono deshabilitado
	if (spuri == undefined)
		return icono.des;
	// sí hay especie
	var cindsel = null;
	var numexpurissel = null;
	// analizo cada especie filtrada	
	_.each(Sesion.espfilturis, function(efuri, ind) {
		// si alguna especie de árbol coincide...
		if ( _.contains(Datinv.especies[efuri].expuris, spuri) ) {
			// incluyo sólo si numexpurissel es null o si el número de expuris es menor que numexpurissel
			if (numexpurissel == null || Datinv.especies[efuri].expuris.length < numexpurissel) {
				// guardo color y número de expuris
				cindsel = Sesion.espfiltcolinds[ind];
				numexpurissel = Datinv.especies[efuri].expuris.length;
			}		
		}	
	});
	// si hay selección la devuelvo
	if (cindsel != null)
		return icono[cindsel];
	else // en otro caso, icono deshabilitado
		return icono.des;
}