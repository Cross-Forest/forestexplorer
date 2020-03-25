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

// PARCELAS
function pintarParcelasBox(box) {
	// preparo radio para pintar según el zoom	
	var zoom = Map.getZoom();
	var radio = config.radioParcela; // valor por defecto
	if (zoom > config.zCambioRadio)
		radio = config.radioParcela - (config.radioParcela - config.radioParcelaN3)*(zoom - config.zCambioRadio)/(config.zArbol - config.zCambioRadio); // 25m será el radio mínimo
		
	// si no coincide el radio con el de la sesión, me cargo la capa
	if (radio != Sesion.radioParcsPintadas)
		quitarParcelas();
	// guardo radio sesión
	Sesion.radioParcsPintadas = radio;

	// ¿cuántas parcelas hay pintadas en la capa?
	var nplots = _.keys(Sesion.parcsPintadas).length;
	
	// obtenemos las parcelas a pintar
	var plots = []; // parcelas a pintar
	_.each(box, function(ploturi) {
		// sólo pintamos si no estaba la parcela en la capa
		if (Sesion.parcsPintadas[ploturi] == undefined) {
			// guardo la parcela en la lista
			plots.push(Datinv.parcelas[ploturi]);
		}
	});
			
	// logging del rendering
	//console.log("Rendering de parcelas: " + _.keys(Sesion.parcsPintadas).length + " pintadas - " + plots.length +" pendientes");
	
	// actualizo color y tooltips de las parcelas ya pintadas
	ajustarColorTooltipsParcelas(box, true);
	
	// preparo círculos de radio 300m para representar las parcelas	
	var vmax = Number($("#colorsatInputId").val());	
	_.each(plots, function(plot) {
		pintarParcela(plot, vmax);
	});
}
function pintarParcela(plot, vmax) {
	var radio = Sesion.radioParcsPintadas; // metros...
	// obtengo límites del rectángulo
	var pcentro = L.latLng(plot.lat, plot.lng);	
	// colores
	var colint = colorParcela(plot, false, vmax);
	var colext = colorParcela(plot, true, vmax);
	// si hay varios colores...
	if (Array.isArray(colint)) {
		// creo un sector circular por color
		var grados = 360/colint.length;
		Sesion.parcsPintadas[plot.uri] = [];
		for (var ind=0; ind<colint.length; ind++) {
			Sesion.parcsPintadas[plot.uri].push(
				L.circle(pcentro, {color: colext, weight: 2, fillColor: colint[ind],
						fillOpacity: 0.5, radius: radio, startAngle: grados*ind, endAngle: grados*(ind+1)})
					.bindTooltip(tooltipParcela(plot))
					.on('dblclick ', function(e) { Map.setView([plot.lat, plot.lng], config.zArbol + 2); }) // añado aquí también handler de dblclick 	
				.addTo(Parcs)
			);
		}
	}
	else { // sólo un color
		// creo círculo y lo guardo, lo añado al layer group, pongo popup y pongo handler de click en el enlace de ir a parcela			
		Sesion.parcsPintadas[plot.uri] = L.circle(pcentro, {color: colext, weight: 2, fillColor: colint,
				fillOpacity: 0.5, radius: radio})
			.bindTooltip(tooltipParcela(plot))
			.on('dblclick ', function(e) { Map.setView([plot.lat, plot.lng], config.zArbol + 2); }) // añado aquí también handler de dblclick 	
			.addTo(Parcs);			
	}
}
function colorParcela(plot, esBorde, vmax) {
	if (esBorde) {
		var color = config.colplots[config.colplotind][6]; // color por defecto
		// si hay especies seleccionadas el color puede cambiar
		if (Sesion.espfilturis.length > 0) {
			// preparo colores a mezclar
			var cols = [];
			_.each(Sesion.espfilturis, function(spuri, ind) {
				if (numArbsEspecie(plot.narbs, spuri) > 0) {
					var caux = config.colplots[Sesion.espfiltcolinds[ind]][6];
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
				if (numArbsEspecie(plot.narbs, spuri) > 0) {
					var caux = getColor(numArbsEspecie(plot.narbs, spuri), vmax, config.colplots[Sesion.espfiltcolinds[ind]]);
					cols.push(caux);
				}
			});
			// resultado de la mezcla
			if (cols.length == 1) // sólo uno
				color = cols[0];
			else if (cols.length > 1) { // toca mezclar
				return cols; // devuelvo un vector con los colores				
				/* si quiero mezclar colores
			
				var cms = [];
				_.each(cols, function(micol) {
					cms.push($.Color(micol));
				});
				color = Color_mixer.mix(cms);*/
			}			
		}
		else // sin especie seleccionada
			color = getColor(numArbsEspecie(plot.narbs, onturis.tree), vmax, config.colplots[config.colplotind]);
			
		return color;
	}
}
function ajustarColorTooltipsParcelas(puris, acttooltips) {
	// el número de árboles se habrá guardado en el campo narbs de cada parcela (por especie!)
	var vmax = Number($("#colorsatInputId").val());
	// ajusto color parcela a parcela (y tooltips si hace falta)
	_.each(puris, function(puri) {
		if (Sesion.parcsPintadas[puri] != undefined) {
			var plot = Datinv.parcelas[puri];
			var colint = colorParcela(plot, false, vmax);
			var colext = colorParcela(plot, true, vmax);
			// número de colores
			var newnc = Array.isArray(colint)? colint.length : 1;
			var oldnc = Array.isArray(Sesion.parcsPintadas[puri])? Sesion.parcsPintadas[puri].length : 1;
			if (newnc != oldnc) { // toca repintar la parcela...
				// quito lo anterior
				if (oldnc == 1)
					Parcs.removeLayer(Sesion.parcsPintadas[puri]);
				else {
					_.each(Sesion.parcsPintadas[puri], function(ppint) {
						Parcs.removeLayer(ppint);
					});				
				}
				// repinto la parcela
				pintarParcela(plot, vmax);
			}
			else { // sólo cambio el color y ajusto el tooltip si se pide
				if (newnc == 1) {
					// cambio el color de la parcela
					Sesion.parcsPintadas[puri].setStyle( {fillColor: colint, color: colext} );					
					// actualizo el tooltip si se pide
					if (acttooltips)
						Sesion.parcsPintadas[puri].bindTooltip(tooltipParcela(plot));
				}
				else {
					_.each(Sesion.parcsPintadas[puri], function(ppint, ind) {
						// cambio el color de la parcela
						Sesion.parcsPintadas[puri][ind].setStyle( {fillColor: colint[ind], color: colext} );					
						// actualizo el tooltip si se pide
						if (acttooltips)
							Sesion.parcsPintadas[puri][ind].bindTooltip(tooltipParcela(plot));
					});
				}
			}				
		}
	});
}
function tooltipParcela(plot, quitarleyendazoom) {
	// preparo plantilla para el mustache
	// (reutilizo la de provincia de momento)
	var parctemp = {};
	// nombre parcela
	parctemp.plot = getLiteral(dict.plot)+ " " + uriToLiteral(plot.uri);
	// provincia
	if (plot.prov != undefined && plot.prov != null)
		parctemp.prov = getLiteral(dict.provinceof)+' '+plot.prov;
	// hay leyenda?
	if (quitarleyendazoom == undefined || quitarleyendazoom == false)
		parctemp.hayleyendazomm = true;
	// encabezado (especies)
	parctemp.head = [];
	parctemp.head.push(''); // primera celda del encabezado vacío
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
		parctemp.head.push(nesp);
	});
	// si no hay especies seleccionadas no pongo tabla
	if (Sesion.espfilturis.length == 0)
		parctemp.notabla = true;
	// todas las especies
	parctemp.head.push( getLiteral(dict.all) );
	// datos
	parctemp.rows = [];
	
	// datos árboles inventario
	var numarbstotal = numArbsEspecie(plot.narbs, onturis.tree);
	var row = {};
	row.head = getLiteral(dict.treesinv);
	row.els = [];
	_.each(Sesion.espfilturis, function(spuri) {
		var narbsesp = numArbsEspecie(plot.narbs, spuri);
		if (narbsesp > 0) { // si hay árboles...
			var val = narbsesp.toLocaleString();
			// pongo porcentaje de la especie si tengo el número de todos los árboles
			if (numarbstotal > 0) {
				var perc = 100 * narbsesp / numarbstotal;
				val +=' (' + perc.toFixed(1) + '%)';
			}				
			row.els.push(val);		
		}
		else
			row.els.push( '' );
	});
	// todas las especies
	row.els.push( numarbstotal );
	// incluyo fila
	parctemp.rows.push(row);

	// datos de existencias
	if (plot[onturis.prContainsSpecies2] != undefined) {
		// preparo objetos para iterar
		var objs = [];
		objs.push( { "prop" : onturis.prNumberTreesPlot, "head" : getLiteral(dict.numbertreesHA) } );
		objs.push( { "prop" : onturis.prBasalAreaPlot, "head" : getLiteral(dict.basalareaHA) } );
		objs.push( { "prop" : onturis.prVolumeWithBarkPlot, "head" : getLiteral(dict.volumewithbarkHA) } );
		// itero
		_.each(objs, function(obj) {
			var row = {};
			row.head = obj.head;
			row.els = [];
			// suma total
			var sumtotal = sumPropInfoEspecies(plot[onturis.prContainsSpecies2].ovals, obj.prop, onturis.tree);
			// especies seleccionadas (si las hay)
			_.each(Sesion.espfilturis, function(spuri) {
				// obtengo suma de la especies
				var sumesp = sumPropInfoEspecies(plot[onturis.prContainsSpecies2].ovals, obj.prop, spuri);
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
			parctemp.rows.push(row);	
		});
	}
	
	// obtengo el tooltip y lo devuelvo
	return Mustache.render(plotTooltipTemplate, parctemp);
}
function numArbsEspecie(narbs, spuri) {
	// obtengo número de árboles por especie
	var num = 0;
	var allspuris = _.keys(narbs); // obtengo las especies de la parcela o provincia
	_.each(allspuris, function (evspuri) {
		if (spuri === onturis.tree) // en caso de árbol genérico, siempre adentro
			num += narbs[evspuri];
		else {
			// compruebo si está contenida evspuri en la lista de especies expandida de spuri
			if ( _.contains(Datinv.especies[spuri].expuris, evspuri) )
				num += narbs[evspuri];
		}	
	});
	return num;
}
function sumPropInfoEspecies(infospuris, propuri, spuri) {
	// obtengo suma de valores de la propiedad propuri para la especie spuri en el conjunto de infospuris
	var sum = 0;
	// analizo cada objeto infoEspecies para hacer el conteo
	_.each(infospuris, function(iuri) {
		// si hay algo en la propiedad continúo
		if (Datinv.infoEspecies[iuri][propuri] != undefined && Datinv.infoEspecies[iuri][propuri].lits != undefined) {
			// obtengo valor
			var valor = Number(getLiteral(Datinv.infoEspecies[iuri][propuri].lits));
			// sumo si coincide con la especie
			if (spuri === onturis.tree) // en caso de árbol genérico, siempre adentro
				sum += valor;
			else {
				// compruebo si la especie del elemento infoEspecies está en la lista de especies expandida de spuri
				var iespuris = Datinv.infoEspecies[iuri][onturis.prHasSpeciesIFN].ovals;
				if (iespuris != undefined) {
					if ( _.intersection(Datinv.especies[spuri].expuris, iespuris).length > 0 )
						sum += valor;
				}
			}	
		}
	});	
	return sum;
}
function quitarParcelas() {
	// borro la capa de parcelas
	Parcs.clearLayers();
	// inicializo la lista de parcelas pintadas
	Sesion.parcsPintadas = {};	
}