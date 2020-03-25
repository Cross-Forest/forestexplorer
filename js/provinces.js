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

// PROVINCIAS
function cargarProvincias() {
	// cargo geoJSON de las provincias
	Geoprovs = L.geoJson(provs, {
		style: estiloProvincia,
		onEachFeature: enCadaProvincia
	}).addTo(Map);
}
function quitarProvincias() {
	// quito capa de provincias
	Map.removeLayer(Geoprovs);
}

// llamada para evitar repintar toda la capa...
function ajustarColorTooltipsProvincias() {
	_.each(provs.features, function(prov) {
		var layer = _.find(Geoprovs._layers, function(layer) {
			return layer.feature.properties.codigo === prov.properties.codigo;
		});
		// obtengo colores y ajusto estilo
		var colint = colorProvincia(prov.properties, false);
		var colext = colorProvincia(prov.properties, true);
		layer.setStyle( {fillColor: colint, color: colext} );
		// reajusto tooltips
		var tooltip = tooltipProvincia(prov);
		layer.bindTooltip(tooltip);
	});
}


// ESTILOS PROVINCIAS
// preparo estilo polígonos
function estiloProvincia(feature) {
    return {
        fillColor: colorProvincia(feature.properties, false), // color de relleno  
        weight: 2,
        opacity: 1,
        color: colorProvincia(feature.properties, true),
        dashArray: '1',
        fillOpacity: 0.4
    };
}
function realceProvincia(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 4,
        dashArray: '',
        fillOpacity: 0.6
    });
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }    
    // actualizo info provincia
    //Info.actProv(layer.feature.properties);
}
function quitarRealceProvincia(e) {
    Geoprovs.resetStyle(e.target);
	// quito info provincia
    //Info.actProv();
}
function zoomProvincia(e) {
	Map.fitBounds(e.target.getBounds());
	L.DomEvent.stopPropagation(e); // para que el mapa no haga doubleClickZoom 
}
function enCadaProvincia(feature, layer) {
	// preparo tooltips
	var tooltip = tooltipProvincia(feature);
	layer.bindTooltip(tooltip, { sticky: true });
	// eventos de realce y zoom
    layer.on({
        mouseover: realceProvincia,
        mouseout: quitarRealceProvincia,
		dblclick: zoomProvincia 
		//click: zoomProvincia => lo cambio por un doble click para que vaya bien en móviles
    });
}
function tooltipProvincia(feature) {
	var prprops = feature.properties;
		
	// preparo plantilla para el mustache
	var prtemp = {};
	prtemp.prov = feature.properties.provincia;
	// encabezado (especies)
	prtemp.head = [];
	prtemp.head.push(''); // primera celda del encabezado vacío
	// especies seleccionadas (si las hay)
	_.each(Sesion.espfilturis, function(spuri) {
		var nesp = firstUppercase(getLiteral(Datinv.especies[spuri][onturis.prVulgarName].lits, uriToLiteral(spuri)));
		// si hay nombre científico...
		if (Sesion.nomci) {
			nesp = firstUppercase(getLiteral(Datinv.especies[spuri][onturis.prScientificName].lits,
					nesp));
			// en cursiva
			nesp = '<i>' + nesp + '</i>';
		}
		prtemp.head.push(nesp);
	});
	// si no hay especies seleccionadas no pongo tabla
	if (Sesion.espfilturis.length == 0)
		prtemp.notabla = true;
	// todas las especies
	prtemp.head.push( getLiteral(dict.all) );
	// datos
	prtemp.rows = [];	
	
	// datos árboles
	if (prprops.narbs != undefined) {
		var row = {};
		row.head = getLiteral(dict.treesinv);
		row.els = [];
		// especies seleccionadas (si las hay)
		_.each(Sesion.espfilturis, function(spuri) {
			if (numArbsEspecie(prprops.narbs, spuri) > 0) { // si hay árboles...
				var val = numArbsEspecie(prprops.narbs, spuri).toLocaleString();
				// pongo porcentaje de la especie si tengo el número de todos los árboles
				if (numArbsEspecie(prprops.narbs, onturis.tree) > 0) {
					var perc = 100 * numArbsEspecie(prprops.narbs, spuri) / numArbsEspecie(prprops.narbs, onturis.tree);
					val +=' (' + perc.toFixed(1) + '%)';
				}				
				row.els.push(val);
			}
			else
				row.els.push( '' );
		});
		// todas las especies
		row.els.push( numArbsEspecie(prprops.narbs, onturis.tree).toLocaleString() );
		// incluyo fila
		prtemp.rows.push(row);
	}
	// datos parcelas
	if (prprops.nallparcs != undefined) {	
		var row = {};
		row.head = getLiteral(dict.plotsinv);
		row.els = [];
		// especies seleccionadas (si las hay)
		_.each(Sesion.espfilturis, function(spuri) {
			if (prprops.nparcs != undefined && prprops.nparcs[spuri] != undefined && prprops.nparcs[spuri] > 0) { // si hay parcelas...
				var val = prprops.nparcs[spuri].toLocaleString();
				// pongo porcentaje de parcelas de la especie
				if (prprops.nallparcs > 0) {
					var perc = 100 * prprops.nparcs[spuri] / prprops.nallparcs;
					val +=' (' + perc.toFixed(1) + '%)';
				}
				row.els.push(val);
			}
			else
				row.els.push( '' );			
		});
		// todas las especies
		row.els.push( prprops.nallparcs );
		// incluyo fila
		prtemp.rows.push(row);
	}
	
	// datos de existencias
	if (prprops.infoEspecies != undefined) {
		// preparo objetos para iterar
		var objs = [];
		objs.push( { "prop" : onturis.prNumberTrees, "head" : getLiteral(dict.numbertrees) } );
		objs.push( { "prop" : onturis.prBasalArea, "head" : getLiteral(dict.basalarea) } );
		objs.push( { "prop" : onturis.prVolumeWithBark, "head" : getLiteral(dict.volumewithbark) } );
		// itero
		_.each(objs, function(obj) {
			var row = {};
			row.head = obj.head;
			row.els = [];
			// suma total (con redondeo)
			var sumtotal = Math.round(sumPropInfoEspecies(prprops.infoEspecies, obj.prop, onturis.tree));
			// especies seleccionadas (si las hay)
			_.each(Sesion.espfilturis, function(spuri) {
				// obtengo suma de la especies (con redondeo)
				var sumesp = Math.round(sumPropInfoEspecies(prprops.infoEspecies, obj.prop, spuri));
				if (sumesp != 0) {
					var val = sumesp.toLocaleString();
					// pongo porcentaje
					if (sumtotal > 0) {
						var perc = 100 * sumesp / sumtotal;
						val +=' (' + perc.toFixed(1) + '%)';				
					}
					row.els.push(val);
				}
				else 
					row.els.push( '' );		
			});
			// todas las especies
			row.els.push( sumtotal.toLocaleString() );
			// incluyo fila
			prtemp.rows.push(row);	
		});
	}
	
	// ¿no hay datos?
	if (prtemp.rows.length == 0)
		prtemp.norows = true;
	
	// obtengo el tooltip y lo devuelvo
	return Mustache.render(provTooltipTemplate, prtemp);
}
function colorProvincia(prprops, esBorde) {
	if (esBorde) {
		var color = config.colplots[config.colplotind][4]; // color por defecto
		// si hay especies seleccionadas el color puede cambiar
		if (Sesion.espfilturis.length > 0) {
			// preparo colores a mezclar
			var cols = [];
			_.each(Sesion.espfilturis, function(spuri, ind) {
				if (numArbsEspecie(prprops.narbs, spuri) > 0) {
					var caux = config.colplots[Sesion.espfiltcolinds[ind]][4];
					cols.push(caux);
				}
			});
			// resultado de la mezcla
			if (cols.length == 1) // sólo uno
				color = cols[0];
			else if (cols.length > 1) { // toca mezclar
				var cms = [];
				_.each(cols, function(micol) {
					cms.push($.Color(micol));
				});
				color = Color_mixer.mix(cms);
			}			
		}
		return color;
	}
	else { // interior
		var color = config.colplots[config.colplotind][0]; // color por defecto
		// si hay especies seleccionadas el color puede cambiar
		if (Sesion.espfilturis.length > 0) {
			// preparo colores a mezclar
			var cols = [];
			_.each(Sesion.espfilturis, function(spuri, ind) {
				if (numArbsEspecie(prprops.narbs, spuri) > 0) {
					// obtengo máximo de árboles de la especie en cuestión		
					var lnarbs = _.map(provs.features, function(ft) { 
						return numArbsEspecie(ft.properties.narbs, spuri); 
					});
					var narbsmax = _.max(lnarbs);
					// obtengo color y guardo
					var caux = getColor(numArbsEspecie(prprops.narbs, spuri), narbsmax, config.colplots[Sesion.espfiltcolinds[ind]]);
					cols.push(caux);
				}
			});
			// resultado de la mezcla
			if (cols.length == 1) // sólo uno
				color = cols[0];
			else if (cols.length > 1) { // toca mezclar
				var cms = [];
				_.each(cols, function(micol) {
					cms.push($.Color(micol));
				});
				color = Color_mixer.mix(cms);
			}			
		}
		else { // sin especie seleccionada
			if (numArbsEspecie(prprops.narbs, onturis.tree) > 0) {
				// obtengo máximo de árboles
				var lnarbs = _.map(provs.features, function(ft) { 
					return numArbsEspecie(ft.properties.narbs, onturis.tree);
				});
				var narbsmax = _.max(lnarbs);
				color = getColor(numArbsEspecie(prprops.narbs, onturis.tree), narbsmax, config.colplots[config.colplotind]);
			}
		}		
		return color;
	}
}